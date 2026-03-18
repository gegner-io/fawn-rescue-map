# fawn-rescue-map
Interactive map for selecting land parcels to be surveyed by drones for fawn detection before mowing. Helps protect wildlife by guiding drone flights efficiently.

## Angular app (rehkitz-web)

An Angular reference implementation is available in [rehkitz-web](rehkitz-web).

### Functionality

- Loads parcel geometry from `public/assets/parcels.geojson` using the `DATA_CONTRACT.md` structure.
- Renders selectable parcels on an interactive Leaflet map.
- Fetches parcel details on click via a mock backend service (`ParcelBackendService`).
- Shows details in a responsive sidebar and includes a mission-start placeholder action.

### Run locally

```bash
cd rehkitz-web
npm install
npm start
```

Open `http://localhost:4200`.
