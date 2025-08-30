import { Routes } from '@angular/router';
import { CategoryContainerComponent } from './components/category-container/category-container.component';

export const categoriesRoutes: Routes = [
  {
    path: '',
    component: CategoryContainerComponent,
    title: 'Categories - Daily Expenses'
  }
];