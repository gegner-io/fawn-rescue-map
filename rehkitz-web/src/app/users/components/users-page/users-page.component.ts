import { Component, OnInit } from '@angular/core';
import { ManagedUser, UserRole } from '../../models/users.models';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-users-page',
  standalone: false,
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.css']
})
export class UsersPageComponent implements OnInit {
  inviteName = '';
  inviteEmail = '';
  inviteRole: UserRole = 'viewer';
  loading = false;
  submitting = false;
  errorMessage: string | null = null;

  readonly availableRoles: UserRole[] = ['admin', 'dispatcher', 'viewer'];
  users: ManagedUser[] = [];

  constructor(private readonly usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = null;

    this.usersService.listUsers().subscribe({
      next: (response) => {
        this.users = response.users;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        if (error?.status === 403) {
          this.errorMessage = 'Keine Berechtigung für die Benutzerverwaltung (Admin erforderlich).';
          return;
        }

        this.errorMessage = 'Benutzer konnten nicht geladen werden.';
      }
    });
  }

  inviteUser(): void {
    const name = this.inviteName.trim();
    const email = this.inviteEmail.trim();

    if (!name || !email) {
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    this.usersService
      .createUser({
        name,
        email,
        role: this.inviteRole
      })
      .subscribe({
        next: (response) => {
          this.users = [response.user, ...this.users];
          this.inviteName = '';
          this.inviteEmail = '';
          this.inviteRole = 'viewer';
          this.submitting = false;
        },
        error: () => {
          this.submitting = false;
          this.errorMessage = 'Nutzer konnte nicht angelegt werden.';
        }
      });
  }

  updateUser(user: ManagedUser): void {
    this.usersService
      .updateUser(user.id, {
        role: user.role,
        active: user.active
      })
      .subscribe({
        next: (response) => {
          this.users = this.users.map((item) => {
            if (item.id !== user.id) {
              return item;
            }

            return response.user;
          });
        },
        error: () => {
          this.errorMessage = 'Nutzer konnte nicht aktualisiert werden.';
          this.loadUsers();
        }
      });
  }

  toggleActive(user: ManagedUser): void {
    const updatedUser: ManagedUser = {
      ...user,
      active: !user.active
    };

    this.users = this.users.map((item) => {
      if (item.id !== user.id) {
        return item;
      }

      return updatedUser;
    });

    this.updateUser(updatedUser);
  }

  onRoleChange(user: ManagedUser): void {
    this.updateUser(user);
  }

  getRoleLabel(role: UserRole): string {
    return this.usersService.getRoleLabel(role);
  }
}
