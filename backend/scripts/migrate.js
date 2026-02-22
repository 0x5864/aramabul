"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { createPool } = require("../db");

const SQL_DIR = path.resolve(__dirname, "../sql");

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedVersions(client) {
  const { rows } = await client.query("SELECT version FROM schema_migrations");
  return new Set(rows.map((row) => row.version));
}

async function listMigrationFiles() {
  const files = await fs.readdir(SQL_DIR);
  return files.filter((fileName) => fileName.endsWith(".sql")).sort((left, right) => left.localeCompare(right));
}

async function applyMigration(client, fileName) {
  const filePath = path.join(SQL_DIR, fileName);
  const sql = await fs.readFile(filePath, "utf8");

  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations(version) VALUES ($1)", [fileName]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function run() {
  const pool = createPool();
  const client = await pool.connect();

  try {
    await ensureMigrationsTable(client);
    const appliedVersions = await getAppliedVersions(client);
    const migrationFiles = await listMigrationFiles();

    for (const fileName of migrationFiles) {
      if (appliedVersions.has(fileName)) {
        console.log(`[migrate] skip ${fileName}`);
        continue;
      }

      await applyMigration(client, fileName);
      console.log(`[migrate] applied ${fileName}`);
    }

    console.log("[migrate] done");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("[migrate] failed", error);
  process.exit(1);
});
