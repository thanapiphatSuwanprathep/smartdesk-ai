
import "server-only";
import pg from "pg";

const { Pool } = pg;

const globalForDb = globalThis;

export const resetDb =
  globalForDb.smartdeskResetPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.smartdeskResetPool = resetDb;
}
