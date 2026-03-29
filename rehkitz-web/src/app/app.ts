import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService, AuthUser } from './auth/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = 'Rehkitz Parcel Mission Planner';
  currentUser: AuthUser | null = null;

  private readonly subscriptions = new Subscription();

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.authService.initializeSession();

    const userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.subscriptions.add(userSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onLogout(): void {
    this.authService.logout();
  }
}
