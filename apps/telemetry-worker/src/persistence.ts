import { createHash } from "node:crypto";

import type { TenantConnection } from "@solis/database";
import type { TelemetryEnvelope, TelemetrySample, GatewayIdentity } from "./transport-context.js";

export interface PersistencePorts {
  transaction<T>(tenantId: string, operation: (connection: TenantConnection) => Promise<T>): Promise<T>;
  resolve(body: string, lookup: (tenantId: string, topicKey: string) => Promise<GatewayIdentity | undefined>): Promise<{
    tenantId: string; gatewayId: string; envelope: TelemetryEnvelope;
  }>;
  now?: () => number;
}

export class PersistenceRejection extends Error {
  readonly code: string;
  constructor(code: string) { super(code); this.code = code; }
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function envelopeHash(envelope: TelemetryEnvelope) {
  return createHash("sha256").update(canonical({
    ...envelope, samples: [...envelope.samples].sort((a, b) => a.sampleIndex - b.sampleIndex),
  })).digest("hex");
}

function tenantHint(body: string) {
  if (Buffer.byteLength(body) > 262_144) throw new PersistenceRejection("MESSAGE_TOO_LARGE");
  let parsed;
  try { parsed = JSON.parse(body) as { mqtt_topic?: unknown }; }
  catch { throw new PersistenceRejection("INVALID_JSON"); }
  if (parsed === null || typeof parsed !== "object" || typeof parsed.mqtt_topic !== "string") {
    throw new PersistenceRejection("INVALID_TRANSPORT");
  }
  const match = /^solis\/v1\/tenants\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/gateways\/[A-Za-z0-9_-]{1,128}\/telemetry$/u.exec(parsed.mqtt_topic);
  if (match === null) throw new PersistenceRejection("INVALID_TRANSPORT");
  return match[1]!;
}

function normalizedSample(
  sample: TelemetrySample, mapping: Record<string, unknown>, envelope: TelemetryEnvelope,
  tenantId: string, gatewayId: string, siteId: string, now: number,
) {
  if (
    mapping.variable_id !== sample.variableId.toLowerCase() || mapping.data_type !== sample.dataType ||
    mapping.variable_type !== sample.dataType || mapping.enabled !== true ||
    mapping.variable_status !== "ACTIVE" || mapping.asset_status !== "ACTIVE" ||
    mapping.site_status !== "ACTIVE" || mapping.site_id !== siteId ||
    mapping.unit_code !== mapping.variable_unit ||
    (sample.unitCode !== undefined && sample.unitCode !== mapping.unit_code)
  ) throw new PersistenceRejection("MAPPING_MISMATCH");
  if (sample.dataType === "INT64" && sample.quality !== "NO_DATA") {
    const integer = BigInt(sample.value as string);
    if (integer < -9_223_372_036_854_775_808n || integer > 9_223_372_036_854_775_807n) {
      throw new PersistenceRejection("INT64_OUT_OF_RANGE");
    }
  }
  const source = Date.parse(envelope.sourceTime) + (sample.offsetMs ?? 0);
  // Local synthetic capacity gate: no poisoned clock can create an arbitrary future partition.
  if (!Number.isFinite(source) || source > now + 300_000 || source < now - 172_800_000) {
    throw new PersistenceRejection("SOURCE_TIME_OUTSIDE_WINDOW");
  }
  const present = sample.quality !== "NO_DATA";
  return {
    tenant_id: tenantId, site_id: siteId, gateway_id: gatewayId,
    variable_id: sample.variableId.toLowerCase(), mapping_id: sample.mappingId.toLowerCase(), message_id: envelope.messageId,
    sample_index: sample.sampleIndex, session_id: envelope.sessionId, sequence_number: envelope.sequence,
    config_version: envelope.configVersion, source_time: new Date(source).toISOString(),
    clock_status: envelope.clockStatus, data_type: sample.dataType,
    value_boolean: present && sample.dataType === "BOOLEAN" ? sample.value : null,
    value_int64: present && sample.dataType === "INT64" ? sample.value : null,
    value_float64: present && sample.dataType === "FLOAT64" ? sample.value : null,
    value_string: present && sample.dataType === "STRING" ? sample.value : null,
    unit_code: mapping.unit_code, quality: sample.quality, quality_detail: sample.qualityDetail,
  };
}

export function createTelemetryPersister(ports: PersistencePorts) {
  return async (body: string): Promise<"accepted" | "duplicate"> => {
    const tenantId = tenantHint(body);
    return ports.transaction(tenantId, async (connection) => {
      let siteId: string | undefined;
      const context = await ports.resolve(body, async (tenant, topicKey) => {
        if (tenant !== tenantId) throw new PersistenceRejection("TENANT_CONTEXT_MISMATCH");
        const result = await connection.query(`
          SELECT g.id, g.tenant_id AS "tenantId", g.site_id AS "siteId", g.mqtt_topic_key AS "topicKey",
                 g.mqtt_client_id AS "clientId", g.lifecycle_state AS "lifecycleState",
                 g.active_config_version AS "activeConfigVersion"
          FROM connectivity.gateway g JOIN control_plane.tenant t
            ON t.id = g.tenant_id AND t.status = 'ACTIVE'
          JOIN connectivity.gateway_config c ON c.tenant_id = g.tenant_id AND c.gateway_id = g.id
            AND c.config_version = g.active_config_version AND c.status = 'APPLIED'
          WHERE g.tenant_id = $1 AND g.mqtt_topic_key = $2 FOR SHARE OF g, t, c
        `, [tenantId, topicKey]);
        const row = result.rows[0];
        if (row === undefined) return undefined;
        siteId = String(row.siteId);
        return row as unknown as GatewayIdentity;
      });
      if (context.tenantId !== tenantId || siteId === undefined) throw new PersistenceRejection("TENANT_CONTEXT_MISMATCH");
      const { envelope, gatewayId } = context;
      if (new Set(envelope.samples.map((sample) => sample.sampleIndex)).size !== envelope.samples.length) {
        throw new PersistenceRejection("DUPLICATE_SAMPLE_INDEX");
      }
      const mappings = await connection.query(`
        SELECT m.id, m.variable_id, m.data_type, m.unit_code, m.enabled,
               v.data_type AS variable_type, v.unit_code AS variable_unit,
               v.status AS variable_status, a.site_id, a.status AS asset_status, s.status AS site_status
        FROM connectivity.signal_mapping m JOIN asset_core.variable v
          ON v.tenant_id = m.tenant_id AND v.id = m.variable_id
        JOIN asset_core.asset a ON a.tenant_id = v.tenant_id AND a.id = v.asset_id
        JOIN asset_core.site s ON s.tenant_id = a.tenant_id AND s.id = a.site_id
        WHERE m.tenant_id = $1 AND m.gateway_id = $2 AND m.config_version = $3
          AND m.id = ANY($4::uuid[]) FOR SHARE OF m, v, a, s
      `, [tenantId, gatewayId, envelope.configVersion, envelope.samples.map((sample) => sample.mappingId)]);
      const byId = new Map(mappings.rows.map((row) => [row.id, row]));
      const now = (ports.now ?? Date.now)();
      const samples = envelope.samples.map((sample) => {
        const mapping = byId.get(sample.mappingId.toLowerCase());
        if (mapping === undefined) throw new PersistenceRejection("UNKNOWN_MAPPING");
        return normalizedSample(sample, mapping, envelope, tenantId, gatewayId, siteId!, now);
      });
      const hash = envelopeHash(envelope);
      const claim = await connection.query(`
        INSERT INTO telemetry.ingested_message (tenant_id, gateway_id, message_id, session_id,
          sequence_number, schema_version, config_version, source_time, sample_count, status, payload_sha256)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'ACCEPTED',$10)
        ON CONFLICT (tenant_id, gateway_id, message_id) DO NOTHING RETURNING message_id
      `, [tenantId, gatewayId, envelope.messageId, envelope.sessionId, envelope.sequence,
        envelope.schemaVersion, envelope.configVersion, envelope.sourceTime, samples.length, hash]);
      if (claim.rows.length === 0) {
        const prior = await connection.query(`
          SELECT payload_sha256 FROM telemetry.ingested_message
          WHERE tenant_id = $1 AND gateway_id = $2 AND message_id = $3
        `, [tenantId, gatewayId, envelope.messageId]);
        if (prior.rows[0]?.payload_sha256 !== hash) throw new PersistenceRejection("MESSAGE_ID_CONTENT_CONFLICT");
        return "duplicate";
      }
      await connection.query(`
        INSERT INTO telemetry.sample (tenant_id,site_id,gateway_id,variable_id,mapping_id,message_id,
          sample_index,session_id,sequence_number,config_version,source_time,clock_status,data_type,
          value_boolean,value_int64,value_float64,value_string,unit_code,quality,quality_detail)
        SELECT tenant_id,site_id,gateway_id,variable_id,mapping_id,message_id,
          sample_index,session_id,sequence_number,config_version,source_time,clock_status,data_type,
          value_boolean,value_int64,value_float64,value_string,unit_code,quality,quality_detail
        FROM jsonb_to_recordset($1::jsonb) AS x(
          tenant_id uuid,site_id uuid,gateway_id uuid,variable_id uuid,mapping_id uuid,message_id uuid,
          sample_index smallint,session_id uuid,sequence_number bigint,config_version integer,
          source_time timestamptz,clock_status text,data_type text,value_boolean boolean,
          value_int64 bigint,value_float64 double precision,value_string text,unit_code text,
          quality text,quality_detail text)
      `, [JSON.stringify(samples)]);
      await connection.query(`
        INSERT INTO telemetry.latest_value AS prior (tenant_id,variable_id,gateway_id,message_id,
          session_id,sequence_number,sample_index,source_time,ingested_at,clock_status,data_type,
          value_boolean,value_int64,value_float64,value_string,unit_code,quality,quality_detail,state)
        SELECT DISTINCT ON (variable_id) tenant_id,variable_id,gateway_id,message_id,
          session_id,sequence_number,sample_index,source_time,ingested_at,clock_status,data_type,
          value_boolean,value_int64,value_float64,value_string,unit_code,quality,quality_detail,
          CASE WHEN quality = 'NO_DATA' THEN 'NO_DATA' WHEN quality = 'GOOD' THEN 'ONLINE' ELSE 'BAD_QUALITY' END
        FROM telemetry.sample WHERE tenant_id = $1 AND gateway_id = $2 AND message_id = $3
        ORDER BY variable_id,source_time DESC,session_id DESC,sequence_number DESC,message_id DESC,sample_index DESC
        ON CONFLICT (tenant_id,variable_id) DO UPDATE SET
          gateway_id=EXCLUDED.gateway_id,message_id=EXCLUDED.message_id,session_id=EXCLUDED.session_id,
          sequence_number=EXCLUDED.sequence_number,sample_index=EXCLUDED.sample_index,
          source_time=EXCLUDED.source_time,ingested_at=EXCLUDED.ingested_at,clock_status=EXCLUDED.clock_status,
          data_type=EXCLUDED.data_type,value_boolean=EXCLUDED.value_boolean,value_int64=EXCLUDED.value_int64,
          value_float64=EXCLUDED.value_float64,value_string=EXCLUDED.value_string,unit_code=EXCLUDED.unit_code,
          quality=EXCLUDED.quality,quality_detail=EXCLUDED.quality_detail,state=EXCLUDED.state
        WHERE (EXCLUDED.source_time,EXCLUDED.session_id,EXCLUDED.sequence_number,EXCLUDED.message_id,EXCLUDED.sample_index)
          > (prior.source_time,COALESCE(prior.session_id,'00000000-0000-0000-0000-000000000000'::uuid),
             prior.sequence_number,prior.message_id,COALESCE(prior.sample_index,-1))
      `, [tenantId, gatewayId, envelope.messageId]);
      return "accepted";
    });
  };
}
