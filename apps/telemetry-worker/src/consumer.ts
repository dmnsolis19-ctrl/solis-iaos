import { setTimeout as delay } from "node:timers/promises";

import type { QueueDelivery } from "./delivery.js";

export interface ConsumerPorts {
  receive(signal: AbortSignal): Promise<QueueDelivery[]>;
  handle(message: QueueDelivery): Promise<unknown>;
  renew(receiptHandle: string): Promise<void>;
  observe(code: string): void;
  wait?: (signal: AbortSignal) => Promise<unknown>;
  renewEveryMs?: number;
}

/** One in-flight message; abort stops polling, then drains the current transaction. */
export async function runConsumer(ports: ConsumerPorts, signal: AbortSignal) {
  const observe = (code: string) => { try { ports.observe(code); } catch { /* metrics isolated */ } };
  while (!signal.aborted) {
    let messages: QueueDelivery[];
    try { messages = await ports.receive(signal); }
    catch {
      if (signal.aborted) break;
      observe("QUEUE_POLL_FAILED");
      try { await (ports.wait?.(signal) ?? delay(1_000, undefined, { signal })); }
      catch { if (signal.aborted) break; }
      continue;
    }
    for (const message of messages) {
      if (signal.aborted) break;
      let renewal: Promise<void> | undefined;
      const timer = setInterval(() => {
        if (!message.receiptHandle || renewal !== undefined) return;
        renewal = Promise.resolve().then(() => ports.renew(message.receiptHandle!))
          .catch(() => { observe("VISIBILITY_RENEWAL_FAILED"); })
          .finally(() => { renewal = undefined; });
      }, ports.renewEveryMs ?? 20_000);
      timer.unref();
      try { await ports.handle(message); }
      catch { observe("DELIVERY_HANDLER_FAILED"); }
      finally {
        clearInterval(timer);
        await renewal;
      }
    }
  }
}
