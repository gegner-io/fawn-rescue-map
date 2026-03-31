# Backend

Express + TypeScript API mit JWT-Auth, Rollenprüfung und PostgreSQL-User-Store.

## Voraussetzungen

- Node.js 20+
- npm
- PostgreSQL 16+ (lokal oder via Docker Compose)

## Lokal starten

```bash
npm install
npm run dev
```

API läuft dann unter:

- http://localhost:4000
- Healthcheck: http://localhost:4000/health

## Aktueller Auth-Stand

Implementiert:

- `POST /api/auth/login` (JWT Login)
- `GET /api/me` (nur mit Bearer Token)
- `GET /api/admin/ping` (nur Rolle `admin`)
- `GET /api/applications` (auth)
- `POST /api/applications` (auth)
- `PATCH /api/applications/:id/status` (auth)
- `GET /api/users` (auth + Rolle `admin`)
- `POST /api/users` (auth + Rolle `admin`)
- `PATCH /api/users/:id` (auth + Rolle `admin`)

Hinweis zur Benutzerverwaltung:

- Deaktivierte Benutzer (`is_active=false`) können sich nicht mehr einloggen.

Antragsliste mit Filter/Pagination:

- `GET /api/applications?status=new|review|approved&search=<text>&page=1&pageSize=10`
- `status` und `search` sind optional.
- Antwort enthält zusätzlich `page`, `pageSize`, `total`, `totalPages`.

Demo-User (Seed in PostgreSQL):

- `admin@fawn.local` / `admin123`
- `dispatcher@fawn.local` / `dispatch123`
- `viewer@fawn.local` / `viewer123`

## Build

```bash
npm run build
npm start
```

## Umgebungsvariablen

Kopiere `.env.example` nach `.env` und passe bei Bedarf an.

- `PORT` (Default: `4000`)
- `FRONTEND_ORIGIN` (Default: `http://localhost:4200`, mehrere Origins per Komma getrennt)
- `JWT_SECRET` (Default: `dev-insecure-key-change-me`)
- `JWT_EXPIRES_IN` (Default: `8h`)
- `NODE_ENV` (`development` oder `production`)
- `DB_HOST` (Default: `localhost`)
- `DB_PORT` (Default: `5432`)
- `DB_USER` (Default: `fawn_user`)
- `DB_PASSWORD` (Default: `fawn_password`)
- `DB_NAME` (Default: `fawn_rescue`)
- `AUTO_SEED` (Default: `true`)

Seed-Konfiguration:

- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`, `SEED_ADMIN_PASSWORD`
- `SEED_DISPATCHER_EMAIL`, `SEED_DISPATCHER_NAME`, `SEED_DISPATCHER_PASSWORD`
- `SEED_VIEWER_EMAIL`, `SEED_VIEWER_NAME`, `SEED_VIEWER_PASSWORD`

Hinweis:

- Bei `AUTO_SEED=true` werden Seed-User bei jedem Start per Upsert aktualisiert.
- Für produktive Umgebungen `AUTO_SEED=false` setzen.

## Security-Hinweise (aktuell umgesetzt)

- Login-Rate-Limit aktiv auf `POST /api/auth/login` (15 Versuche / 15 Minuten pro IP)
- CORS über explizite Allowlist (`FRONTEND_ORIGIN`)
- JWT-Secret-Guard: In `NODE_ENV=production` startet die API nicht mit dem Dev-Secret

## Docker

Docker-Betrieb erfolgt über das Root-`docker-compose.yml`.

## Production-Vorbereitung

1) Produktions-Env aus Vorlage erstellen:

```bash
cp .env.production.example .env.production
```

2) Werte in `.env.production` setzen (Secrets, DB, Origins).

	Für dein Setup:

	- `FRONTEND_ORIGIN=https://core.ipv64.de`
	- `FRONTEND_DOMAIN=core.ipv64.de`
	- `API_DOMAIN=api.core.ipv64.de`
	- `AUTO_SEED=false`

3) Frontend Build für Server erzeugen:

```bash
cd ../rehkitz-web
npm ci
npm run build -- --configuration production --base-href /
cd ..
```

4) Production-Stack starten:

```bash
cd ..
docker compose -f docker-compose.prod.yml --env-file backend/.env.production up -d --build
```

Dabei übernimmt Caddy automatisch:

- HTTPS-Zertifikate für `core.ipv64.de` und `api.core.ipv64.de`
- Auslieferung des Angular Frontends unter `core.ipv64.de`
- Reverse Proxy von `:443` auf internen API-Service `api:4000`

5) Pre-Go-Live-Checks ausführen:

```powershell
./backend/scripts/pre-go-live-check.ps1 -ApiBaseUrl "https://api.deinedomain.tld" -AdminEmail "<admin-email>" -AdminPassword "<admin-password>"
```

In deinem Fall:

```powershell
./backend/scripts/pre-go-live-check.ps1 -ApiBaseUrl "https://api.core.ipv64.de" -AdminEmail "<admin-email>" -AdminPassword "<admin-password>"
```
