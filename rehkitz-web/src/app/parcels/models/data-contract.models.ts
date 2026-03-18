export type ParcelGeometryType = 'Polygon' | 'MultiPolygon';

export interface ParcelProperties {
  parcel_id: number;
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
  status?: ParcelStatus;
  areaM2?: number;
  confidence?: number;
  sourceTileZoom?: number;
  notes?: string;
}