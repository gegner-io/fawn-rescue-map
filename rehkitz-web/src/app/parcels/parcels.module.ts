import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { ParcelMapPageComponent } from './components/parcel-map-page/parcel-map-page.component';
import { ParcelSidebarComponent } from './components/parcel-sidebar/parcel-sidebar.component';

@NgModule({
  declarations: [ParcelMapPageComponent, ParcelSidebarComponent],
  imports: [CommonModule, DragDropModule, FormsModule],
  exports: [ParcelMapPageComponent]
})
export class ParcelsModule {}