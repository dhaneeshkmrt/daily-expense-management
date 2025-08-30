import { Routes } from '@angular/router';
import { ReconciliationContainerComponent } from './components/reconciliation-container/reconciliation-container.component';

export const reconciliationRoutes: Routes = [
  {
    path: '',
    component: ReconciliationContainerComponent,
    title: 'Balance Sheet - Daily Expenses'
  }
];