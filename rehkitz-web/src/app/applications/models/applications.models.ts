export type ApplicationStatus = 'new' | 'review' | 'approved';

export interface RescueApplication {
  id: string;
  applicant: string;
  parcelReference: string;
  requestedAt: string;
  status: ApplicationStatus;
  note: string;
}

export interface ListApplicationsQuery {
  status?: ApplicationStatus;
  search?: string;
  page: number;
  pageSize: number;
}

export interface ListApplicationsResponse {
  applications: RescueApplication[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CreateApplicationRequest {
  applicant: string;
  parcelReference: string;
  note?: string;
}

export interface UpsertApplicationResponse {
  application: RescueApplication;
}
