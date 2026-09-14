import { describe, expect, it } from "vitest";

import { currentCorrelationId, resolveCorrelationId, runWithCorrelation } from "./index.js";

describe("correlation context", () => {
  it("preserves a valid UUID", () => {
    const id = "018f47d2-f8a1-7c42-8e02-e8f1a2f4bf76";
    expect(resolveCorrelationId(id)).toBe(id);
  });

  it("replaces untrusted identifiers", () => {
    expect(resolveCorrelationId("unsafe-value")).not.toBe("unsafe-value");
  });

  it("keeps request context isolated", () => {
    runWithCorrelation("018f47d2-f8a1-7c42-8e02-e8f1a2f4bf76", () => {
      expect(currentCorrelationId()).toBe("018f47d2-f8a1-7c42-8e02-e8f1a2f4bf76");
    });
    expect(currentCorrelationId()).toBeUndefined();
  });
});
