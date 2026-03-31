import { Component } from '@angular/core';
import { DashboardTile } from '../../models/dashboard-tile.model';
import { DASHBOARD_TILES } from '../../dashboard-tiles';

@Component({
  selector: 'app-dashboard-page',
  standalone: false,
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css']
})
export class DashboardPageComponent {
  readonly tiles: DashboardTile[] = DASHBOARD_TILES.filter((tile) => tile.enabled);
}
