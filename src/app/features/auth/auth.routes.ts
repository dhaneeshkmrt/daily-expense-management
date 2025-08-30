import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { noAuthGuard } from '../../core/guards/auth.guard';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    // canActivate: [noAuthGuard],
    title: 'Login - Daily Expenses'
  },
  {
    path: 'register',
    component: RegisterComponent,
    // canActivate: [noAuthGuard],
    title: 'Register - Daily Expenses'
  }
];