REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA
  control_plane, asset_core, connectivity, telemetry, operations, audit, platform
  FROM solis_api_runtime, solis_worker_runtime, solis_readonly_runtime;
REVOKE ALL PRIVILEGES ON FUNCTION platform.current_tenant_id()
  FROM solis_api_runtime, solis_worker_runtime, solis_readonly_runtime;
REVOKE USAGE ON SCHEMA
  platform, control_plane, asset_core, connectivity, telemetry, operations, audit
  FROM solis_api_runtime, solis_worker_runtime, solis_readonly_runtime;

ALTER DEFAULT PRIVILEGES IN SCHEMA control_plane, asset_core, connectivity, operations, platform
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM solis_api_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA telemetry
  REVOKE SELECT ON TABLES FROM solis_api_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit
  REVOKE SELECT, INSERT ON TABLES FROM solis_api_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA telemetry
  REVOKE SELECT, INSERT, UPDATE ON TABLES FROM solis_worker_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA asset_core, connectivity
  REVOKE SELECT ON TABLES FROM solis_worker_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA control_plane, asset_core, connectivity, telemetry, operations, audit
  REVOKE SELECT ON TABLES FROM solis_readonly_runtime;

DROP ROLE IF EXISTS solis_api_runtime;
DROP ROLE IF EXISTS solis_worker_runtime;
DROP ROLE IF EXISTS solis_readonly_runtime;
