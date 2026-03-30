import { promises as fs } from 'node:fs';
import path from 'node:path';

interface ParcelFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: unknown;
}

interface ParcelFeatureCollection {
  type: 'FeatureCollection';
  features: ParcelFeature[];
}

interface GroupInfo {
  hegegemeinschaftId: string;
  hegegemeinschaftName: string;
  revierId: string;
  revierName: string;
}

interface ParcelCatalogOptions {
  geoJsonPath?: string;
  enableMockGrouping?: boolean;
  totalHegegemeinschaften?: number;
  totalReviere?: number;
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

export interface ParcelMockPreviewResponse {
  groupingMode: 'mock' | 'geojson';
  totalParcels: number;
  totalHegegemeinschaften: number;
  totalReviere: number;
  hegegemeinschaften: HegegemeinschaftSummary[];
}

const UNKNOWN_HEGE_ID = 'hg-unassigned';
const UNKNOWN_HEGE_NAME = 'Nicht zugeordnet';
const UNKNOWN_REVIER_ID = 'revier-unassigned';
const UNKNOWN_REVIER_NAME = 'Nicht zugeordnet';

export class ParcelCatalog {
  private readonly configuredGeoJsonPath?: string;
  private readonly enableMockGrouping: boolean;
  private readonly totalHegegemeinschaften: number;
  private readonly totalReviere: number;
  private featureCollectionCache: ParcelFeatureCollection | null = null;

  constructor(options: ParcelCatalogOptions = {}) {
    this.configuredGeoJsonPath = options.geoJsonPath;
    this.enableMockGrouping = options.enableMockGrouping ?? false;
    this.totalHegegemeinschaften = this.normalizePositiveInt(options.totalHegegemeinschaften, 11);
    this.totalReviere = this.normalizePositiveInt(options.totalReviere, 131);
  }

  async getIndex(): Promise<ParcelIndexResponse> {
    const collection = await this.getCollection();

    const hegeMap = new Map<string, { id: string; name: string; parcelCount: number; reviere: Map<string, RevierSummary> }>();

    for (const feature of collection.features) {
      const group = this.readGrouping(feature);

      if (!hegeMap.has(group.hegegemeinschaftId)) {
        hegeMap.set(group.hegegemeinschaftId, {
          id: group.hegegemeinschaftId,
          name: group.hegegemeinschaftName,
          parcelCount: 0,
          reviere: new Map<string, RevierSummary>()
        });
      }

      const hege = hegeMap.get(group.hegegemeinschaftId)!;
      hege.parcelCount += 1;

      if (!hege.reviere.has(group.revierId)) {
        hege.reviere.set(group.revierId, {
          id: group.revierId,
          name: group.revierName,
          parcelCount: 0
        });
      }

      const revier = hege.reviere.get(group.revierId)!;
      revier.parcelCount += 1;
    }

    const hegegemeinschaften = Array.from(hegeMap.values())
      .map((item) => ({
        id: item.id,
        name: item.name,
        parcelCount: item.parcelCount,
        reviere: Array.from(item.reviere.values()).sort((a, b) => a.name.localeCompare(b.name, 'de'))
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));

    return { hegegemeinschaften };
  }

  async getParcels(params: { revierId?: string; hegegemeinschaftId?: string }): Promise<ParcelFeatureCollection> {
    const collection = await this.getCollection();

    const filtered = collection.features.filter((feature) => {
      const group = this.readGrouping(feature);

      if (params.revierId && group.revierId !== params.revierId) {
        return false;
      }

      if (params.hegegemeinschaftId && group.hegegemeinschaftId !== params.hegegemeinschaftId) {
        return false;
      }

      return true;
    });

    return {
      type: 'FeatureCollection',
      features: filtered.map((feature) => {
        const grouping = this.readGrouping(feature);

        return {
          ...feature,
          properties: {
            ...feature.properties,
            hegegemeinschaft_id: grouping.hegegemeinschaftId,
            hegegemeinschaft_name: grouping.hegegemeinschaftName,
            revier_id: grouping.revierId,
            revier_name: grouping.revierName
          }
        };
      })
    };
  }

  async getMockPreview(): Promise<ParcelMockPreviewResponse> {
    const index = await this.getIndex();
    const totalParcels = index.hegegemeinschaften.reduce((sum, item) => sum + item.parcelCount, 0);
    const totalReviere = index.hegegemeinschaften.reduce((sum, item) => sum + item.reviere.length, 0);

    return {
      groupingMode: this.enableMockGrouping ? 'mock' : 'geojson',
      totalParcels,
      totalHegegemeinschaften: index.hegegemeinschaften.length,
      totalReviere,
      hegegemeinschaften: index.hegegemeinschaften
    };
  }

  private async getCollection(): Promise<ParcelFeatureCollection> {
    if (this.featureCollectionCache) {
      return this.featureCollectionCache;
    }

    const filePath = await this.resolveGeoJsonPath();
    const payload = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(payload) as ParcelFeatureCollection;

    if (parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) {
      throw new Error('Invalid parcels GeoJSON: expected FeatureCollection with features array');
    }

    this.featureCollectionCache = parsed;
    return parsed;
  }

  private async resolveGeoJsonPath(): Promise<string> {
    if (this.configuredGeoJsonPath) {
      return this.configuredGeoJsonPath;
    }

    const candidates = [
      path.resolve(process.cwd(), 'parcels.geojson'),
      path.resolve(process.cwd(), '../parcels.geojson')
    ];

    for (const candidate of candidates) {
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }

    throw new Error('Unable to locate parcels.geojson. Set PARCELS_GEOJSON_PATH to a valid file path.');
  }

  private readGrouping(feature: ParcelFeature): GroupInfo {
    const props = feature.properties ?? {};

    const hegegemeinschaftId = this.coerceString(
      this.readFromProperties(props, ['hegegemeinschaft_id', 'hegegemeinschaftId', 'hg_id', 'hgId'])
    ) ?? UNKNOWN_HEGE_ID;

    const hegegemeinschaftName = this.coerceString(
      this.readFromProperties(props, ['hegegemeinschaft_name', 'hegegemeinschaftName', 'hegegemeinschaft', 'hg'])
    ) ?? UNKNOWN_HEGE_NAME;

    const revierId = this.coerceString(
      this.readFromProperties(props, ['revier_id', 'revierId'])
    ) ?? UNKNOWN_REVIER_ID;

    const revierName = this.coerceString(
      this.readFromProperties(props, ['revier_name', 'revierName', 'revier'])
    ) ?? UNKNOWN_REVIER_NAME;

    if (
      this.enableMockGrouping &&
      hegegemeinschaftId === UNKNOWN_HEGE_ID &&
      revierId === UNKNOWN_REVIER_ID
    ) {
      const parcelId = this.coerceParcelId(props.parcel_id);

      if (parcelId !== undefined) {
        return this.buildMockGrouping(parcelId);
      }
    }

    return {
      hegegemeinschaftId,
      hegegemeinschaftName,
      revierId,
      revierName
    };
  }

  private readFromProperties(properties: Record<string, unknown>, keys: string[]): unknown {
    for (const key of keys) {
      if (properties[key] !== undefined && properties[key] !== null) {
        return properties[key];
      }
    }

    return undefined;
  }

  private coerceString(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return undefined;
  }

  private coerceParcelId(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.trunc(value);
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return Math.trunc(parsed);
      }
    }

    return undefined;
  }

  private buildMockGrouping(parcelId: number): GroupInfo {
    const normalizedParcelId = parcelId > 0 ? parcelId : 1;
    const revierNumber = ((normalizedParcelId - 1) % this.totalReviere) + 1;
    const hegegemeinschaftNumber = ((revierNumber - 1) % this.totalHegegemeinschaften) + 1;

    return {
      hegegemeinschaftId: `hg-${String(hegegemeinschaftNumber).padStart(2, '0')}`,
      hegegemeinschaftName: `Hegegemeinschaft ${hegegemeinschaftNumber}`,
      revierId: `revier-${String(revierNumber).padStart(3, '0')}`,
      revierName: `Revier ${revierNumber}`
    };
  }

  private normalizePositiveInt(value: number | undefined, fallback: number): number {
    if (!value || !Number.isFinite(value) || value < 1) {
      return fallback;
    }

    return Math.floor(value);
  }
}
