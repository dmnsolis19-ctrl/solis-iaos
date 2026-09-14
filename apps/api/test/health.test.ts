import "reflect-metadata";

import { afterEach, describe, expect, it } from "vitest";

import { createApp } from "../src/create-app.js";

describe("foundation health endpoints", () => {
  const apps: Awaited<ReturnType<typeof createApp>>[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map(async (app) => app.close()));
  });

  it("returns a correlated health response", async () => {
    const app = await createApp();
    apps.push(app);
    await app.init();

    const correlationId = "018f47d2-f8a1-7c42-8e02-e8f1a2f4bf76";
    const response = await app.inject({
      method: "GET",
      url: "/health/live",
      headers: { "x-correlation-id": correlationId },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-correlation-id"]).toBe(correlationId);
    expect(response.json()).toMatchObject({
      status: "ok",
      service: "solis-api",
      version: "0.2.0",
      correlationId,
    });
  });

  it("does not reflect an untrusted correlation value", async () => {
    const app = await createApp();
    apps.push(app);
    await app.init();

    const response = await app.inject({
      method: "GET",
      url: "/health/ready",
      headers: { "x-correlation-id": "not-a-valid-id" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-correlation-id"]).not.toBe("not-a-valid-id");
  });
});
