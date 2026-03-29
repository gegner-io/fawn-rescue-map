import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPageComponent } from './auth/components/login-page/login-page.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { ParcelMapPageComponent } from './parcels/components/parcel-map-page/parcel-map-page.component';

const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: '', component: ParcelMapPageComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
