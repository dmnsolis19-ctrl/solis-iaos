export interface TelemetrySample {
  sampleIndex: number;
  variableId: string;
  mappingId: string;
  offsetMs?: number;
  dataType: "BOOLEAN" | "INT64" | "FLOAT64" | "STRING";
  value?: boolean | number | string;
  unitCode?: string;
  quality: "GOOD" | "UNCERTAIN" | "BAD" | "NO_DATA";
  qualityDetail: string;
}

export interface TelemetryEnvelope {
  schemaVersion: "1.0";
  messageId: string;
  gatewayId: string;
  sessionId: string;
  sequence: number;
  sourceTime: string;
  clockStatus: "SYNCED" | "UNSYNCED" | "UNKNOWN";
  configVersion: number;
  samples: TelemetrySample[];
}

export interface GatewayIdentity {
  id: string;
  tenantId: string;
  topicKey: string;
  clientId: string;
  lifecycleState: string;
  activeConfigVersion: number | null;
}

export interface TransportPorts {
  /** Lookup must be tenant-scoped and use the authenticated topic's key. */
  findGateway(tenantId: string, topicKey: string): Promise<GatewayIdentity | undefined>;
  /** Compile the canonical JSON Schema, with formats enabled; do not hand-roll it. */
  validateEnvelope(value: unknown): value is TelemetryEnvelope;
}

export class IngestionBoundaryError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "IngestionBoundaryError";
    this.code = code;
  }
}

const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const topicPattern = new RegExp(
  `^solis/v1/tenants/(${uuid})/gateways/([a-zA-Z0-9_-]{1,128})/telemetry$`,
  "u",
);
const uuidPattern = new RegExp(`^${uuid}$`, "iu");

/**
 * Only accept bodies from the IAM-protected IoT Rule queue. These metadata fields
 * are NOT proof of identity on an HTTP endpoint or an arbitrary queue producer.
 * Never log the body, connection strings, certificates, or raw validation errors.
 */
export async function resolveTransportContext(body: string, ports: TransportPorts) {
  if (Buffer.byteLength(body, "utf8") > 262_144) {
    throw new IngestionBoundaryError("MESSAGE_TOO_LARGE");
  }
  let candidate: unknown;
  try {
    candidate = JSON.parse(body);
  } catch {
    throw new IngestionBoundaryError("INVALID_JSON");
  }
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new IngestionBoundaryError("INVALID_TRANSPORT");
  }
  const { mqtt_topic, mqtt_client_id, broker_timestamp, ...envelope } = candidate as Record<
    string,
    unknown
  >;
  if (
    typeof mqtt_topic !== "string" ||
    typeof mqtt_client_id !== "string" ||
    mqtt_client_id.length < 1 ||
    mqtt_client_id.length > 128 ||
    typeof broker_timestamp !== "number" ||
    !Number.isSafeInteger(broker_timestamp) ||
    broker_timestamp < 0 ||
    broker_timestamp > 8_640_000_000_000_000
  ) {
    throw new IngestionBoundaryError("INVALID_TRANSPORT");
  }
  const match = topicPattern.exec(mqtt_topic);
  if (match === null) throw new IngestionBoundaryError("INVALID_TELEMETRY_TOPIC");
  const tenantId = match[1]!.toLowerCase();
  const topicKey = match[2]!;
  if (!ports.validateEnvelope(envelope)) {
    throw new IngestionBoundaryError("INVALID_ENVELOPE");
  }
  // JSON numeric values beyond this bound lose sequence precision before PostgreSQL sees them.
  if (!Number.isSafeInteger(envelope.sequence) || envelope.sequence < 0) {
    throw new IngestionBoundaryError("UNSAFE_SEQUENCE");
  }

  const gateway = await ports.findGateway(tenantId, topicKey);
  if (
    gateway === undefined ||
    !uuidPattern.test(gateway.id) ||
    gateway.tenantId.toLowerCase() !== tenantId ||
    gateway.topicKey !== topicKey ||
    gateway.clientId !== mqtt_client_id ||
    gateway.id.toLowerCase() !== envelope.gatewayId.toLowerCase()
  ) {
    throw new IngestionBoundaryError("GATEWAY_IDENTITY_MISMATCH");
  }
  if (gateway.lifecycleState !== "ACTIVE") {
    throw new IngestionBoundaryError("GATEWAY_NOT_ACTIVE");
  }
  if (gateway.activeConfigVersion !== envelope.configVersion) {
    throw new IngestionBoundaryError("CONFIG_VERSION_MISMATCH");
  }
  return {
    tenantId,
    gatewayId: gateway.id.toLowerCase(),
    brokerTime: new Date(broker_timestamp).toISOString(),
    envelope,
  };
}
