import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { RoleDashboardComponent } from './role-dashboard/role-dashboard';
import { SettingsComponent } from './settings/settings';
import { AdminComponent } from './admin/admin';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'roles', component: RoleDashboardComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'admin', component: AdminComponent }
];
