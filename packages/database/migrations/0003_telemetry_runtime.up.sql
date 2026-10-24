-- Explicit transport identity; existing gateways remain unbound until provisioned.
ALTER TABLE connectivity.gateway ADD COLUMN mqtt_topic_key varchar(128);
ALTER TABLE connectivity.gateway ADD COLUMN mqtt_client_id varchar(128);
CREATE UNIQUE INDEX gateway_transport_key_idx ON connectivity.gateway (tenant_id, mqtt_topic_key)
  WHERE mqtt_topic_key IS NOT NULL;
CREATE UNIQUE INDEX gateway_mqtt_client_idx ON connectivity.gateway (mqtt_client_id)
  WHERE mqtt_client_id IS NOT NULL;

ALTER TABLE telemetry.ingested_message ADD COLUMN payload_sha256 char(64);
ALTER TABLE telemetry.latest_value ADD COLUMN session_id uuid;
ALTER TABLE telemetry.latest_value ADD COLUMN sample_index smallint;

GRANT USAGE ON SCHEMA control_plane TO solis_worker_runtime;
GRANT SELECT ON control_plane.tenant TO solis_worker_runtime;

-- Maintenance runs as the migration owner, never as the API/worker login.
CREATE FUNCTION telemetry.prepare_month_partitions(p_month date) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  base_name text;
  child_name text;
  month_date date := date_trunc('month', p_month)::date;
  month_start timestamptz := month_date::timestamp AT TIME ZONE 'UTC';
  month_end timestamptz := (month_date + interval '1 month')::timestamp AT TIME ZONE 'UTC';
BEGIN
  IF p_month IS NULL THEN RAISE EXCEPTION 'partition month is required'; END IF;
  FOREACH base_name IN ARRAY ARRAY['sample', 'aggregate_1m', 'aggregate_1h', 'ingestion_rejection'] LOOP
    child_name := base_name || '_' || to_char(month_date, 'YYYYMM');
    EXECUTE format('CREATE TABLE IF NOT EXISTS telemetry.%I PARTITION OF telemetry.%I FOR VALUES FROM (%L) TO (%L)',
      child_name, base_name, month_start, month_end);
    EXECUTE format('ALTER TABLE telemetry.%I ENABLE ROW LEVEL SECURITY', child_name);
    EXECUTE format('ALTER TABLE telemetry.%I FORCE ROW LEVEL SECURITY', child_name);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policy WHERE polrelid = to_regclass('telemetry.' || child_name)
        AND polname = 'tenant_isolation'
    ) THEN
      EXECUTE format('CREATE POLICY tenant_isolation ON telemetry.%I USING (tenant_id = platform.current_tenant_id()) WITH CHECK (tenant_id = platform.current_tenant_id())', child_name);
    END IF;
    IF base_name IN ('sample', 'ingestion_rejection') THEN
      EXECUTE format('REVOKE UPDATE ON telemetry.%I FROM solis_worker_runtime', child_name);
    END IF;
  END LOOP;
END
$$;
REVOKE ALL ON FUNCTION telemetry.prepare_month_partitions(date) FROM PUBLIC;

SELECT telemetry.prepare_month_partitions((date_trunc('month', CURRENT_DATE) + (n || ' month')::interval)::date)
FROM generate_series(-1, 2) AS n;

REVOKE UPDATE ON telemetry.sample, telemetry.ingested_message, telemetry.ingestion_rejection
  FROM solis_worker_runtime;
