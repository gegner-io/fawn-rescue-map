import { randomUUID } from 'crypto';
import { pool } from '../db';
import {
  ApplicationStatus,
  ListApplicationsQuery,
  PagedApplicationsResult,
  RescueApplicationRecord
} from './models';

interface DbRescueApplicationRow {
  id: string;
  applicant: string;
  parcel_reference: string;
  requested_at: Date;
  status: ApplicationStatus;
  note: string | null;
  created_by_user_id: string | null;
}

function mapDbApplication(row: DbRescueApplicationRow): RescueApplicationRecord {
  return {
    id: row.id,
    applicant: row.applicant,
    parcelReference: row.parcel_reference,
    requestedAt: row.requested_at.toISOString(),
    status: row.status,
    note: row.note ?? '',
    createdByUserId: row.created_by_user_id
  };
}

export async function listApplications(query: ListApplicationsQuery): Promise<PagedApplicationsResult> {
  const whereParts: string[] = [];
  const values: Array<string | number> = [];

  if (query.status) {
    values.push(query.status);
    whereParts.push(`status = $${values.length}`);
  }

  if (query.search) {
    values.push(`%${query.search.trim().toLowerCase()}%`);
    whereParts.push(`(LOWER(applicant) LIKE $${values.length} OR LOWER(parcel_reference) LIKE $${values.length})`);
  }

  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM rescue_applications ${whereClause}`,
    values
  );

  const total = Number(countResult.rows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(Math.max(query.page, 1), totalPages);
  const offset = (page - 1) * query.pageSize;

  const rowValues = [...values, query.pageSize, offset];
  const limitIndex = values.length + 1;
  const offsetIndex = values.length + 2;

  const result = await pool.query<DbRescueApplicationRow>(
    `SELECT id, applicant, parcel_reference, requested_at, status, note, created_by_user_id
     FROM rescue_applications
     ${whereClause}
     ORDER BY requested_at DESC
     LIMIT $${limitIndex}
     OFFSET $${offsetIndex}`,
    rowValues
  );

  return {
    applications: result.rows.map(mapDbApplication),
    page,
    pageSize: query.pageSize,
    total,
    totalPages
  };
}

export async function createApplication(params: {
  applicant: string;
  parcelReference: string;
  note?: string;
  createdByUserId: string;
}): Promise<RescueApplicationRecord> {
  const result = await pool.query<DbRescueApplicationRow>(
    `INSERT INTO rescue_applications (id, applicant, parcel_reference, status, note, created_by_user_id)
     VALUES ($1, $2, $3, 'new', $4, $5)
     RETURNING id, applicant, parcel_reference, requested_at, status, note, created_by_user_id`,
    [randomUUID(), params.applicant, params.parcelReference, params.note ?? '', params.createdByUserId]
  );

  return mapDbApplication(result.rows[0]);
}

export async function updateApplicationStatus(params: {
  id: string;
  status: ApplicationStatus;
}): Promise<RescueApplicationRecord | null> {
  const result = await pool.query<DbRescueApplicationRow>(
    `UPDATE rescue_applications
     SET status = $2
     WHERE id = $1
     RETURNING id, applicant, parcel_reference, requested_at, status, note, created_by_user_id`,
    [params.id, params.status]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapDbApplication(result.rows[0]);
}
