import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ParcelDetails } from '../../models/data-contract.models';

@Component({
  selector: 'app-parcel-sidebar',
  standalone: false,
  templateUrl: './parcel-sidebar.component.html',
  styleUrls: ['./parcel-sidebar.component.css']
})
export class ParcelSidebarComponent {
  @Input() selectedParcelIds: number[] = [];
  @Input() activeParcelId: number | null = null;
  @Input() parcelDetails: ParcelDetails | null = null;
  @Input() loading = false;
  @Input() errorMessage: string | null = null;

  @Output() selectParcel = new EventEmitter<number>();
  @Output() removeParcel = new EventEmitter<number>();
  @Output() reorderParcels = new EventEmitter<{ previousIndex: number; currentIndex: number }>();
  @Output() initiateMission = new EventEmitter<{
    parcelIds: number[];
    mowingStartDate: string;
    mowingStartTime: string;
  }>();

  mowingStartDate = '';
  mowingStartTime = '';

  onSelectParcel(parcelId: number): void {
    this.selectParcel.emit(parcelId);
  }

  onRemoveParcel(parcelId: number): void {
    this.removeParcel.emit(parcelId);
  }

  onDrop(event: CdkDragDrop<number[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      this.reorderParcels.emit({
        previousIndex: event.previousIndex,
        currentIndex: event.currentIndex
      });
    }
  }

  onInitiateMission(): void {
    if (this.selectedParcelIds.length > 0 && this.mowingStartDate && this.mowingStartTime) {
      this.initiateMission.emit({
        parcelIds: this.selectedParcelIds,
        mowingStartDate: this.mowingStartDate,
        mowingStartTime: this.mowingStartTime
      });
    }
  }
}