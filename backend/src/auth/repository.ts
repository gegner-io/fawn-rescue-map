import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { pool } from '../db';
import { PublicUser, Role, UserRecord } from './models';

interface DbUserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
  password_hash: string;
}

function mapDbUser(row: DbUserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: row.is_active,
    passwordHash: row.password_hash
  };
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await pool.query<DbUserRow>(
    `SELECT id, email, name, role, is_active, password_hash FROM app_users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapDbUser(result.rows[0]);
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const result = await pool.query<DbUserRow>(
    `SELECT id, email, name, role, is_active, password_hash FROM app_users WHERE id = $1 LIMIT 1`,
    [id]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapDbUser(result.rows[0]);
}

export async function verifyPassword(plainTextPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash);
}

async function upsertSeedUser(params: {
  email: string;
  name: string;
  role: Role;
  password: string;
}): Promise<void> {
  const passwordHash = await bcrypt.hash(params.password, 10);

  await pool.query(
    `INSERT INTO app_users (id, email, name, role, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email)
     DO UPDATE SET
       name = EXCLUDED.name,
       role = EXCLUDED.role,
       password_hash = EXCLUDED.password_hash,
       updated_at = NOW()`,
    [randomUUID(), params.email, params.name, params.role, passwordHash]
  );
}

export async function seedDefaultUsers(): Promise<void> {
  await upsertSeedUser({
    email: process.env.SEED_ADMIN_EMAIL || 'admin@fawn.local',
    name: process.env.SEED_ADMIN_NAME || 'Admin User',
    role: 'admin',
    password: process.env.SEED_ADMIN_PASSWORD || 'admin123'
  });

  await upsertSeedUser({
    email: process.env.SEED_DISPATCHER_EMAIL || 'dispatcher@fawn.local',
    name: process.env.SEED_DISPATCHER_NAME || 'Dispatcher User',
    role: 'dispatcher',
    password: process.env.SEED_DISPATCHER_PASSWORD || 'dispatch123'
  });

  await upsertSeedUser({
    email: process.env.SEED_VIEWER_EMAIL || 'viewer@fawn.local',
    name: process.env.SEED_VIEWER_NAME || 'Viewer User',
    role: 'viewer',
    password: process.env.SEED_VIEWER_PASSWORD || 'viewer123'
  });
}
