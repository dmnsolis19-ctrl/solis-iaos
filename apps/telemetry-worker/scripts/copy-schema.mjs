import { copyFile, mkdir } from "node:fs/promises";

const destination = new URL("../dist/contracts/", import.meta.url);
await mkdir(destination, { recursive: true });
await copyFile(
  new URL("../../../packages/contracts/mqtt/telemetry-envelope.v1.schema.json", import.meta.url),
  new URL("telemetry-envelope.v1.schema.json", destination),
);
