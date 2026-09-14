import "reflect-metadata";
import { parseServiceEnvironment } from "@solis/config";

import { telemetry } from "./instrumentation.js";
import { createApp } from "./create-app.js";

const config = parseServiceEnvironment(Number(process.env.API_PORT ?? 3000));
const app = await createApp();
await app.listen(config.PORT, config.HOST);

const shutdown = async (): Promise<void> => {
  await app.close();
  await telemetry.shutdown();
};

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
