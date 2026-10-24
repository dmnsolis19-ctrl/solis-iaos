import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";

import { runConsumer } from "../../apps/telemetry-worker/src/consumer.ts";

test("consumer drains in-flight processing before resolving shutdown", async () => {
  const abort = new AbortController();
  const order = [];
  await runConsumer({
    receive: async () => [{ body: "body", receiptHandle: "receipt" }],
    handle: async () => { order.push("started"); abort.abort(); await delay(5); order.push("committed"); },
    renew: async () => {}, observe() {},
  }, abort.signal);
  order.push("stopped");
  assert.deepEqual(order, ["started", "committed", "stopped"]);
});

test("renews visibility during a long transaction and clears its timer after processing", async () => {
  const abort = new AbortController();
  let renewals = 0;
  await runConsumer({
    receive: async () => [{ receiptHandle: "receipt" }],
    handle: async () => { await delay(25); abort.abort(); },
    renew: async (receipt) => { assert.equal(receipt, "receipt"); renewals++; },
    renewEveryMs: 3, observe() {},
  }, abort.signal);
  const count = renewals;
  assert.ok(count > 0);
  await delay(15);
  assert.equal(renewals, count);
});

test("queue failures back off and can be interrupted without a tight retry loop", async () => {
  const abort = new AbortController();
  const events = [];
  let waits = 0;
  await runConsumer({
    receive: async () => { throw new Error("raw-queue-error"); },
    handle: async () => {}, renew: async () => {}, observe: (code) => events.push(code),
    wait: async () => { waits++; abort.abort(); },
  }, abort.signal);
  assert.equal(waits, 1);
  assert.deepEqual(events, ["QUEUE_POLL_FAILED"]);
});

test("a failed handler leaves the message for redelivery and does not kill the polling loop", async () => {
  const abort = new AbortController();
  const events = [];
  let calls = 0;
  await runConsumer({
    receive: async () => [{ body: "body" }],
    handle: async () => { if (++calls === 2) abort.abort(); throw new Error("failure"); },
    renew: async () => {}, observe: (code) => events.push(code),
  }, abort.signal);
  assert.equal(calls, 2);
  assert.deepEqual(events, ["DELIVERY_HANDLER_FAILED", "DELIVERY_HANDLER_FAILED"]);
});
