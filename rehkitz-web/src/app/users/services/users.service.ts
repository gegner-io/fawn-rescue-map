import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';
import {
  CreateUserRequest,
  ListUsersResponse,
  UpdateUserRequest,
  UpsertUserResponse,
  UserRole
} from '../models/users.models';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  listUsers(): Observable<ListUsersResponse> {
    return this.http.get<ListUsersResponse>(`${this.apiBaseUrl}/api/users`, {
      headers: this.authService.buildAuthHeaders()
    });
  }

  createUser(payload: CreateUserRequest): Observable<UpsertUserResponse> {
    return this.http.post<UpsertUserResponse>(`${this.apiBaseUrl}/api/users`, payload, {
      headers: this.authService.buildAuthHeaders()
    });
  }

  updateUser(userId: string, payload: UpdateUserRequest): Observable<UpsertUserResponse> {
    return this.http.patch<UpsertUserResponse>(`${this.apiBaseUrl}/api/users/${userId}`, payload, {
      headers: this.authService.buildAuthHeaders()
    });
  }

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'dispatcher':
        return 'Disponent';
      case 'viewer':
        return 'Viewer';
      default:
        return role;
    }
  }
}
