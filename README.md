# fawn-rescue-map

![Frontend Angular](https://img.shields.io/badge/Frontend-Angular%2020-DD0031?logo=angular&logoColor=white)
![Map Leaflet](https://img.shields.io/badge/Map-Leaflet-199900?logo=leaflet&logoColor=white)
![Deploy GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-121013?logo=github&logoColor=white)

Interaktive Kartenanwendung zur Einsatzplanung der Rehkitzrettung vor Mäharbeiten.
Das Frontend unterstützt die Auswahl mehrerer Parzellen, eine definierte Befliegungs-Reihenfolge und die strukturierte Übergabe eines Missionsauftrags.

## Live-Demo

- GitHub Pages: https://gegner-io.github.io/fawn-rescue-map/

## Projektüberblick

Dieses Repository enthält das Web-Frontend (Angular), das auf Basis einer GeoJSON-Datei Parzellen visualisiert und für einen Drohneneinsatz planbar macht.

Kernfunktionen:

- Darstellung von Parzellen aus `parcels.geojson` (Leaflet)
- Mehrfachauswahl von Flächen per Klick
- Reihenfolgeplanung per Drag & Drop (Sidebar)
- Visualisierung der Reihenfolge direkt auf der Karte (1, 2, 3, …)
- Erfassung von geplantem Mähstart (Datum + Uhrzeit)
- Demo-Auftragsdialog als Platzhalter für spätere Live-Integration

## Datenquelle / Contract

- Vertragsdefinition: `DATA_CONTRACT.md`
- Primäres Datenartefakt: `parcels.geojson` (FeatureCollection)
- Pflichtfeld je Feature: `properties.parcel_id`

Wichtig:

- Das Frontend erzeugt keine künstlichen Parzellendetails mehr.
- Optionale Felder (z. B. `area_m2`, `confidence`, `status`) werden nur angezeigt, wenn sie in der GeoJSON vorhanden sind.

## Struktur

- `rehkitz-web/` – Angular-Frontend
- `backend/` – API-Startservice (Express + TypeScript)
- `docker-compose.yml` – lokale Self-Hosting-Basis (API + PostgreSQL)
- `parcels.geojson` – aktuelle Parzellendaten
- `DATA_CONTRACT.md` – Datenvertrag zwischen Pipeline und Frontend

## Lokal starten (nur Frontend)

```bash
cd rehkitz-web
npm install
npm start
```

Dann im Browser öffnen:

- http://localhost:4200/

## Lokal starten (Frontend + Backend + DB)

1) Backend-Abhängigkeiten installieren:

```bash
cd backend
npm install
```

2) Backend lokal starten:

```bash
npm run dev
```

3) Datenbank + API alternativ per Docker Compose starten:

```bash
cd ..
docker compose up --build
```

4) Frontend starten:

```bash
cd rehkitz-web
npm install
npm start
```

Wichtige Endpunkte lokal:

- Frontend: http://localhost:4200/
- Backend Health: http://localhost:4000/health
- PostgreSQL: localhost:5432

Hinweis:

- Die produktive API-URL ist über Angular Environments vorbereitet (`https://api.core.ipv64.de`).
- Auth ist als MVP implementiert (`/api/auth/login`, `/api/me`, Rollenroute `/api/admin/ping`).
- Userdaten liegen jetzt in PostgreSQL; Default-Seed ist für lokale Entwicklung aktiv.
- Security-Hardening aktiv: Login-Rate-Limit, CORS-Allowlist, sichere JWT-Checks in Production.

## Deployment (GitHub Pages)

Das Deployment läuft über GitHub Actions:

- Workflow: `.github/workflows/deploy-pages.yml`
- Trigger: Push auf `main`/`master` mit Änderungen unter `rehkitz-web/**`
- Ziel: GitHub Pages

Einmalig in GitHub aktivieren:

- Repository Settings → Pages → Source: **GitHub Actions**

## Backend Production Runbook

Für produktionsnahe Inbetriebnahme liegen jetzt zusätzlich vor:

- [docker-compose.prod.yml](docker-compose.prod.yml)
- [backend/.env.production.example](backend/.env.production.example)
- [backend/scripts/pre-go-live-check.ps1](backend/scripts/pre-go-live-check.ps1)
- [deploy/Caddyfile](deploy/Caddyfile)

Empfohlene Reihenfolge:

1. `backend/.env.production` aus Vorlage erzeugen und alle Secrets setzen
2. Frontend Build für Server erstellen: `cd rehkitz-web && npm ci && npm run build -- --configuration production --base-href /`
3. `docker compose -f docker-compose.prod.yml --env-file backend/.env.production up -d --build`
4. `https://api.core.ipv64.de/health` und `https://core.ipv64.de` prüfen
5. Pre-Go-Live-Checks mit dem PowerShell-Script gegen die Ziel-API ausführen

## GeoJSON-Scraper

- Die Aufbereitung der GeoJson erfolgt in einem anderen Projekt

## Ausblick: weitere Automatisierung der Rehkitzrettung

Mögliche nächste Schritte:

- Automatische Übernahme neuer GeoJSON-Daten aus der Pipeline
- Validierungs-Checks (z. B. Vollständigkeit, Geometriequalität, Pflichtfelder)
- Backend-Integration für echte Missionsaufträge und Pilot-Benachrichtigung
- Statusfluss pro Parzelle (geplant, bestätigt, geflogen, abgeschlossen)
- Export/Reporting für Einsatzdokumentation und Nachverfolgung
