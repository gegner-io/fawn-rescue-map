import { DashboardTile } from './models/dashboard-tile.model';

export const DASHBOARD_TILES: DashboardTile[] = [
  {
    id: 'map',
    title: 'Karte',
    description: 'Parzellen und Einsatzplanung auf der Karte öffnen.',
    route: '/map',
    enabled: true
  },
  {
    id: 'applications',
    title: 'Anträge',
    description: 'Anträge erfassen und in der Übersicht bearbeiten.',
    route: '/applications',
    enabled: true
  },
  {
    id: 'users',
    title: 'Benutzerverwaltung',
    description: 'Benutzer anlegen, Rollen setzen und Status verwalten.',
    route: '/users',
    enabled: true
  }
];
