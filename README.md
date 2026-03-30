# fawn-rescue-map

![Frontend Angular](https://img.shields.io/badge/Frontend-Angular%2020-DD0031?logo=angular&logoColor=white)
![Backend Express](https://img.shields.io/badge/Backend-Express-000000?logo=express&logoColor=white)
![Database Postgres](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql&logoColor=white)
![Proxy Caddy](https://img.shields.io/badge/Reverse%20Proxy-Caddy-1f88c0)

Interaktive Kartenanwendung zur Einsatzplanung der Rehkitzrettung vor Mäharbeiten, inklusive Login-geschützter Web-App und API.

## Aktueller Stand

- Frontend: Angular + Leaflet + Drag&Drop-Reihenfolge
- Backend: Express + TypeScript + JWT Auth + Rollenprüfung
- Datenhaltung: PostgreSQL (`app_users`)
- Betrieb: Docker Compose + Caddy (TLS + Reverse Proxy + Static Hosting)
- Live-Domains:
	- Frontend: `https://core.ipv64.de`
	- API: `https://api.core.ipv64.de`

## Features

- Parzellenauswahl und Reihenfolgeplanung auf Karte
- Login-Flow mit geschützter App-Route
- Revierbasierte Datenladung (kein Full-GeoJSON-Load im Frontend)
- API-Endpunkte:
	- `POST /api/auth/login`
	- `GET /api/me`
	- `GET /api/admin/ping` (Rolle `admin`)
	- `GET /api/parcels/index`
	- `GET /api/parcels?revierId=<id>&hegegemeinschaftId=<id>`
- Security-Bausteine:
	- CORS-Allowlist
	- Login-Rate-Limit
	- Produktions-Guards für Secrets/Defaults

## Repository-Struktur

- `rehkitz-web/` – Angular Frontend
- `backend/` – Express API
- `deploy/Caddyfile` – Reverse Proxy + Frontend Hosting
- `docker-compose.yml` – lokale Entwicklung
- `docker-compose.prod.yml` – produktionsnaher Stack
- `DATA_CONTRACT.md` – Datenvertrag

## Lokale Entwicklung

### Frontend

```bash
cd rehkitz-web
npm install
npm start
```

Frontend lokal: `http://localhost:4200`

### Backend + DB

```bash
cd backend
npm install
npm run dev
```

Alternativ per Docker (API + DB):

```bash
cd ..
docker compose up --build
```

Backend lokal: `http://localhost:4000/health`

## Produktion (Server)

### Voraussetzungen

- DNS:
	- `core.ipv64.de` → Server-IP
	- `api.core.ipv64.de` → Server-IP
- Router-Forwarding: nur Ports `80` und `443`
- Keine direkte Freigabe von API-Port `4000`

### Einmaliges Setup

1. Produktions-Env erzeugen:

```bash
cp backend/.env.production.example backend/.env.production
```

2. `backend/.env.production` ausfüllen (echte Werte, keine Platzhalter):

- `FRONTEND_DOMAIN=core.ipv64.de`
- `API_DOMAIN=api.core.ipv64.de`
- `FRONTEND_ORIGIN=https://core.ipv64.de`
- `PARCELS_GEOJSON_PATH=/app/parcels.geojson`
- starkes `JWT_SECRET`
- starkes `DB_PASSWORD`
- `AUTO_SEED=false`

3. Frontend builden (empfohlen lokal) und `rehkitz-web/dist/rehkitz-web/browser` auf den Server kopieren.

4. Stack starten/aktualisieren:

```bash
docker compose --env-file backend/.env.production -f docker-compose.prod.yml up -d --build
```

### Validierung

```bash
curl -I https://core.ipv64.de
curl -I https://api.core.ipv64.de/health
```

Auth-Test:

```bash
curl -s -X POST "https://api.core.ipv64.de/api/auth/login" \
	-H "Content-Type: application/json" \
	-d '{"email":"<admin-email>","password":"<admin-password>"}'
```

## Deployment-Workflow (empfohlen)

1. Lokal entwickeln + testen
2. Änderungen in Branch committen/pushen
3. Auf Server pullen
4. Frontend-Build auf Server aktualisieren
5. `docker compose ... up -d --build` ausführen

## Sicherheitshinweise

- Niemals `backend/.env.production` ins Git committen
- Secrets regelmäßig rotieren (`JWT_SECRET`, Admin-Passwort, DB-Passwort)
- `AUTO_SEED` in Produktion auf `false` lassen
- `FRONTEND_ORIGIN` nur auf notwendige Origins begrenzen

## Bekannte Stolperfallen

- CORS-Fehler beim lokalen Frontend-Test gegen Live-API: `FRONTEND_ORIGIN` temporär um `http://localhost:4200` ergänzen, danach wieder entfernen.
- Wenn Revier-/Hege-Felder in GeoJSON fehlen, werden Features als `Nicht zugeordnet` gruppiert.
- Angular Build auf älteren Servern (Node < 20): lokal builden und `dist` deployen.
- `curl` vom Server gegen eigene Public Domain kann durch NAT-Loopback verfälscht sein; externe Prüfung im Browser/Client bevorzugen.

## GeoJSON / Contract

- Datenquelle: `parcels.geojson`
- Vertragsdefinition: `DATA_CONTRACT.md`
- Pflichtfeld pro Feature: `properties.parcel_id`
