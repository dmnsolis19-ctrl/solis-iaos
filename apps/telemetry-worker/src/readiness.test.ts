import { describe, expect, it } from "vitest";

import { checkQueueReadiness } from "./readiness.js";

describe("queue readiness", () => {
  it("is not ready without an explicit queue", async () => {
    await expect(checkQueueReadiness({ region: "sa-east-1" })).resolves.toBe(false);
  });
});
