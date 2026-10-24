export interface QueueDelivery {
  messageId?: string;
  receiptHandle?: string;
  body?: string;
}

export interface DeliveryPorts {
  /** Resolve ONLY after the idempotent database transaction has committed. */
  persist(body: string): Promise<"accepted" | "duplicate">;
  acknowledge(receiptHandle: string): Promise<void>;
  observe(event: {
    event: "telemetry.delivery";
    outcome: "accepted" | "duplicate" | "retry";
    code: string;
  }): void;
}

/**
 * Invalid/poison messages are left for SQS retries and the configured redrive policy.
 * An acknowledgement failure must replay safely through database idempotency.
 * This primitive is not a consumer loop or a persistence implementation.
 */
export async function handleDelivery(message: QueueDelivery, ports: DeliveryPorts) {
  let outcome: "accepted" | "duplicate" | "retry" = "retry";
  let code = "INVALID_QUEUE_MESSAGE";
  if (message.receiptHandle && message.body) {
    try {
      const persisted = await ports.persist(message.body);
      if (persisted !== "accepted" && persisted !== "duplicate") {
        throw new Error("UNCOMMITTED_DELIVERY");
      }
      code = "ACKNOWLEDGEMENT_FAILED";
      await ports.acknowledge(message.receiptHandle);
      outcome = persisted;
      code = "COMMITTED_AND_ACKNOWLEDGED";
    } catch {
      if (code !== "ACKNOWLEDGEMENT_FAILED") code = "PERSISTENCE_FAILED";
    }
  }
  // A metrics/log sink failure must not turn an acknowledged delivery into a retry.
  try {
    ports.observe({ event: "telemetry.delivery", outcome, code });
  } catch {
    // The host must monitor the observer separately; never expose raw messages here.
  }
  return { outcome, code };
}
