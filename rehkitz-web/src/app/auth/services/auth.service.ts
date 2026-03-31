import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

interface MeResponse {
  user: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private static readonly tokenStorageKey = 'fawn_auth_token';

  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(null);

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  get hasToken(): boolean {
    return !!this.getStoredToken();
  }

  initializeSession(): void {
    const token = this.getStoredToken();
    if (!token) {
      return;
    }

    this.fetchMe().subscribe({
      next: (user) => this.currentUserSubject.next(user),
      error: () => this.logout(false)
    });
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.http
      .post<LoginResponse>(`${this.apiBaseUrl}/api/auth/login`, {
        email,
        password
      })
      .pipe(
        tap((response) => {
          localStorage.setItem(AuthService.tokenStorageKey, response.accessToken);
          this.currentUserSubject.next(response.user);
        }),
        map((response) => response.user)
      );
  }

  fetchMe(): Observable<AuthUser> {
    const headers = this.buildAuthHeaders();
    return this.http
      .get<MeResponse>(`${this.apiBaseUrl}/api/me`, { headers })
      .pipe(map((response) => response.user));
  }

  logout(navigateToLogin = true): void {
    localStorage.removeItem(AuthService.tokenStorageKey);
    this.currentUserSubject.next(null);

    if (navigateToLogin) {
      this.router.navigate(['/login']);
    }
  }

  buildAuthHeaders(): HttpHeaders {
    const token = this.getStoredToken();

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(AuthService.tokenStorageKey);
  }
}
