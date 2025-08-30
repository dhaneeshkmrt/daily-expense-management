import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService, LoginCredentials } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">💰</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p class="text-gray-600">Sign in to your expense tracker</p>
        </div>

        <!-- Error Message -->
        @if (authService.error()) {
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {{ authService.error() }}
          </div>
        }

        <!-- Google Sign In -->
        <button
          type="button"
          (click)="onGoogleSignIn()"
          [disabled]="authService.loading()"
          class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          @if (authService.loading()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          }
          Continue with Google
        </button>

        <div class="relative mb-6">
          <mat-divider></mat-divider>
          <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-gray-500">
            or
          </span>
        </div>

        <!-- Email/Password Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onEmailSignIn()" class="space-y-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Email</mat-label>
            <input
              matInput
              type="email"
              formControlName="email"
              placeholder="Enter your email"
              [class.mat-form-field-invalid]="emailControl.invalid && emailControl.touched"
            >
            <mat-error *ngIf="emailControl.hasError('required')">
              Email is required
            </mat-error>
            <mat-error *ngIf="emailControl.hasError('email')">
              Please enter a valid email
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Password</mat-label>
            <input
              matInput
              [type]="hidePassword() ? 'password' : 'text'"
              formControlName="password"
              placeholder="Enter your password"
              [class.mat-form-field-invalid]="passwordControl.invalid && passwordControl.touched"
            >
            <button
              type="button"
              matSuffix
              mat-icon-button
              (click)="hidePassword.set(!hidePassword())"
              [attr.aria-label]="'Hide password'"
              [attr.aria-pressed]="hidePassword()"
            >
              <mat-icon>{{hidePassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="passwordControl.hasError('required')">
              Password is required
            </mat-error>
            <mat-error *ngIf="passwordControl.hasError('minlength')">
              Password must be at least 6 characters
            </mat-error>
          </mat-form-field>

          <button
            type="submit"
            [disabled]="loginForm.invalid || authService.loading()"
            class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            @if (authService.loading()) {
              <mat-spinner diameter="20" color="accent"></mat-spinner>
            }
            Sign In
          </button>
        </form>

        <!-- Sign Up Link -->
        <div class="text-center mt-6">
          <p class="text-gray-600">
            Don't have an account?
            <a routerLink="/auth/register" class="text-blue-600 hover:text-blue-700 font-medium ml-1">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);

  readonly hidePassword = signal(true);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected get emailControl() {
    return this.loginForm.controls.email;
  }

  protected get passwordControl() {
    return this.loginForm.controls.password;
  }

  protected onGoogleSignIn(): void {
    this.authService.clearError();
    this.authService.signInWithGoogle().subscribe({
      error: (error) => console.error('Google sign-in failed:', error)
    });
  }

  protected onEmailSignIn(): void {
    if (this.loginForm.valid) {
      this.authService.clearError();
      const credentials: LoginCredentials = {
        email: this.emailControl.value,
        password: this.passwordControl.value
      };
      
      this.authService.signInWithEmail(credentials).subscribe({
        error: (error) => console.error('Email sign-in failed:', error)
      });
    }
  }
}