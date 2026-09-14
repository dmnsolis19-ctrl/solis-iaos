import { describe, expect, it } from "vitest";

import { parseServiceEnvironment } from "./index.js";

describe("parseServiceEnvironment", () => {
  it("applies safe defaults", () => {
    const config = parseServiceEnvironment(3000, {});

    expect(config.NODE_ENV).toBe("development");
    expect(config.HOST).toBe("0.0.0.0");
    expect(config.PORT).toBe(3000);
    expect(config.LOG_LEVEL).toBe("info");
  });

  it("rejects an invalid port", () => {
    expect(() => parseServiceEnvironment(3000, { PORT: "70000" })).toThrow();
  });
});
