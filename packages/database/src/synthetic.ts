import { Client, type ClientConfig } from "pg";

export const syntheticTenants = [1, 2].map((index) => {
  const uuid = (prefix: number) => `${prefix}0000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
  return {
    tenantId: uuid(9), siteId: uuid(8), templateId: uuid(7), templateVersionId: uuid(6),
    assetId: uuid(5), variableId: uuid(4), gatewayId: uuid(3), mappingId: uuid(2), adapterId: uuid(1),
    key: `solis-gw-lab-00${index}`, code: `SYNTHETIC_0${index}`,
  };
});

export async function seedSynthetic(
  config: ClientConfig, subject: string, source: NodeJS.ProcessEnv = process.env,
) {
  if (source.ALLOW_SYNTHETIC_SEED !== "true" || !["development", "test"].includes(source.NODE_ENV ?? "development")) {
    throw new Error("SYNTHETIC_SEED_REQUIRES_LOCAL_OPT_IN");
  }
  if (!subject || subject.length > 255 || /[\u0000-\u001f\u007f]/u.test(subject)) throw new Error("INVALID_SYNTHETIC_SUBJECT");
  const host = config.host ?? source.PGHOST;
  const url = config.connectionString === undefined ? undefined : new URL(config.connectionString);
  const effectiveHost = url?.hostname ?? host;
  if (!effectiveHost || !["localhost", "127.0.0.1", "postgres"].includes(effectiveHost)) throw new Error("SYNTHETIC_DATABASE_MUST_BE_LOCAL");
  const client = new Client(config);
  await client.connect();
  try {
    await client.query("BEGIN");
    for (const fixture of syntheticTenants) {
      const { tenantId, siteId, templateId, templateVersionId, assetId, variableId, gatewayId, mappingId, adapterId } = fixture;
      await client.query("SELECT set_config('app.tenant_id',$1,true)", [tenantId]);
      await client.query("INSERT INTO control_plane.tenant(id,code,name,status) VALUES($1,$2,$2,'ACTIVE') ON CONFLICT(id) DO NOTHING", [tenantId, fixture.code]);
      const owner = await client.query<{ code: string }>("SELECT code FROM control_plane.tenant WHERE id=$1", [tenantId]);
      if (owner.rows[0]?.code !== fixture.code) throw new Error("SYNTHETIC_ID_COLLISION");
      await client.query("INSERT INTO asset_core.site(id,tenant_id,code,name,timezone) VALUES($1,$2,'LAB','Synthetic lab','America/Santiago') ON CONFLICT(id) DO NOTHING", [siteId, tenantId]);
      await client.query("INSERT INTO asset_core.asset_template(id,tenant_id,code,name,status) VALUES($1,$2,'SYNTHETIC','Synthetic asset','ACTIVE') ON CONFLICT(id) DO NOTHING", [templateId, tenantId]);
      await client.query("INSERT INTO asset_core.asset_template_version(id,tenant_id,template_id,version_number,status,definition,published_at) VALUES($1,$2,$3,1,'PUBLISHED','{}',now()) ON CONFLICT(id) DO NOTHING", [templateVersionId, tenantId, templateId]);
      await client.query("INSERT INTO asset_core.asset(id,tenant_id,site_id,template_version_id,code,name) VALUES($1,$2,$3,$4,'SENSOR','Synthetic sensor') ON CONFLICT(id) DO NOTHING", [assetId, tenantId, siteId, templateVersionId]);
      await client.query("INSERT INTO asset_core.variable(id,tenant_id,asset_id,code,name,data_type,unit_code,trend_enabled) VALUES($1,$2,$3,'PRESSURE','Synthetic pressure','FLOAT64','kPa',true) ON CONFLICT(id) DO NOTHING", [variableId, tenantId, assetId]);
      await client.query(`INSERT INTO connectivity.gateway(id,tenant_id,site_id,code,name,lifecycle_state,active_config_version,mqtt_topic_key,mqtt_client_id)
        VALUES($1,$2,$3,$4,'Synthetic gateway','ACTIVE',1,$4,$4) ON CONFLICT(id) DO NOTHING`, [gatewayId, tenantId, siteId, fixture.key]);
      const desired = {
        schemaVersion: "1.0", configId: gatewayId, gatewayId, configVersion: 1,
        issuedAt: new Date().toISOString(), notBefore: null,
        adapters: [{ adapterId, protocol: "SIMULATOR", enabled: true, pollIntervalMs: 1000, parameters: {}, secretReference: null }],
        mappings: [{ mappingId, adapterId, variableId, address: "synthetic:pressure", dataType: "FLOAT64", unitCode: "kPa", scale: 1, offset: 0, enabled: true }],
      };
      await client.query("INSERT INTO connectivity.gateway_config(tenant_id,gateway_id,config_version,schema_version,desired_document,status,reported_at) VALUES($1,$2,1,'1.0',$3,'APPLIED',now()) ON CONFLICT(tenant_id,gateway_id,config_version) DO NOTHING", [tenantId, gatewayId, JSON.stringify(desired)]);
      await client.query("INSERT INTO connectivity.signal_mapping(id,tenant_id,gateway_id,variable_id,config_version,adapter_id,protocol,address,data_type,unit_code) VALUES($1,$2,$3,$4,1,$5,'SIMULATOR','synthetic:pressure','FLOAT64','kPa') ON CONFLICT(id) DO NOTHING", [mappingId, tenantId, gatewayId, variableId, adapterId]);
    }
    const first = syntheticTenants[0]!;
    const membership = await client.query<{ id: string }>("INSERT INTO control_plane.membership(tenant_id,user_subject,role_code,status) VALUES($1,$2,'OPERATOR','ACTIVE') ON CONFLICT(tenant_id,user_subject,role_code) DO UPDATE SET status='ACTIVE' RETURNING id", [first.tenantId, subject]);
    await client.query("INSERT INTO control_plane.membership_site_scope(tenant_id,membership_id,site_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING", [first.tenantId, membership.rows[0]!.id, first.siteId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally { await client.end(); }
}
