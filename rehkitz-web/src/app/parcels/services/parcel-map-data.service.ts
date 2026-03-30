import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParcelFeatureCollection, ParcelIndexResponse } from '../models/data-contract.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ParcelMapDataService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  loadParcelIndex(): Observable<ParcelIndexResponse> {
    return this.http.get<ParcelIndexResponse>(`${this.apiBaseUrl}/api/parcels/index`);
  }

  loadParcels(params: { revierId?: string; hegegemeinschaftId?: string }): Observable<ParcelFeatureCollection> {
    let httpParams = new HttpParams();

    if (params.revierId) {
      httpParams = httpParams.set('revierId', params.revierId);
    }

    if (params.hegegemeinschaftId) {
      httpParams = httpParams.set('hegegemeinschaftId', params.hegegemeinschaftId);
    }

    return this.http.get<ParcelFeatureCollection>(`${this.apiBaseUrl}/api/parcels`, {
      params: httpParams
    });
  }
}