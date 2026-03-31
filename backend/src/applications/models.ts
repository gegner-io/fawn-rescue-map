export type ApplicationStatus = 'new' | 'review' | 'approved';

export interface RescueApplicationRecord {
  id: string;
  applicant: string;
  parcelReference: string;
  requestedAt: string;
  status: ApplicationStatus;
  note: string;
  createdByUserId: string | null;
}

export interface ListApplicationsQuery {
  status?: ApplicationStatus;
  search?: string;
  page: number;
  pageSize: number;
}

export interface PagedApplicationsResult {
  applications: RescueApplicationRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
