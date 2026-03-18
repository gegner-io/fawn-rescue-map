import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParcelFeatureCollection } from '../models/data-contract.models';

@Injectable({
  providedIn: 'root'
})
export class ParcelMapDataService {
  private readonly parcelsUrl = 'assets/parcels.geojson';

  constructor(private readonly http: HttpClient) {}

  // Loads the parcel geometries that follow the DATA_CONTRACT.md feature collection contract.
  loadParcels(): Observable<ParcelFeatureCollection> {
    return this.http.get<ParcelFeatureCollection>(this.parcelsUrl);
  }
}