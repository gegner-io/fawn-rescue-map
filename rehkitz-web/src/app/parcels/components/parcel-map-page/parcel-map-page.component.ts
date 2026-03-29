import { Component, OnDestroy, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import {
  ParcelDetails,
  ParcelFeature,
  ParcelFeatureCollection
} from '../../models/data-contract.models';
import { ParcelMapDataService } from '../../services/parcel-map-data.service';

@Component({
  selector: 'app-parcel-map-page',
  standalone: false,
  templateUrl: './parcel-map-page.component.html',
  styleUrls: ['./parcel-map-page.component.css']
})
export class ParcelMapPageComponent implements OnInit, OnDestroy {
  private static readonly authTokenStorageKey = 'fawn_auth_token';

  backendHealthStatus: 'unknown' | 'ok' | 'error' = 'unknown';
  authEmail = 'admin@fawn.local';
  authPassword = 'admin123';
  authToken = '';
  currentUserRole: string | null = null;
  currentUserEmail: string | null = null;
  loginResult: string | null = null;
  meResult: string | null = null;
  adminPingResult: string | null = null;

  selectedParcelIds: number[] = [];
  activeParcelId: number | null = null;
  parcelDetails: ParcelDetails | null = null;
  loadingDetails = false;
  detailsError: string | null = null;

  private map?: L.Map;
  private parcelLayer?: L.GeoJSON;
  private readonly parcelLayersById = new Map<number, L.Path>();
  private readonly parcelFeaturesById = new Map<number, ParcelFeature>();
  private readonly orderLabelsByParcelId = new Map<number, L.Tooltip>();
  private readonly subscriptions = new Subscription();

  constructor(private readonly parcelMapDataService: ParcelMapDataService) {}

  ngOnInit(): void {
    this.initializeMap();
    this.loadParcelGeometry();
    this.checkBackendHealth();
    this.restoreTokenFromStorage();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.map?.remove();
  }

  onInitiateMission(payload: {
    parcelIds: number[];
    mowingStartDate: string;
    mowingStartTime: string;
  }): void {
    alert(
      [
        'Demo-Projekt: Es wird noch kein echter Auftrag versendet.',
        '',
        `Geplante Reihenfolge der Parzellen: ${payload.parcelIds.join(' → ')}`,
        `Geplanter Mähstart: ${payload.mowingStartDate} um ${payload.mowingStartTime} Uhr`,
        '',
        'Wenn das Projekt fertig ist und live geht, wird mit diesem Klick der Drohnenpilot informiert.'
      ].join('\n')
    );
  }

  onSelectParcelFromSidebar(parcelId: number): void {
    this.activateParcel(parcelId);
  }

  onRemoveParcelFromSidebar(parcelId: number): void {
    this.deselectParcel(parcelId);
  }

  onReorderParcels(payload: { previousIndex: number; currentIndex: number }): void {
    if (
      payload.previousIndex < 0 ||
      payload.currentIndex < 0 ||
      payload.previousIndex >= this.selectedParcelIds.length ||
      payload.currentIndex >= this.selectedParcelIds.length
    ) {
      return;
    }

    const reordered = [...this.selectedParcelIds];
    const [moved] = reordered.splice(payload.previousIndex, 1);
    reordered.splice(payload.currentIndex, 0, moved);
    this.selectedParcelIds = reordered;
    this.refreshOrderLabels();
  }

  onLoginTest(): void {
    const loginSubscription = this.parcelMapDataService
      .login(this.authEmail.trim(), this.authPassword)
      .subscribe({
        next: (response) => {
          this.authToken = response.accessToken;
          this.currentUserRole = response.user.role;
          this.currentUserEmail = response.user.email;
          this.storeToken(this.authToken);
          this.loginResult = `Login ok: ${response.user.email} (${response.user.role})`;
        },
        error: (error) => {
          this.clearAuthState();
          this.loginResult = `Login failed: ${error?.status ?? 'unknown'}`;
        }
      });

    this.subscriptions.add(loginSubscription);
  }

  onFetchMeTest(): void {
    if (!this.authToken) {
      this.meResult = 'No token available. Run login first.';
      return;
    }

    const meSubscription = this.parcelMapDataService.getMe(this.authToken).subscribe({
      next: (response) => {
        this.currentUserRole = response.user.role;
        this.currentUserEmail = response.user.email;
        this.meResult = `Me ok: ${response.user.email} (${response.user.role})`;
      },
      error: (error) => {
        if (error?.status === 401) {
          this.clearAuthState();
        }
        this.meResult = `Me failed: ${error?.status ?? 'unknown'}`;
      }
    });

    this.subscriptions.add(meSubscription);
  }

  onPingAdminTest(): void {
    if (!this.authToken) {
      this.adminPingResult = 'No token available. Run login first.';
      return;
    }

    const adminSubscription = this.parcelMapDataService.pingAdmin(this.authToken).subscribe({
      next: (response) => {
        this.adminPingResult = `Admin ok: ${response.message}`;
      },
      error: (error) => {
        if (error?.status === 401) {
          this.clearAuthState();
        }
        this.adminPingResult = `Admin failed: ${error?.status ?? 'unknown'}`;
      }
    });

    this.subscriptions.add(adminSubscription);
  }

  onLogoutTest(): void {
    this.clearAuthState();
    this.loginResult = 'Logged out';
    this.meResult = null;
    this.adminPingResult = null;
  }

  // Initializes base map and OpenStreetMap tile layer.
  private initializeMap(): void {
    this.map = L.map('parcel-map', {
      center: [49.0, 10.0],
      zoom: 12,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  // Loads parcel polygons from GeoJSON and forwards them to Leaflet rendering.
  private loadParcelGeometry(): void {
    const geometrySubscription = this.parcelMapDataService.loadParcels().subscribe({
      next: (collection) => this.renderParcelLayer(collection),
      error: () => {
        this.detailsError = 'Unable to load parcel geometry from assets/parcels.geojson.';
      }
    });

    this.subscriptions.add(geometrySubscription);
  }

  private checkBackendHealth(): void {
    const healthSubscription = this.parcelMapDataService.checkBackendHealth().subscribe({
      next: () => {
        this.backendHealthStatus = 'ok';
      },
      error: () => {
        this.backendHealthStatus = 'error';
      }
    });

    this.subscriptions.add(healthSubscription);
  }

  private restoreTokenFromStorage(): void {
    const storedToken = localStorage.getItem(ParcelMapPageComponent.authTokenStorageKey);

    if (!storedToken) {
      return;
    }

    this.authToken = storedToken;
    this.onFetchMeTest();
  }

  private storeToken(token: string): void {
    localStorage.setItem(ParcelMapPageComponent.authTokenStorageKey, token);
  }

  private clearAuthState(): void {
    this.authToken = '';
    this.currentUserRole = null;
    this.currentUserEmail = null;
    localStorage.removeItem(ParcelMapPageComponent.authTokenStorageKey);
  }

  // Creates an interactive parcel layer and wires click handlers for each feature.
  private renderParcelLayer(collection: ParcelFeatureCollection): void {
    if (!this.map) {
      return;
    }

    this.parcelLayer = L.geoJSON(collection as GeoJSON.GeoJsonObject, {
      style: () => ({
        color: '#2457c5',
        weight: 1.2,
        fillOpacity: 0.25
      }),
      onEachFeature: (feature, layer) => {
        const parcelFeature = feature as unknown as ParcelFeature;
        const parcelId = parcelFeature.properties.parcel_id;
        this.parcelLayersById.set(parcelId, layer as L.Path);
        this.parcelFeaturesById.set(parcelId, parcelFeature);
        layer.on('click', () => this.toggleParcelSelection(parcelFeature));
      }
    }).addTo(this.map);

    const bounds = this.parcelLayer.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [20, 20] });
    }
  }

  // Handles selecting and deselecting parcels while preserving an explicit flight order.
  private toggleParcelSelection(feature: ParcelFeature): void {
    const parcelId = feature.properties.parcel_id;

    if (this.selectedParcelIds.includes(parcelId)) {
      this.deselectParcel(parcelId);
      return;
    }

    const layer = this.parcelLayersById.get(parcelId);
    layer?.setStyle({
      color: '#ff7a00',
      weight: 2,
      fillOpacity: 0.45
    });

    this.selectedParcelIds = [...this.selectedParcelIds, parcelId];
    this.refreshOrderLabels();
    this.activateParcel(parcelId);
  }

  private deselectParcel(parcelId: number): void {
    const layer = this.parcelLayersById.get(parcelId);
    if (layer && this.parcelLayer) {
      this.parcelLayer.resetStyle(layer);
    }

    this.selectedParcelIds = this.selectedParcelIds.filter((id) => id !== parcelId);
    this.removeOrderLabel(parcelId);
    this.refreshOrderLabels();

    if (this.activeParcelId === parcelId) {
      const fallbackParcelId = this.selectedParcelIds[this.selectedParcelIds.length - 1] ?? null;
      if (fallbackParcelId !== null) {
        this.activateParcel(fallbackParcelId);
      } else {
        this.activeParcelId = null;
        this.parcelDetails = null;
        this.detailsError = null;
        this.loadingDetails = false;
      }
    }
  }

  // Loads details for the currently focused parcel.
  private activateParcel(parcelId: number): void {
    if (!this.selectedParcelIds.includes(parcelId)) {
      return;
    }

    this.activeParcelId = parcelId;
    const feature = this.parcelFeaturesById.get(parcelId);
    this.parcelDetails = feature ? this.mapFeatureToDetails(feature) : null;
    this.detailsError = null;
    this.loadingDetails = false;

    if (!this.parcelDetails) {
      this.detailsError = 'Parzellendetails konnten nicht aus der GeoJSON gelesen werden.';
    }
  }

  // Maps available GeoJSON properties to UI details without generating mock values.
  private mapFeatureToDetails(feature: ParcelFeature): ParcelDetails {
    const properties = feature.properties;

    return {
      parcelId: properties.parcel_id,
      status: this.readString(properties.status),
      areaM2: this.readNumber(properties.area_m2),
      confidence: this.readNumber(properties.confidence),
      sourceTileZoom: this.readNumber(properties.source_tile_zoom),
      notes: this.readString(properties.notes)
    };
  }

  private readNumber(value: unknown): number | undefined {
    if (typeof value !== 'number') {
      return undefined;
    }

    return Number.isFinite(value) ? value : undefined;
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  // Keeps map labels in sync with the current mission order list.
  private refreshOrderLabels(): void {
    const mapRef = this.map;
    if (!mapRef) {
      return;
    }

    const selectedSet = new Set(this.selectedParcelIds);

    for (const parcelId of this.orderLabelsByParcelId.keys()) {
      if (!selectedSet.has(parcelId)) {
        this.removeOrderLabel(parcelId);
      }
    }

    this.selectedParcelIds.forEach((parcelId, index) => {
      const layer = this.parcelLayersById.get(parcelId);
      if (!layer) {
        return;
      }

      const center = (layer as L.Polygon).getBounds().getCenter();
      const labelText = `${index + 1}`;
      const existingLabel = this.orderLabelsByParcelId.get(parcelId);

      if (existingLabel) {
        existingLabel.setLatLng(center);
        existingLabel.setContent(`<span>${labelText}</span>`);
        return;
      }

      const label = L.tooltip({
        permanent: true,
        direction: 'center',
        className: 'route-order-label',
        opacity: 1
      })
        .setLatLng(center)
        .setContent(`<span>${labelText}</span>`)
        .addTo(mapRef);

      this.orderLabelsByParcelId.set(parcelId, label);
    });
  }

  private removeOrderLabel(parcelId: number): void {
    const label = this.orderLabelsByParcelId.get(parcelId);
    if (!label || !this.map) {
      return;
    }

    this.map.removeLayer(label);
    this.orderLabelsByParcelId.delete(parcelId);
  }
}