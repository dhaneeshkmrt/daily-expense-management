import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'dashboard', 
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(r => r.dashboardRoutes)
  },
  { 
    path: 'expenses', 
    loadChildren: () => import('./features/expenses/expenses.routes').then(r => r.expensesRoutes)
  },
  { 
    path: 'categories', 
    loadChildren: () => import('./features/categories/categories.routes').then(r => r.categoriesRoutes)
  },
  { 
    path: 'budgets', 
    loadChildren: () => import('./features/budgets/budgets.routes').then(r => r.budgetsRoutes)
  },
  { 
    path: 'reports', 
    loadChildren: () => import('./features/reports/reports.routes').then(r => r.reportsRoutes)
  },
  { 
    path: 'reconciliation', 
    loadChildren: () => import('./features/reconciliation/reconciliation.routes').then(r => r.reconciliationRoutes)
  },
  { 
    path: 'settings', 
    loadChildren: () => import('./features/settings/settings.routes').then(r => r.settingsRoutes)
  },
  { path: '**', redirectTo: '/dashboard' }
];
