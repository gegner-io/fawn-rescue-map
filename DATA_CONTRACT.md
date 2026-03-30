# Data Contract for Rehkitz Web

This document defines the interface between:

- **tilescraper** (this repository, data pipeline)
- **rehkitz-web** (separate repository, map and mission application)

## Primary artifact

### `outputs/parcels.geojson`

- Format: GeoJSON `FeatureCollection`
- CRS: WGS84 (GeoJSON standard; lon/lat)
- Geometry type: `Polygon` (optionally `MultiPolygon` in future versions)
- Required field in `properties`:
  - `parcel_id` (`integer`, unique within the file)

### Example structure

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "parcel_id": 1
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[10.0, 49.0], [10.1, 49.0], [10.1, 49.1], [10.0, 49.0]]]
      }
    }
  ]
}
```

## Optional secondary artifact

### `outputs/mosaic_bounds.json`

- Purpose: map initialization / zoom-to-extent in the web repository
- Structure:

```json
{
  "bounds": [north, south, west, east]
}
```

## Semantics

- One feature in `outputs/parcels.geojson` represents one selectable area for mission planning.
- `parcel_id` is the stable reference used by the UI (selection, sorting, exports).
- Operational statuses (e.g., final mission selection) are managed in the web repository, not in this pipeline repository.

## Contract versioning

- Initial version: `v1`
- Compatibility policy:
  - New optional fields in `properties`: **minor-compatible**
  - Changes to required fields or geometry model: **breaking change** (new contract version)

## Planned extensions (v2+)

Possible optional fields:

- `hegegemeinschaft_id` (`string`)
- `hegegemeinschaft_name` (`string`)
- `revier_id` (`string`)
- `revier_name` (`string`)
- `source_tile_zoom` (`integer`)
- `confidence` (`number` from 0 to 1)
- `area_m2` (`number`)
- `status` (`string`, e.g. `candidate`, `excluded`, `selected`) — typically web-managed

## Quality checklist

Before handing data to the web repository, ensure:

- GeoJSON is parseable
- `parcel_id` exists and is unique
- Geometries are valid (no empty features)
- File size is browser-friendly (simplify/chunk if needed)
