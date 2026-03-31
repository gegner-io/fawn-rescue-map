import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { LoginPageComponent } from './auth/components/login-page/login-page.component';
import { ParcelsModule } from './parcels';
import { DashboardPageComponent } from './dashboard/components/dashboard-page/dashboard-page.component';
import { ApplicationsPageComponent } from './applications/components/applications-page/applications-page.component';
import { UsersPageComponent } from './users/components/users-page/users-page.component';

@NgModule({
  declarations: [
    App,
    LoginPageComponent,
    DashboardPageComponent,
    ApplicationsPageComponent,
    UsersPageComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    ParcelsModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners()
  ],
  bootstrap: [App]
})
export class AppModule { }
