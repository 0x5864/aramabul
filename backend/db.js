"use strict";

const path = require("node:path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, ".env"), override: false });

function parseBoolean(value) {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function shouldUseSsl() {
  return parseBoolean(process.env.DB_SSL) || String(process.env.PGSSLMODE || "").toLowerCase() === "require";
}

function createPool() {
  const ssl = shouldUseSsl() ? { rejectUnauthorized: false } : false;
  const connectionString = String(process.env.DATABASE_URL || "").trim();

  if (connectionString) {
    return new Pool({
      connectionString,
      ssl,
      max: 12,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return new Pool({
    host: process.env.PGHOST || "127.0.0.1",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    database: process.env.PGDATABASE || "postgres",
    ssl,
    max: 12,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

module.exports = {
  createPool,
};
