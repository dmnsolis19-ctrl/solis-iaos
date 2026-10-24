import assert from "node:assert/strict";
import { test } from "node:test";

import { handleDelivery } from "../../apps/telemetry-worker/src/delivery.ts";

const message = { body: '{"value":12}', receiptHandle: "receipt" };

function fixture({
  persistFailure,
  ackFailure,
  outcome = "accepted",
  observerFailure = false,
} = {}) {
  const calls = [];
  const events = [];
  return {
    calls,
    events,
    ports: {
      async persist(body) {
        calls.push(["persist", body]);
        if (persistFailure) throw new Error("secret-database-url");
        return outcome;
      },
      async acknowledge(receipt) {
        calls.push(["acknowledge", receipt]);
        if (ackFailure) throw new Error("secret-receipt");
      },
      observe(event) {
        events.push(event);
        if (observerFailure) throw new Error("log sink unavailable");
      },
    },
  };
}

test("acknowledges only after idempotent persistence completes", async () => {
  const f = fixture();
  assert.equal((await handleDelivery(message, f.ports)).outcome, "accepted");
  assert.deepEqual(f.calls, [["persist", message.body], ["acknowledge", "receipt"]]);
});

test("does not acknowledge while the database transaction is pending", async () => {
  let complete;
  let acknowledged = false;
  const persisted = new Promise((resolve) => {
    complete = resolve;
  });
  const delivery = handleDelivery(message, {
    persist: () => persisted,
    acknowledge: async () => {
      acknowledged = true;
    },
    observe() {},
  });
  await Promise.resolve();
  assert.equal(acknowledged, false);
  complete("accepted");
  await delivery;
  assert.equal(acknowledged, true);
});

test("acknowledges duplicates without treating replay as new data", async () => {
  const f = fixture({ outcome: "duplicate" });
  assert.equal((await handleDelivery(message, f.ports)).outcome, "duplicate");
  assert.equal(f.calls.at(-1)[0], "acknowledge");
});

test("leaves database failures unacknowledged for retry and DLQ redrive", async () => {
  const f = fixture({ persistFailure: true });
  assert.deepEqual(await handleDelivery(message, f.ports), {
    outcome: "retry",
    code: "PERSISTENCE_FAILED",
  });
  assert.equal(f.calls.length, 1);
  assert.ok(!JSON.stringify(f.events).includes("secret"));
  assert.ok(!JSON.stringify(f.events).includes(message.body));
});

test("retries acknowledgement failures, requiring safe idempotent replay", async () => {
  const f = fixture({ ackFailure: true });
  assert.deepEqual(await handleDelivery(message, f.ports), {
    outcome: "retry",
    code: "ACKNOWLEDGEMENT_FAILED",
  });
});

for (const invalid of [
  {},
  { body: "x" },
  { receiptHandle: "r" },
  { receiptHandle: "r", body: "" },
]) {
  test(`rejects queue messages missing body/receipt: ${JSON.stringify(invalid)}`, async () => {
    const f = fixture();
    assert.equal((await handleDelivery(invalid, f.ports)).outcome, "retry");
    assert.deepEqual(f.calls, []);
  });
}

test("does not acknowledge an uncommitted or unknown persistence outcome", async () => {
  const f = fixture({ outcome: "processing" });
  assert.equal((await handleDelivery(message, f.ports)).outcome, "retry");
  assert.equal(f.calls.length, 1);
});

test("an observer failure cannot undo an already acknowledged delivery", async () => {
  const f = fixture({ observerFailure: true });
  assert.equal((await handleDelivery(message, f.ports)).outcome, "accepted");
});
