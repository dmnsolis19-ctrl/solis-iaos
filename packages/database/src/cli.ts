import { existsSync } from "node:fs";

import { migrateDown, migrateUp, migrationStatus } from "./index.js";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const connectionString = process.env.DATABASE_URL;
if (connectionString === undefined && process.env.PGHOST === undefined) {
  throw new Error("DATABASE_URL or standard PGHOST/PG* variables are required");
}

const command = process.argv[2] ?? "status";
const config = connectionString === undefined ? {} : { connectionString };

switch (command) {
  case "up": {
    const applied = await migrateUp(config);
    console.log(JSON.stringify({ event: "migration.up", applied }));
    break;
  }
  case "down": {
    const reverted = await migrateDown(config);
    console.log(JSON.stringify({ event: "migration.down", reverted }));
    break;
  }
  case "status": {
    console.log(JSON.stringify(await migrationStatus(config), undefined, 2));
    break;
  }
  default:
    throw new Error(`Unknown migration command: ${command}`);
}
