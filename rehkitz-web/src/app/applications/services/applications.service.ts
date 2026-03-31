import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApplicationStatus,
  CreateApplicationRequest,
  ListApplicationsQuery,
  ListApplicationsResponse,
  RescueApplication,
  UpsertApplicationResponse
} from '../models/applications.models';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApplicationsService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  listApplications(query: ListApplicationsQuery): Observable<ListApplicationsResponse> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('pageSize', String(query.pageSize));

    if (query.status) {
      params = params.set('status', query.status);
    }

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    return this.http.get<ListApplicationsResponse>(`${this.apiBaseUrl}/api/applications`, {
      headers: this.authService.buildAuthHeaders(),
      params
    });
  }

  createApplication(payload: CreateApplicationRequest): Observable<UpsertApplicationResponse> {
    return this.http.post<UpsertApplicationResponse>(`${this.apiBaseUrl}/api/applications`, payload, {
      headers: this.authService.buildAuthHeaders()
    });
  }

  updateStatus(applicationId: string, status: ApplicationStatus): Observable<UpsertApplicationResponse> {
    return this.http.patch<UpsertApplicationResponse>(
      `${this.apiBaseUrl}/api/applications/${applicationId}/status`,
      { status },
      {
        headers: this.authService.buildAuthHeaders()
      }
    );
  }

  nextStatus(current: ApplicationStatus): ApplicationStatus {
    switch (current) {
      case 'new':
        return 'review';
      case 'review':
        return 'approved';
      default:
        return 'new';
    }
  }

  getStatusLabel(status: ApplicationStatus): string {
    switch (status) {
      case 'new':
        return 'Neu';
      case 'review':
        return 'In Prüfung';
      case 'approved':
        return 'Freigegeben';
      default:
        return status;
    }
  }

  formatRequestedAt(isoDateTime: string): string {
    const parsed = new Date(isoDateTime);
    if (Number.isNaN(parsed.getTime())) {
      return isoDateTime;
    }

    return parsed.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
