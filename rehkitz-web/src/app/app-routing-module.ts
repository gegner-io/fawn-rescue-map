import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ParcelMapPageComponent } from './parcels/components/parcel-map-page/parcel-map-page.component';

const routes: Routes = [
  { path: '', component: ParcelMapPageComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
