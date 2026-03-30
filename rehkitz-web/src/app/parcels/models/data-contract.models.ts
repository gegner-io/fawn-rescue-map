export type ParcelGeometryType = 'Polygon' | 'MultiPolygon';

export interface ParcelProperties {
  parcel_id: number;
  hegegemeinschaft_id?: string;
  hegegemeinschaft_name?: string;
  revier_id?: string;
  revier_name?: string;
  source_tile_zoom?: number;
  confidence?: number;
  area_m2?: number;
  status?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface MultiPolygonGeometry {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

export type ParcelGeometry = PolygonGeometry | MultiPolygonGeometry;

export interface ParcelFeature {
  type: 'Feature';
  properties: ParcelProperties;
  geometry: ParcelGeometry;
}

export interface ParcelFeatureCollection {
  type: 'FeatureCollection';
  features: ParcelFeature[];
}

export type ParcelStatus = string;

export interface ParcelDetails {
  parcelId: number;
  hegegemeinschaftName?: string;
  revierName?: string;
  status?: ParcelStatus;
  areaM2?: number;
  confidence?: number;
  sourceTileZoom?: number;
  notes?: string;
}

export interface RevierSummary {
  id: string;
  name: string;
  parcelCount: number;
}

export interface HegegemeinschaftSummary {
  id: string;
  name: string;
  parcelCount: number;
  reviere: RevierSummary[];
}

export interface ParcelIndexResponse {
  hegegemeinschaften: HegegemeinschaftSummary[];
}