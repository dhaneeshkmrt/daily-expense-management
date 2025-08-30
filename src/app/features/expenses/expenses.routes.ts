import { Routes } from '@angular/router';
import { ExpenseContainerComponent } from './components/expense-container/expense-container.component';

export const expensesRoutes: Routes = [
  {
    path: '',
    component: ExpenseContainerComponent,
    title: 'Expenses - Daily Expenses'
  }
];