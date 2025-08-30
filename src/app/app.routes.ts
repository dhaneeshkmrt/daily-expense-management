import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './shared/components/layout/main-layout/main-layout.component';

export const routes: Routes = [
  { 
    path: 'auth', 
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.authRoutes)
  },
  {
    path: '',
    component: MainLayoutComponent,
    children:[
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(r => r.dashboardRoutes),
        canActivate: [authGuard]
      },
      {
        path: 'expenses',
        loadChildren: () => import('./features/expenses/expenses.routes').then(r => r.expensesRoutes),
        canActivate: [authGuard]
      },
      {
        path: 'categories',
        loadChildren: () => import('./features/categories/categories.routes').then(r => r.categoriesRoutes),
        canActivate: [authGuard]
      },
      {
        path: 'budgets',
        loadChildren: () => import('./features/budgets/budgets.routes').then(r => r.budgetsRoutes),
        canActivate: [authGuard]
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.routes').then(r => r.reportsRoutes),
        canActivate: [authGuard]
      },
      {
        path: 'reconciliation',
        loadChildren: () => import('./features/reconciliation/reconciliation.routes').then(r => r.reconciliationRoutes),
        canActivate: [authGuard]
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes').then(r => r.settingsRoutes),
        canActivate: [authGuard]
      }
    ]
  },
  { path: '**', redirectTo: '/auth/login' }
];
