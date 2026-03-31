import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPageComponent } from './auth/components/login-page/login-page.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { ParcelMapPageComponent } from './parcels/components/parcel-map-page/parcel-map-page.component';
import { DashboardPageComponent } from './dashboard/components/dashboard-page/dashboard-page.component';
import { ApplicationsPageComponent } from './applications/components/applications-page/applications-page.component';
import { UsersPageComponent } from './users/components/users-page/users-page.component';

const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [AuthGuard] },
  { path: 'map', component: ParcelMapPageComponent, canActivate: [AuthGuard] },
  { path: 'applications', component: ApplicationsPageComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UsersPageComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
