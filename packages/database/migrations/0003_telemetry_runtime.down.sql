-- Partitions and their samples are intentionally retained; never drop telemetry during rollback.
DROP FUNCTION telemetry.prepare_month_partitions(date);
REVOKE SELECT ON control_plane.tenant FROM solis_worker_runtime;
REVOKE USAGE ON SCHEMA control_plane FROM solis_worker_runtime;
DROP INDEX connectivity.gateway_transport_key_idx;
DROP INDEX connectivity.gateway_mqtt_client_idx;
ALTER TABLE connectivity.gateway DROP COLUMN mqtt_topic_key;
ALTER TABLE connectivity.gateway DROP COLUMN mqtt_client_id;
ALTER TABLE telemetry.ingested_message DROP COLUMN payload_sha256;
ALTER TABLE telemetry.latest_value DROP COLUMN session_id;
ALTER TABLE telemetry.latest_value DROP COLUMN sample_index;
GRANT UPDATE ON telemetry.sample, telemetry.ingested_message, telemetry.ingestion_rejection
  TO solis_worker_runtime;
