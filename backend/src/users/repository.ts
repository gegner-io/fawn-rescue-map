import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { pool } from '../db';
import { Role } from '../auth/models';

export interface ManagedUserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

interface DbManagedUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
}

function mapDbManagedUser(row: DbManagedUserRow): ManagedUserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    active: row.is_active
  };
}

export async function listManagedUsers(): Promise<ManagedUserRecord[]> {
  const result = await pool.query<DbManagedUserRow>(
    `SELECT id, name, email, role, is_active
     FROM app_users
     ORDER BY created_at DESC`
  );

  return result.rows.map(mapDbManagedUser);
}

export async function createManagedUser(params: {
  name: string;
  email: string;
  role: Role;
}): Promise<ManagedUserRecord> {
  const passwordHash = await bcrypt.hash('change-me-123', 10);

  const result = await pool.query<DbManagedUserRow>(
    `INSERT INTO app_users (id, email, name, role, password_hash, is_active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING id, name, email, role, is_active`,
    [randomUUID(), params.email, params.name, params.role, passwordHash]
  );

  return mapDbManagedUser(result.rows[0]);
}

export async function updateManagedUser(params: {
  id: string;
  role: Role;
  active: boolean;
}): Promise<ManagedUserRecord | null> {
  const result = await pool.query<DbManagedUserRow>(
    `UPDATE app_users
     SET role = $2,
         is_active = $3,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, role, is_active`,
    [params.id, params.role, params.active]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapDbManagedUser(result.rows[0]);
}
