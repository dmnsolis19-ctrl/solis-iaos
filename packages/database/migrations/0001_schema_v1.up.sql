-- SOLIS IAOS physical model v1
-- Reference DDL for Sprint 0 migrations. Do not run manually in production.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS platform;
CREATE SCHEMA IF NOT EXISTS control_plane;
CREATE SCHEMA IF NOT EXISTS asset_core;
CREATE SCHEMA IF NOT EXISTS connectivity;
CREATE SCHEMA IF NOT EXISTS telemetry;
CREATE SCHEMA IF NOT EXISTS operations;
CREATE SCHEMA IF NOT EXISTS audit;

CREATE OR REPLACE FUNCTION platform.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid
$$;

CREATE TABLE control_plane.tenant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(32) NOT NULL UNIQUE,
  name varchar(160) NOT NULL,
  status varchar(16) NOT NULL CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CLOSED')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE control_plane.membership (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES control_plane.tenant(id),
  user_subject varchar(255) NOT NULL,
  role_code varchar(40) NOT NULL CHECK (
    role_code IN ('TENANT_ADMIN', 'INTEGRATOR_ENGINEER', 'OPERATOR', 'MAINTAINER', 'AUDITOR')
  ),
  status varchar(16) NOT NULL CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  delegated_by uuid,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, user_subject, role_code),
  CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE TABLE asset_core.site (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES control_plane.tenant(id),
  code varchar(32) NOT NULL,
  name varchar(120) NOT NULL,
  timezone varchar(64) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, code)
);

CREATE TABLE control_plane.membership_site_scope (
  tenant_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  site_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, membership_id, site_id),
  FOREIGN KEY (tenant_id, membership_id)
    REFERENCES control_plane.membership(tenant_id, id),
  FOREIGN KEY (tenant_id, site_id)
    REFERENCES asset_core.site(tenant_id, id)
);

CREATE TABLE asset_core.area (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  site_id uuid NOT NULL,
  parent_area_id uuid,
  code varchar(64) NOT NULL,
  name varchar(160) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, site_id, code),
  FOREIGN KEY (tenant_id, site_id)
    REFERENCES asset_core.site(tenant_id, id),
  FOREIGN KEY (tenant_id, parent_area_id)
    REFERENCES asset_core.area(tenant_id, id)
);

CREATE TABLE asset_core.asset_template (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES control_plane.tenant(id),
  code varchar(64) NOT NULL,
  name varchar(160) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'ACTIVE', 'RETIRED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, code)
);

CREATE TABLE asset_core.asset_template_version (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  template_id uuid NOT NULL,
  version_number integer NOT NULL CHECK (version_number > 0),
  status varchar(16) NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED', 'RETIRED')),
  definition jsonb NOT NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, template_id, version_number),
  FOREIGN KEY (tenant_id, template_id)
    REFERENCES asset_core.asset_template(tenant_id, id),
  CHECK (
    (status = 'PUBLISHED' AND published_at IS NOT NULL)
    OR (status <> 'PUBLISHED')
  )
);

CREATE TABLE asset_core.asset (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  site_id uuid NOT NULL,
  area_id uuid,
  parent_asset_id uuid,
  template_version_id uuid NOT NULL,
  code varchar(64) NOT NULL,
  name varchar(160) NOT NULL,
  description varchar(2000),
  status varchar(16) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'RETIRED')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz,
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, site_id, code),
  FOREIGN KEY (tenant_id, site_id)
    REFERENCES asset_core.site(tenant_id, id),
  FOREIGN KEY (tenant_id, area_id)
    REFERENCES asset_core.area(tenant_id, id),
  FOREIGN KEY (tenant_id, parent_asset_id)
    REFERENCES asset_core.asset(tenant_id, id),
  FOREIGN KEY (tenant_id, template_version_id)
    REFERENCES asset_core.asset_template_version(tenant_id, id)
);

CREATE TABLE asset_core.variable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  code varchar(64) NOT NULL,
  name varchar(160) NOT NULL,
  data_type varchar(16) NOT NULL
    CHECK (data_type IN ('BOOLEAN', 'INT64', 'FLOAT64', 'STRING')),
  unit_code varchar(32) NOT NULL,
  trend_enabled boolean NOT NULL DEFAULT false,
  stale_after_seconds integer NOT NULL DEFAULT 300 CHECK (stale_after_seconds > 0),
  status varchar(16) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, asset_id, code),
  FOREIGN KEY (tenant_id, asset_id)
    REFERENCES asset_core.asset(tenant_id, id)
);

CREATE TABLE connectivity.gateway (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  site_id uuid NOT NULL,
  code varchar(64) NOT NULL,
  name varchar(120) NOT NULL,
  lifecycle_state varchar(16) NOT NULL DEFAULT 'REGISTERED'
    CHECK (lifecycle_state IN ('REGISTERED', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'RETIRED')),
  connection_state varchar(16) NOT NULL DEFAULT 'UNKNOWN'
    CHECK (connection_state IN ('ONLINE', 'STALE', 'OFFLINE', 'UNKNOWN')),
  certificate_ref varchar(255),
  certificate_fingerprint varchar(128),
  active_config_version integer,
  last_seen_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, site_id, code),
  UNIQUE (certificate_fingerprint),
  FOREIGN KEY (tenant_id, site_id)
    REFERENCES asset_core.site(tenant_id, id)
);

CREATE TABLE connectivity.gateway_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  gateway_id uuid NOT NULL,
  config_version integer NOT NULL CHECK (config_version > 0),
  schema_version varchar(16) NOT NULL,
  desired_document jsonb NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPLIED', 'REJECTED', 'ROLLED_BACK')),
  reason_code varchar(64),
  issued_at timestamptz NOT NULL DEFAULT now(),
  reported_at timestamptz,
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, gateway_id, config_version),
  FOREIGN KEY (tenant_id, gateway_id)
    REFERENCES connectivity.gateway(tenant_id, id)
);

CREATE TABLE connectivity.signal_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  gateway_id uuid NOT NULL,
  variable_id uuid NOT NULL,
  config_version integer NOT NULL CHECK (config_version > 0),
  adapter_id uuid NOT NULL,
  protocol varchar(32) NOT NULL
    CHECK (protocol IN ('SIMULATOR', 'MODBUS_TCP', 'MODBUS_RTU')),
  address varchar(256) NOT NULL,
  data_type varchar(16) NOT NULL
    CHECK (data_type IN ('BOOLEAN', 'INT64', 'FLOAT64', 'STRING')),
  unit_code varchar(32) NOT NULL,
  scale double precision NOT NULL DEFAULT 1,
  offset_value double precision NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, gateway_id, config_version, variable_id),
  FOREIGN KEY (tenant_id, gateway_id)
    REFERENCES connectivity.gateway(tenant_id, id),
  FOREIGN KEY (tenant_id, variable_id)
    REFERENCES asset_core.variable(tenant_id, id)
);

CREATE TABLE telemetry.ingested_message (
  tenant_id uuid NOT NULL,
  gateway_id uuid NOT NULL,
  message_id uuid NOT NULL,
  session_id uuid NOT NULL,
  sequence_number bigint NOT NULL CHECK (sequence_number >= 0),
  schema_version varchar(16) NOT NULL,
  config_version integer NOT NULL CHECK (config_version > 0),
  source_time timestamptz NOT NULL,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  sample_count integer NOT NULL CHECK (sample_count BETWEEN 1 AND 500),
  status varchar(16) NOT NULL CHECK (status IN ('PROCESSING', 'ACCEPTED', 'PARTIAL', 'REJECTED')),
  PRIMARY KEY (tenant_id, gateway_id, message_id),
  FOREIGN KEY (tenant_id, gateway_id)
    REFERENCES connectivity.gateway(tenant_id, id)
);

CREATE TABLE telemetry.sample (
  tenant_id uuid NOT NULL,
  site_id uuid NOT NULL,
  gateway_id uuid NOT NULL,
  variable_id uuid NOT NULL,
  mapping_id uuid NOT NULL,
  message_id uuid NOT NULL,
  sample_index smallint NOT NULL CHECK (sample_index BETWEEN 0 AND 499),
  session_id uuid NOT NULL,
  sequence_number bigint NOT NULL CHECK (sequence_number >= 0),
  config_version integer NOT NULL CHECK (config_version > 0),
  source_time timestamptz NOT NULL,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  clock_status varchar(16) NOT NULL
    CHECK (clock_status IN ('SYNCED', 'UNSYNCED', 'UNKNOWN')),
  data_type varchar(16) NOT NULL
    CHECK (data_type IN ('BOOLEAN', 'INT64', 'FLOAT64', 'STRING')),
  value_boolean boolean,
  value_int64 bigint,
  value_float64 double precision,
  value_string varchar(256),
  unit_code varchar(32),
  quality varchar(16) NOT NULL
    CHECK (quality IN ('GOOD', 'UNCERTAIN', 'BAD', 'NO_DATA')),
  quality_detail varchar(32) NOT NULL,
  PRIMARY KEY (tenant_id, variable_id, source_time, message_id, sample_index),
  FOREIGN KEY (tenant_id, site_id)
    REFERENCES asset_core.site(tenant_id, id),
  FOREIGN KEY (tenant_id, gateway_id)
    REFERENCES connectivity.gateway(tenant_id, id),
  FOREIGN KEY (tenant_id, variable_id)
    REFERENCES asset_core.variable(tenant_id, id),
  FOREIGN KEY (tenant_id, mapping_id)
    REFERENCES connectivity.signal_mapping(tenant_id, id),
  CHECK (
    (quality = 'NO_DATA' AND num_nonnulls(value_boolean, value_int64, value_float64, value_string) = 0)
    OR
    (quality <> 'NO_DATA' AND num_nonnulls(value_boolean, value_int64, value_float64, value_string) = 1)
  ),
  CHECK (
    (data_type = 'BOOLEAN' AND (quality = 'NO_DATA' OR value_boolean IS NOT NULL))
    OR (data_type = 'INT64' AND (quality = 'NO_DATA' OR value_int64 IS NOT NULL))
    OR (data_type = 'FLOAT64' AND (quality = 'NO_DATA' OR value_float64 IS NOT NULL))
    OR (data_type = 'STRING' AND (quality = 'NO_DATA' OR value_string IS NOT NULL))
  )
) PARTITION BY RANGE (source_time);

CREATE TABLE telemetry.latest_value (
  tenant_id uuid NOT NULL,
  variable_id uuid NOT NULL,
  gateway_id uuid NOT NULL,
  message_id uuid NOT NULL,
  sequence_number bigint NOT NULL,
  source_time timestamptz NOT NULL,
  ingested_at timestamptz NOT NULL,
  clock_status varchar(16) NOT NULL,
  data_type varchar(16) NOT NULL,
  value_boolean boolean,
  value_int64 bigint,
  value_float64 double precision,
  value_string varchar(256),
  unit_code varchar(32),
  quality varchar(16) NOT NULL,
  quality_detail varchar(32) NOT NULL,
  state varchar(16) NOT NULL
    CHECK (state IN ('ONLINE', 'STALE', 'OFFLINE', 'BAD_QUALITY', 'NO_DATA')),
  PRIMARY KEY (tenant_id, variable_id),
  FOREIGN KEY (tenant_id, variable_id)
    REFERENCES asset_core.variable(tenant_id, id),
  FOREIGN KEY (tenant_id, gateway_id)
    REFERENCES connectivity.gateway(tenant_id, id)
);

CREATE TABLE telemetry.aggregate_1m (
  tenant_id uuid NOT NULL,
  variable_id uuid NOT NULL,
  bucket_start timestamptz NOT NULL,
  sample_count integer NOT NULL CHECK (sample_count >= 0),
  good_count integer NOT NULL CHECK (good_count >= 0),
  uncertain_count integer NOT NULL CHECK (uncertain_count >= 0),
  bad_count integer NOT NULL CHECK (bad_count >= 0),
  min_value double precision,
  max_value double precision,
  avg_value double precision,
  first_value double precision,
  last_value double precision,
  PRIMARY KEY (tenant_id, variable_id, bucket_start),
  FOREIGN KEY (tenant_id, variable_id)
    REFERENCES asset_core.variable(tenant_id, id)
) PARTITION BY RANGE (bucket_start);

CREATE TABLE telemetry.aggregate_1h (
  tenant_id uuid NOT NULL,
  variable_id uuid NOT NULL,
  bucket_start timestamptz NOT NULL,
  sample_count integer NOT NULL CHECK (sample_count >= 0),
  good_count integer NOT NULL CHECK (good_count >= 0),
  uncertain_count integer NOT NULL CHECK (uncertain_count >= 0),
  bad_count integer NOT NULL CHECK (bad_count >= 0),
  min_value double precision,
  max_value double precision,
  avg_value double precision,
  first_value double precision,
  last_value double precision,
  PRIMARY KEY (tenant_id, variable_id, bucket_start),
  FOREIGN KEY (tenant_id, variable_id)
    REFERENCES asset_core.variable(tenant_id, id)
) PARTITION BY RANGE (bucket_start);

CREATE TABLE telemetry.ingestion_rejection (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  gateway_id uuid,
  message_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  code varchar(64) NOT NULL,
  safe_detail varchar(512),
  correlation_id uuid NOT NULL,
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

CREATE TABLE operations.rule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  site_id uuid NOT NULL,
  variable_id uuid NOT NULL,
  code varchar(64) NOT NULL,
  name varchar(160) NOT NULL,
  operator varchar(8) NOT NULL CHECK (operator IN ('GT', 'GTE', 'LT', 'LTE', 'EQ', 'NEQ')),
  threshold double precision NOT NULL,
  hysteresis double precision NOT NULL DEFAULT 0 CHECK (hysteresis >= 0),
  debounce_seconds integer NOT NULL DEFAULT 0 CHECK (debounce_seconds >= 0),
  severity varchar(16) NOT NULL
    CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  enabled boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, site_id, code),
  FOREIGN KEY (tenant_id, site_id)
    REFERENCES asset_core.site(tenant_id, id),
  FOREIGN KEY (tenant_id, variable_id)
    REFERENCES asset_core.variable(tenant_id, id)
);

CREATE TABLE operations.alarm (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  site_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  variable_id uuid,
  rule_id uuid NOT NULL,
  state varchar(16) NOT NULL
    CHECK (state IN ('ACTIVE', 'ACKNOWLEDGED', 'CLEARED', 'CLOSED')),
  severity varchar(16) NOT NULL
    CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  message varchar(500) NOT NULL,
  dedupe_key varchar(255) NOT NULL,
  opened_at timestamptz NOT NULL,
  acknowledged_at timestamptz,
  cleared_at timestamptz,
  closed_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, site_id)
    REFERENCES asset_core.site(tenant_id, id),
  FOREIGN KEY (tenant_id, asset_id)
    REFERENCES asset_core.asset(tenant_id, id),
  FOREIGN KEY (tenant_id, variable_id)
    REFERENCES asset_core.variable(tenant_id, id),
  FOREIGN KEY (tenant_id, rule_id)
    REFERENCES operations.rule(tenant_id, id)
);

CREATE UNIQUE INDEX alarm_open_dedupe_idx
ON operations.alarm (tenant_id, dedupe_key)
WHERE state IN ('ACTIVE', 'ACKNOWLEDGED');

CREATE TABLE operations.alarm_transition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  alarm_id uuid NOT NULL,
  from_state varchar(16),
  to_state varchar(16) NOT NULL,
  actor_type varchar(16) NOT NULL CHECK (actor_type IN ('SYSTEM', 'USER')),
  actor_id varchar(255),
  comment varchar(500),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  correlation_id uuid NOT NULL,
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, alarm_id)
    REFERENCES operations.alarm(tenant_id, id)
);

CREATE TABLE audit.audit_entry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_type varchar(24) NOT NULL
    CHECK (actor_type IN ('USER', 'SERVICE', 'GATEWAY', 'PLATFORM_ADMIN')),
  actor_id varchar(255) NOT NULL,
  action varchar(100) NOT NULL,
  resource_type varchar(80) NOT NULL,
  resource_id uuid,
  result varchar(16) NOT NULL CHECK (result IN ('SUCCESS', 'DENIED', 'FAILED')),
  reason varchar(500),
  correlation_id uuid NOT NULL,
  client_ip inet,
  before_redacted jsonb,
  after_redacted jsonb
);

CREATE TABLE platform.outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  event_type varchar(120) NOT NULL,
  aggregate_type varchar(80) NOT NULL,
  aggregate_id uuid NOT NULL,
  schema_version varchar(16) NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error_code varchar(64)
);

CREATE TABLE platform.idempotency_record (
  tenant_id uuid NOT NULL,
  actor_id varchar(255) NOT NULL,
  operation varchar(100) NOT NULL,
  idempotency_key varchar(128) NOT NULL,
  request_hash varchar(128) NOT NULL,
  response_status smallint,
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, actor_id, operation, idempotency_key),
  CHECK (expires_at > created_at)
);

CREATE INDEX membership_subject_idx
  ON control_plane.membership (user_subject, status);
CREATE INDEX asset_site_status_idx
  ON asset_core.asset (tenant_id, site_id, status, id);
CREATE INDEX variable_asset_idx
  ON asset_core.variable (tenant_id, asset_id, status);
CREATE INDEX gateway_site_idx
  ON connectivity.gateway (tenant_id, site_id, lifecycle_state);
CREATE INDEX sample_variable_time_idx
  ON telemetry.sample (tenant_id, variable_id, source_time DESC);
CREATE INDEX sample_gateway_ingested_idx
  ON telemetry.sample (tenant_id, gateway_id, ingested_at DESC);
CREATE INDEX alarm_inbox_idx
  ON operations.alarm (tenant_id, site_id, state, severity, opened_at DESC);
CREATE INDEX audit_tenant_time_idx
  ON audit.audit_entry (tenant_id, occurred_at DESC);
CREATE INDEX outbox_pending_idx
  ON platform.outbox (available_at, id)
  WHERE processed_at IS NULL;

-- RLS is enabled and forced on every tenant-owned table.
ALTER TABLE control_plane.tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_plane.tenant FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON control_plane.tenant
  USING (id = platform.current_tenant_id())
  WITH CHECK (id = platform.current_tenant_id());

ALTER TABLE control_plane.membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_plane.membership FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON control_plane.membership
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE control_plane.membership_site_scope ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_plane.membership_site_scope FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON control_plane.membership_site_scope
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE asset_core.site ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_core.site FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_core.site
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE asset_core.area ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_core.area FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_core.area
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE asset_core.asset_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_core.asset_template FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_core.asset_template
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE asset_core.asset_template_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_core.asset_template_version FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_core.asset_template_version
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE asset_core.asset ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_core.asset FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_core.asset
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE asset_core.variable ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_core.variable FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_core.variable
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE connectivity.gateway ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectivity.gateway FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON connectivity.gateway
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE connectivity.gateway_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectivity.gateway_config FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON connectivity.gateway_config
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE connectivity.signal_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectivity.signal_mapping FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON connectivity.signal_mapping
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE telemetry.ingested_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry.ingested_message FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON telemetry.ingested_message
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE telemetry.sample ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry.sample FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON telemetry.sample
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE telemetry.latest_value ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry.latest_value FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON telemetry.latest_value
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE telemetry.aggregate_1m ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry.aggregate_1m FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON telemetry.aggregate_1m
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE telemetry.aggregate_1h ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry.aggregate_1h FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON telemetry.aggregate_1h
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE telemetry.ingestion_rejection ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry.ingestion_rejection FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON telemetry.ingestion_rejection
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE operations.rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations.rule FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON operations.rule
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE operations.alarm ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations.alarm FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON operations.alarm
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE operations.alarm_transition ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations.alarm_transition FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON operations.alarm_transition
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE audit.audit_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.audit_entry FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON audit.audit_entry
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE platform.outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.outbox FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON platform.outbox
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

ALTER TABLE platform.idempotency_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.idempotency_record FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON platform.idempotency_record
  USING (tenant_id = platform.current_tenant_id())
  WITH CHECK (tenant_id = platform.current_tenant_id());

-- Runtime grants are intentionally illustrative and must be split by migration.
-- No runtime role receives ownership, TRUNCATE, BYPASSRLS or unrestricted DDL.
