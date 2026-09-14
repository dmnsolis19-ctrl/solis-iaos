DO $$
BEGIN
  CREATE ROLE solis_api_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE ROLE solis_worker_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE ROLE solis_readonly_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

REVOKE ALL ON SCHEMA platform, control_plane, asset_core, connectivity, telemetry, operations, audit
  FROM PUBLIC;
REVOKE ALL ON FUNCTION platform.current_tenant_id() FROM PUBLIC;

GRANT USAGE ON SCHEMA platform, control_plane, asset_core, connectivity, telemetry, operations, audit
  TO solis_api_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA
  control_plane, asset_core, connectivity, operations, platform
  TO solis_api_runtime;
GRANT SELECT ON ALL TABLES IN SCHEMA telemetry TO solis_api_runtime;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA audit TO solis_api_runtime;
GRANT EXECUTE ON FUNCTION platform.current_tenant_id() TO solis_api_runtime;

GRANT USAGE ON SCHEMA platform, asset_core, connectivity, telemetry
  TO solis_worker_runtime;
GRANT SELECT ON ALL TABLES IN SCHEMA asset_core, connectivity TO solis_worker_runtime;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA telemetry TO solis_worker_runtime;
GRANT EXECUTE ON FUNCTION platform.current_tenant_id() TO solis_worker_runtime;

GRANT USAGE ON SCHEMA platform, control_plane, asset_core, connectivity, telemetry, operations, audit
  TO solis_readonly_runtime;
GRANT SELECT ON ALL TABLES IN SCHEMA
  control_plane, asset_core, connectivity, telemetry, operations, audit
  TO solis_readonly_runtime;
GRANT EXECUTE ON FUNCTION platform.current_tenant_id() TO solis_readonly_runtime;

ALTER DEFAULT PRIVILEGES IN SCHEMA control_plane, asset_core, connectivity, operations, platform
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO solis_api_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA telemetry
  GRANT SELECT ON TABLES TO solis_api_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit
  GRANT SELECT, INSERT ON TABLES TO solis_api_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA telemetry
  GRANT SELECT, INSERT, UPDATE ON TABLES TO solis_worker_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA asset_core, connectivity
  GRANT SELECT ON TABLES TO solis_worker_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA control_plane, asset_core, connectivity, telemetry, operations, audit
  GRANT SELECT ON TABLES TO solis_readonly_runtime;
