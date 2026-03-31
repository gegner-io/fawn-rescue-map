import { Component, OnInit } from '@angular/core';
import { ApplicationStatus, RescueApplication } from '../../models/applications.models';
import { ApplicationsService } from '../../services/applications.service';

@Component({
  selector: 'app-applications-page',
  standalone: false,
  templateUrl: './applications-page.component.html',
  styleUrls: ['./applications-page.component.css']
})
export class ApplicationsPageComponent implements OnInit {
  applicant = '';
  parcelReference = '';
  note = '';
  loading = false;
  submitting = false;
  errorMessage: string | null = null;
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;
  filterStatus: 'all' | ApplicationStatus = 'all';
  searchTerm = '';
  readonly pageSizeOptions = [5, 10, 20];

  applications: RescueApplication[] = [];

  constructor(private readonly applicationsService: ApplicationsService) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading = true;
    this.errorMessage = null;

    this.applicationsService
      .listApplications({
        status: this.filterStatus === 'all' ? undefined : this.filterStatus,
        search: this.searchTerm,
        page: this.page,
        pageSize: this.pageSize
      })
      .subscribe({
      next: (response) => {
        this.applications = response.applications;
        this.page = response.page;
        this.pageSize = response.pageSize;
        this.total = response.total;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Anträge konnten nicht geladen werden.';
      }
      });
  }

  submitApplication(): void {
    const applicant = this.applicant.trim();
    const parcelReference = this.parcelReference.trim();

    if (!applicant || !parcelReference) {
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    this.applicationsService
      .createApplication({
        applicant,
        parcelReference,
        note: this.note.trim()
      })
      .subscribe({
        next: (response) => {
          if (this.page !== 1) {
            this.page = 1;
            this.loadApplications();
          } else {
            this.loadApplications();
          }
          this.applicant = '';
          this.parcelReference = '';
          this.note = '';
          this.submitting = false;
        },
        error: () => {
          this.submitting = false;
          this.errorMessage = 'Antrag konnte nicht angelegt werden.';
        }
      });
  }

  advanceStatus(application: RescueApplication): void {
    const nextStatus = this.applicationsService.nextStatus(application.status);

    this.applicationsService.updateStatus(application.id, nextStatus).subscribe({
      next: (response) => {
        this.applications = this.applications.map((item) =>
          item.id === application.id ? response.application : item
        );
      },
      error: () => {
        this.errorMessage = 'Status konnte nicht aktualisiert werden.';
      }
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadApplications();
  }

  clearFilters(): void {
    this.filterStatus = 'all';
    this.searchTerm = '';
    this.page = 1;
    this.loadApplications();
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.loadApplications();
  }

  previousPage(): void {
    if (this.page <= 1) {
      return;
    }

    this.page -= 1;
    this.loadApplications();
  }

  nextPage(): void {
    if (this.page >= this.totalPages) {
      return;
    }

    this.page += 1;
    this.loadApplications();
  }

  getStatusLabel(status: RescueApplication['status']): string {
    return this.applicationsService.getStatusLabel(status);
  }

  formatRequestedAt(value: string): string {
    return this.applicationsService.formatRequestedAt(value);
  }
}
