import { describe, expect, it } from "vitest";

import { migrateDown } from "./index.js";

describe("migration safety", () => {
  it("blocks destructive rollback by default", async () => {
    await expect(migrateDown({ connectionString: "postgresql://invalid" })).rejects.toThrow(
      "ALLOW_DESTRUCTIVE_MIGRATION=true",
    );
  });
});
