import type { TenantConnection } from "@solis/database";

export interface ReadApiPorts {
  authenticate(header: string | undefined): Promise<{ subject: string; issuer: string }>;
  transaction<T>(tenantId: string, operation: (connection: TenantConnection) => Promise<T>): Promise<T>;
  now?: () => number;
  observe?: (event: { operation: string; outcome: string; code: string }) => void;
}

export type ReadOperation = "getTenant" | "listSites" | "listAssets" | "getAsset" | "getLatestValue";
export interface ReadRequest {
  operation: ReadOperation;
  authorization?: string;
  tenantId: string;
  resourceId?: string;
  query?: Record<string, unknown>;
}

export class ReadApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const roles = new Set(["TENANT_ADMIN", "INTEGRATOR_ENGINEER", "OPERATOR", "MAINTAINER", "AUDITOR"]);

function id(value: unknown): string {
  if (typeof value !== "string" || !uuid.test(value)) throw new ReadApiError(400, "INVALID_ID");
  return value.toLowerCase();
}

function pageOptions(query: Record<string, unknown>) {
  const raw = query.limit ?? "50";
  if (typeof raw !== "string" || !/^[0-9]{1,3}$/u.test(raw)) {
    throw new ReadApiError(400, "INVALID_LIMIT");
  }
  const limit = Number(raw);
  if (limit < 1 || limit > 200) throw new ReadApiError(400, "INVALID_LIMIT");
  return { limit, cursor: query.cursor === undefined ? null : id(query.cursor) };
}

function page(rows: Record<string, unknown>[], limit: number) {
  const items = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  return { items, page: { hasMore, nextCursor: hasMore ? items.at(-1)!.id : null } };
}

async function membership(connection: TenantConnection, tenantId: string, subject: string) {
  const result = await connection.query(`
    SELECT m.role_code, scope.site_id
    FROM control_plane.membership m
    JOIN control_plane.tenant t ON t.id = m.tenant_id AND t.status = 'ACTIVE'
    LEFT JOIN control_plane.membership_site_scope scope
      ON scope.tenant_id = m.tenant_id AND scope.membership_id = m.id
    WHERE m.tenant_id = $1 AND m.user_subject = $2 AND m.status = 'ACTIVE'
      AND m.valid_from <= now() AND (m.valid_until IS NULL OR m.valid_until > now())
  `, [tenantId, subject]);
  const valid = result.rows.filter((row) => typeof row.role_code === "string" && roles.has(row.role_code));
  if (valid.length === 0) throw new ReadApiError(403, "ACCESS_DENIED");
  return {
    allSites: valid.some((row) => row.role_code === "TENANT_ADMIN"),
    siteIds: [...new Set(valid.flatMap((row) => typeof row.site_id === "string" ? [row.site_id] : []))],
  };
}

function sampleValue(row: Record<string, unknown>) {
  if (row.quality === "NO_DATA") return null;
  switch (row.dataType) {
    case "BOOLEAN": return row.value_boolean;
    case "INT64": return row.value_int64;
    case "FLOAT64": return row.value_float64;
    case "STRING": return row.value_string;
    default: throw new ReadApiError(503, "INVALID_STORED_TELEMETRY");
  }
}

/** Read-only domain slice; all calls go through authentication, membership and one RLS transaction. */
export function createTenantReadApi(ports: ReadApiPorts) {
  return async (request: ReadRequest): Promise<unknown> => {
    try {
      let principal;
      try { principal = await ports.authenticate(request.authorization); }
      catch { throw new ReadApiError(401, "UNAUTHORIZED"); }
      const tenantId = id(request.tenantId);
      const query = request.query ?? {};
      const result = await ports.transaction(tenantId, async (connection) => {
        const scope = await membership(connection, tenantId, principal.subject);
        if (request.operation === "getTenant") {
          const result = await connection.query(
            "SELECT id, code, name, status, version FROM control_plane.tenant WHERE id = $1", [tenantId],
          );
          if (result.rows[0] === undefined) throw new ReadApiError(404, "NOT_FOUND");
          return result.rows[0];
        }
        if (request.operation === "listSites") {
          const { limit, cursor } = pageOptions(query);
          const result = await connection.query(`
            SELECT id, tenant_id AS "tenantId", code, name, timezone, status, version
            FROM asset_core.site WHERE tenant_id = $1 AND status = 'ACTIVE'
              AND ($2::boolean OR id = ANY($3::uuid[]))
              AND ($4::uuid IS NULL OR id > $4::uuid)
            ORDER BY id LIMIT $5
          `, [tenantId, scope.allSites, scope.siteIds, cursor, limit + 1]);
          return page(result.rows, limit);
        }
        const resourceId = id(request.resourceId);
        if (request.operation === "listAssets") {
          if (!scope.allSites && !scope.siteIds.includes(resourceId)) {
            throw new ReadApiError(403, "ACCESS_DENIED");
          }
          const { limit, cursor } = pageOptions(query);
          const status = query.status;
          if (status !== undefined && (typeof status !== "string" || !["ACTIVE", "INACTIVE", "RETIRED"].includes(status))) {
            throw new ReadApiError(400, "INVALID_STATUS");
          }
          if (status !== undefined && status !== "ACTIVE") {
            throw new ReadApiError(403, "RESOURCE_STATE_NOT_ALLOWED");
          }
          const search = query.q ?? "";
          if (typeof search !== "string" || search.length > 100) throw new ReadApiError(400, "INVALID_SEARCH");
          const result = await connection.query(`
            SELECT a.id, a.tenant_id AS "tenantId", a.site_id AS "siteId",
                   a.code, a.name, a.status, a.version
            FROM asset_core.asset a JOIN asset_core.site s
              ON s.tenant_id = a.tenant_id AND s.id = a.site_id AND s.status = 'ACTIVE'
            WHERE a.tenant_id = $1 AND a.site_id = $2 AND a.status = 'ACTIVE'
              AND ($3::text IS NULL OR a.status = $3::text)
              AND ($4::uuid IS NULL OR a.id > $4::uuid)
              AND (strpos(lower(a.name), lower($5)) > 0 OR strpos(lower(a.code), lower($5)) > 0)
            ORDER BY a.id LIMIT $6
          `, [tenantId, resourceId, status ?? null, cursor, search, limit + 1]);
          return page(result.rows, limit);
        }
        if (request.operation === "getAsset") {
          const result = await connection.query(`
            SELECT a.id, a.tenant_id AS "tenantId", a.site_id AS "siteId", a.code,
                   a.name, a.status, a.version, a.area_id AS "areaId",
                   a.parent_asset_id AS "parentAssetId", a.template_version_id AS "templateVersionId",
                   a.description
            FROM asset_core.asset a JOIN asset_core.site s
              ON s.tenant_id = a.tenant_id AND s.id = a.site_id AND s.status = 'ACTIVE'
            WHERE a.tenant_id = $1 AND a.id = $2 AND a.status = 'ACTIVE'
              AND ($3::boolean OR a.site_id = ANY($4::uuid[]))
          `, [tenantId, resourceId, scope.allSites, scope.siteIds]);
          const asset = result.rows[0];
          if (asset === undefined) throw new ReadApiError(404, "NOT_FOUND");
          const variables = await connection.query(`
            SELECT id, asset_id AS "assetId", code, name, data_type AS "dataType",
                   unit_code AS "unitCode", status
            FROM asset_core.variable WHERE tenant_id = $1 AND asset_id = $2 AND status = 'ACTIVE' ORDER BY id
          `, [tenantId, resourceId]);
          return { ...asset, variables: variables.rows };
        }
        if (request.operation !== "getLatestValue") throw new ReadApiError(404, "NOT_FOUND");
        const variable = await connection.query(`
          SELECT v.id, v.stale_after_seconds
          FROM asset_core.variable v JOIN asset_core.asset a
            ON a.tenant_id = v.tenant_id AND a.id = v.asset_id
          JOIN asset_core.site s ON s.tenant_id = a.tenant_id AND s.id = a.site_id
          WHERE v.tenant_id = $1 AND v.id = $2 AND v.status = 'ACTIVE'
            AND a.status = 'ACTIVE' AND s.status = 'ACTIVE'
            AND ($3::boolean OR a.site_id = ANY($4::uuid[]))
        `, [tenantId, resourceId, scope.allSites, scope.siteIds]);
        if (variable.rows[0] === undefined) throw new ReadApiError(404, "NOT_FOUND");
        const latest = await connection.query(`
          SELECT data_type AS "dataType", quality, quality_detail AS "qualityDetail",
                 source_time AS "sourceTime", ingested_at AS "ingestedAt", unit_code AS "unitCode",
                 value_boolean, value_int64, value_float64, value_string, state
          FROM telemetry.latest_value WHERE tenant_id = $1 AND variable_id = $2
        `, [tenantId, resourceId]);
        const row = latest.rows[0];
        // v1 requires timestamps in a 200 response; do not fabricate them for an empty variable.
        if (row === undefined) throw new ReadApiError(404, "NO_TELEMETRY_DATA");
        const sourceTime = (row.sourceTime instanceof Date ? row.sourceTime : new Date(String(row.sourceTime))).toISOString();
        const ingestedAt = (row.ingestedAt instanceof Date ? row.ingestedAt : new Date(String(row.ingestedAt))).toISOString();
        const age = (ports.now ?? Date.now)() - Date.parse(sourceTime);
        const state = row.quality === "NO_DATA" ? "NO_DATA"
          : row.quality !== "GOOD" ? "BAD_QUALITY"
          : row.state === "OFFLINE" ? "OFFLINE"
          : age > Number(variable.rows[0].stale_after_seconds) * 1000 ? "STALE" : "ONLINE";
        return {
          tenantId, variableId: resourceId, dataType: row.dataType, value: sampleValue(row),
          unitCode: row.unitCode, quality: row.quality, qualityDetail: row.qualityDetail,
          sourceTime, ingestedAt, state,
        };
      });
      try { ports.observe?.({ operation: request.operation, outcome: "success", code: "OK" }); } catch { /* log sink isolated */ }
      return result;
    } catch (error) {
      const safe = error instanceof ReadApiError ? error : new ReadApiError(503, "DEPENDENCY_UNAVAILABLE");
      try { ports.observe?.({ operation: request.operation, outcome: "denied_or_failed", code: safe.code }); } catch { /* log sink isolated */ }
      throw safe;
    }
  };
}
