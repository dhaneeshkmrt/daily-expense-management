import { Routes } from '@angular/router';
import { DashboardContainerComponent } from './components/dashboard-container/dashboard-container.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardContainerComponent,
    title: 'Dashboard - Daily Expenses'
  }
];