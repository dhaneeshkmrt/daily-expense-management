import { Routes } from '@angular/router';
import { ExpensesContainerComponent } from './components/expenses-container/expenses-container.component';

export const expensesRoutes: Routes = [
  {
    path: '',
    component: ExpensesContainerComponent,
    title: 'Expenses - Daily Expenses'
  }
];