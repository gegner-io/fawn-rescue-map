import { Pool, PoolConfig } from 'pg';
import { appConfig } from './config';

const dbConfig: PoolConfig = {
  host: appConfig.db.host,
  port: appConfig.db.port,
  user: appConfig.db.user,
  password: appConfig.db.password,
  database: appConfig.db.database
};

export const pool = new Pool(dbConfig);

export async function verifyDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  client.release();
}

export async function initializeSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'dispatcher', 'viewer')),
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
