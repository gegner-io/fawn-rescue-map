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
      is_active BOOLEAN NOT NULL DEFAULT true,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rescue_applications (
      id TEXT PRIMARY KEY,
      applicant TEXT NOT NULL,
      parcel_reference TEXT NOT NULL,
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL CHECK (status IN ('new', 'review', 'approved')),
      note TEXT,
      created_by_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL
    );
  `);
}
