import assert from "node:assert/strict";
import { test } from "node:test";

import { foundationReadiness } from "../../packages/config/src/foundation-readiness.ts";

for (const env of ["development", "test"]) {
  test(`keeps foundation development available: ${env}`, () => {
    assert.deepEqual(foundationReadiness(env), { ready: true, mode: "foundation", blockers: [] });
  });
}
for (const env of ["staging", "production", "", "unknown"]) {
  test(`cannot present scaffold as integrated product: ${env}`, () => {
    assert.equal(foundationReadiness(env).ready, false);
    assert.ok(foundationReadiness(env).blockers.includes("PRODUCT_INTEGRATIONS_NOT_IMPLEMENTED"));
  });
}
test("dependency failure keeps local readiness false", () => {
  assert.equal(foundationReadiness("development", false).ready, false);
  assert.ok(foundationReadiness("development", false).blockers.includes("DEPENDENCY_UNAVAILABLE"));
});
