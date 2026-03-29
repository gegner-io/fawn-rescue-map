import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParcelFeatureCollection } from '../models/data-contract.models';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ParcelMapDataService {
  private readonly parcelsUrl = 'assets/parcels.geojson';
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  // Loads the parcel geometries that follow the DATA_CONTRACT.md feature collection contract.
  loadParcels(): Observable<ParcelFeatureCollection> {
    return this.http.get<ParcelFeatureCollection>(this.parcelsUrl);
  }

  checkBackendHealth(): Observable<{ service: string; status: string }> {
    return this.http.get<{ service: string; status: string }>(`${this.apiBaseUrl}/health`);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiBaseUrl}/api/auth/login`, {
      email,
      password
    });
  }

  getMe(token: string): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiBaseUrl}/api/me`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }

  pingAdmin(token: string): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.apiBaseUrl}/api/admin/ping`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }
}