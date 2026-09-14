import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Client, type ClientConfig } from "pg";

interface MigrationDefinition {
  id: string;
  up: string;
  down: string;
}

interface LoadedMigration extends MigrationDefinition {
  upSql: string;
  downSql: string;
  checksum: string;
}

export interface MigrationStatus {
  id: string;
  applied: boolean;
  checksum: string;
  appliedChecksum?: string;
}

const migrationDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  process.env.SOLIS_MIGRATIONS_DIR ?? "../migrations",
);

async function loadMigrations(): Promise<LoadedMigration[]> {
  const manifestPath = resolve(migrationDirectory, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as MigrationDefinition[];

  const migrations = await Promise.all(
    manifest.map(async (definition) => {
      const upSql = await readFile(resolve(migrationDirectory, definition.up), "utf8");
      const downSql = await readFile(resolve(migrationDirectory, definition.down), "utf8");
      return {
        ...definition,
        upSql,
        downSql,
        checksum: createHash("sha256").update(upSql).digest("hex"),
      };
    }),
  );

  return migrations.sort((left, right) => left.id.localeCompare(right.id));
}

async function ensureLedger(client: Client): Promise<void> {
  await client.query("CREATE SCHEMA IF NOT EXISTS solis_migrations");
  await client.query(`
    CREATE TABLE IF NOT EXISTS solis_migrations.applied_migration (
      id varchar(128) PRIMARY KEY,
      checksum char(64) NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function withClient<T>(
  config: ClientConfig,
  callback: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client(config);
  await client.connect();
  try {
    await ensureLedger(client);
    await client.query("SELECT pg_advisory_lock(hashtext('solis-iaos-migrations'))");
    return await callback(client);
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('solis-iaos-migrations'))").catch(() => {
      // Connection teardown is more important than masking the original migration error.
    });
    await client.end();
  }
}

export async function migrationStatus(config: ClientConfig): Promise<MigrationStatus[]> {
  const migrations = await loadMigrations();

  return withClient(config, async (client) => {
    const result = await client.query<{ id: string; checksum: string }>(
      "SELECT id, checksum FROM solis_migrations.applied_migration ORDER BY id",
    );
    const applied = new Map(result.rows.map((row) => [row.id, row.checksum]));

    return migrations.map((migration) => {
      const appliedChecksum = applied.get(migration.id);
      return {
        id: migration.id,
        applied: appliedChecksum !== undefined,
        checksum: migration.checksum,
        ...(appliedChecksum === undefined ? {} : { appliedChecksum }),
      };
    });
  });
}

export async function migrateUp(config: ClientConfig): Promise<string[]> {
  const migrations = await loadMigrations();

  return withClient(config, async (client) => {
    const appliedResult = await client.query<{ id: string; checksum: string }>(
      "SELECT id, checksum FROM solis_migrations.applied_migration ORDER BY id",
    );
    const applied = new Map(appliedResult.rows.map((row) => [row.id, row.checksum]));
    const completed: string[] = [];

    for (const migration of migrations) {
      const previousChecksum = applied.get(migration.id);
      if (previousChecksum !== undefined) {
        if (previousChecksum !== migration.checksum) {
          throw new Error(`Migration drift detected for ${migration.id}`);
        }
        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(migration.upSql);
        await client.query(
          "INSERT INTO solis_migrations.applied_migration (id, checksum) VALUES ($1, $2)",
          [migration.id, migration.checksum],
        );
        await client.query("COMMIT");
        completed.push(migration.id);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    return completed;
  });
}

export async function migrateDown(config: ClientConfig): Promise<string | undefined> {
  if (process.env.ALLOW_DESTRUCTIVE_MIGRATION !== "true") {
    throw new Error("Down migration requires ALLOW_DESTRUCTIVE_MIGRATION=true");
  }

  const migrations = await loadMigrations();

  return withClient(config, async (client) => {
    const latest = await client.query<{ id: string }>(
      "SELECT id FROM solis_migrations.applied_migration ORDER BY id DESC LIMIT 1",
    );
    const latestId = latest.rows[0]?.id;
    if (latestId === undefined) return undefined;

    const migration = migrations.find((candidate) => candidate.id === latestId);
    if (migration === undefined) {
      throw new Error(`Applied migration ${latestId} is missing from the manifest`);
    }

    await client.query("BEGIN");
    try {
      await client.query(migration.downSql);
      await client.query("DELETE FROM solis_migrations.applied_migration WHERE id = $1", [
        migration.id,
      ]);
      await client.query("COMMIT");
      return migration.id;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}
