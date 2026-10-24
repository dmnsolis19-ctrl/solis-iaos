import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { migrateDown, migrateUp, migrationStatus, seedSynthetic, syntheticTenants } from "./index.js";

const workspaceEnv = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(".env")) process.loadEnvFile(".env");
else if (existsSync(workspaceEnv)) process.loadEnvFile(workspaceEnv);

const connectionString = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (connectionString === undefined && process.env.PGHOST === undefined) {
  throw new Error("DATABASE_URL or standard PGHOST/PG* variables are required");
}

const command = process.argv[2] ?? "status";
const config = connectionString === undefined ? {} : { connectionString };

switch (command) {
  case "seed-synthetic": {
    await seedSynthetic(config, process.env.SOLIS_SYNTHETIC_SUBJECT ?? "", process.env);
    console.log(JSON.stringify({ event: "synthetic.seeded", tenants: syntheticTenants }));
    break;
  }
  case "partitions": {
    const { Client } = await import("pg");
    const client = new Client(config);
    await client.connect();
    try {
      await client.query("SELECT telemetry.prepare_month_partitions((date_trunc('month',CURRENT_DATE)+(n || ' month')::interval)::date) FROM generate_series(-1,2) AS n");
      console.log(JSON.stringify({ event: "telemetry.partitions.prepared" }));
    } finally { await client.end(); }
    break;
  }
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
