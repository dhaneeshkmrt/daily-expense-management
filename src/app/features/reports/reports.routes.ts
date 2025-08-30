import { Routes } from '@angular/router';
import { ReportContainerComponent } from './components/report-container/report-container.component';

export const reportsRoutes: Routes = [
  {
    path: '',
    component: ReportContainerComponent,
    title: 'Reports - Daily Expenses'
  }
];