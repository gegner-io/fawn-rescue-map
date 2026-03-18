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
- `parcels.geojson` – aktuelle Parzellendaten
- `DATA_CONTRACT.md` – Datenvertrag zwischen Pipeline und Frontend

## Lokal starten

```bash
cd rehkitz-web
npm install
npm start
```

Dann im Browser öffnen:

- http://localhost:4200/

## Deployment (GitHub Pages)

Das Deployment läuft über GitHub Actions:

- Workflow: `.github/workflows/deploy-pages.yml`
- Trigger: Push auf `main`/`master` mit Änderungen unter `rehkitz-web/**`
- Ziel: GitHub Pages

Einmalig in GitHub aktivieren:

- Repository Settings → Pages → Source: **GitHub Actions**

## GeoJSON-Scraper

- Die Aufbereitung der GeoJson erfolgt in einem anderen Projekt

## Ausblick: weitere Automatisierung der Rehkitzrettung

Mögliche nächste Schritte:

- Automatische Übernahme neuer GeoJSON-Daten aus der Pipeline
- Validierungs-Checks (z. B. Vollständigkeit, Geometriequalität, Pflichtfelder)
- Backend-Integration für echte Missionsaufträge und Pilot-Benachrichtigung
- Statusfluss pro Parzelle (geplant, bestätigt, geflogen, abgeschlossen)
- Export/Reporting für Einsatzdokumentation und Nachverfolgung
