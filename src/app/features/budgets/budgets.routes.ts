import { Routes } from '@angular/router';
import { BudgetContainerComponent } from './components/budget-container/budget-container.component';

export const budgetsRoutes: Routes = [
  {
    path: '',
    component: BudgetContainerComponent,
    title: 'Budgets - Daily Expenses'
  }
];