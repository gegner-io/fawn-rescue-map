import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
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
  isLoginRoute = false;

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.updateRouteState(this.router.url);
    this.authService.initializeSession();

    const userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.subscriptions.add(userSubscription);

    const routeSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateRouteState(event.urlAfterRedirects);
      });

    this.subscriptions.add(routeSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onLogout(): void {
    this.authService.logout();
  }

  private updateRouteState(url: string): void {
    this.isLoginRoute = url.startsWith('/login');
  }
}
