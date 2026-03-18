import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ParcelDetails } from '../models/data-contract.models';

@Injectable({
  providedIn: 'root'
})
export class ParcelBackendService {
  // Simulates a backend endpoint returning business data for a single parcel.
  fetchParcelDetails(parcelId: number): Observable<ParcelDetails> {
    const detail = this.buildMockParcelDetails(parcelId);

    // Simulates a real backend request so UI loading states can be tested.
    return of(detail).pipe(delay(350));
  }

  // Creates deterministic mock payloads so interactions are easy to verify manually.
  private buildMockParcelDetails(parcelId: number): ParcelDetails {
    const statusCycle: ParcelDetails['status'][] = ['candidate', 'selected', 'excluded'];

    return {
      parcelId,
      status: statusCycle[parcelId % statusCycle.length],
      areaM2: 3500 + parcelId * 18,
      confidence: 0.65 + (parcelId % 10) / 40,
      sourceTileZoom: 19,
      notes: `Mock backend response for parcel ${parcelId}.`
    };
  }
}