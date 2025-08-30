import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, authState, User as FirebaseUser, updateProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { from, Observable, of, defer } from 'rxjs';
import { map, catchError, tap, takeUntil } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from '../models/user.model';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'primary' | 'secondary';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly googleProvider = new GoogleAuthProvider();

  // Signals for reactive state
  readonly firebaseUser = signal<FirebaseUser | null>(null);
  readonly currentUser = signal<User | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Computed values
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly userDisplayName = computed(() => this.currentUser()?.name || 'User');
  readonly userInitials = computed(() => this.currentUser()?.initials || '?');

  constructor() {
    // Listen to Firebase auth state changes with proper cleanup
    authState(this.auth).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(firebaseUser => {
        console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
        this.firebaseUser.set(firebaseUser);
        if (firebaseUser) {
          this.mapFirebaseUserToAppUser(firebaseUser);
        } else {
          this.currentUser.set(null);
          // Only navigate to login if we're not already there
          if (this.router.url !== '/auth/login' && !this.router.url.startsWith('/auth/')) {
            this.router.navigate(['/auth/login']);
          }
        }
      })
    ).subscribe();
  }

  // Email/Password Sign In
  signInWithEmail(credentials: LoginCredentials): Observable<User> {
    this.loading.set(true);
    this.error.set(null);

    return defer(() => from(signInWithEmailAndPassword(this.auth, credentials.email, credentials.password))).pipe(
      map(result => this.mapFirebaseUserToAppUser(result.user)),
      tap(() => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      }),
      catchError(error => {
        this.loading.set(false);
        this.error.set(this.getErrorMessage(error));
        throw error;
      })
    );
  }

  // Email/Password Registration
  registerWithEmail(data: RegisterData): Observable<User> {
    this.loading.set(true);
    this.error.set(null);

    return defer(() => from(createUserWithEmailAndPassword(this.auth, data.email, data.password))).pipe(
      map(result => {
        // Update display name
        updateProfile(result.user, { displayName: data.name });
        return this.mapFirebaseUserToAppUser(result.user, data.role);
      }),
      tap(() => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      }),
      catchError(error => {
        this.loading.set(false);
        this.error.set(this.getErrorMessage(error));
        throw error;
      })
    );
  }

  // Google Sign In
  signInWithGoogle(): Observable<User> {
    this.loading.set(true);
    this.error.set(null);

    return defer(() => from(signInWithPopup(this.auth, this.googleProvider))).pipe(
      map(result => this.mapFirebaseUserToAppUser(result.user)),
      tap(() => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      }),
      catchError(error => {
        this.loading.set(false);
        this.error.set(this.getErrorMessage(error));
        throw error;
      })
    );
  }

  // Sign Out
  signOut(): Observable<void> {
    this.loading.set(true);
    
    return defer(() => from(signOut(this.auth))).pipe(
      tap(() => {
        console.log('Sign out successful');
        this.loading.set(false);
        // Clear signals immediately
        this.firebaseUser.set(null);
        this.currentUser.set(null);
        this.error.set(null);
        // Navigate to login - the authState listener will also handle this
        this.router.navigate(['/auth/login']);
      }),
      catchError(error => {
        console.error('Sign out error:', error);
        this.loading.set(false);
        this.error.set(this.getErrorMessage(error));
        throw error;
      })
    );
  }

  // Helper method to map Firebase user to app user
  private mapFirebaseUserToAppUser(firebaseUser: FirebaseUser, role: 'primary' | 'secondary' = 'primary'): User {
    const user: User = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      email: firebaseUser.email || '',
      role,
      initials: this.getInitials(firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'),
      paymentMethods: this.getDefaultPaymentMethods(role),
      createdAt: new Date(),
      updatedAt: new Date(),
      // Firebase properties
      firebaseUid: firebaseUser.uid,
      photoURL: firebaseUser.photoURL || undefined,
      emailVerified: firebaseUser.emailVerified,
      provider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google.com' : 'password'
    };

    this.currentUser.set(user);
    return user;
  }

  // Get initials from name
  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  // Get default payment methods based on user role
  private getDefaultPaymentMethods(role: 'primary' | 'secondary') {
    const isDhaneesh = role === 'primary';
    return [
      {
        code: isDhaneesh ? 'DC' as const : 'NC' as const,
        label: isDhaneesh ? 'Dhaneesh Cash' : 'Nisha Cash',
        balance: 0,
        type: 'cash' as const,
        userId: ''
      },
      {
        code: isDhaneesh ? 'DD' as const : 'ND' as const,
        label: isDhaneesh ? 'Dhaneesh Digital' : 'Nisha Digital', 
        balance: 0,
        type: 'digital' as const,
        userId: ''
      }
    ];
  }

  // Get user-friendly error messages
  private getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed. Please try again.';
      case 'auth/cancelled-popup-request':
        return 'Another sign-in popup is already open.';
      default:
        return error.message || 'An error occurred during authentication.';
    }
  }

  // Clear error
  clearError(): void {
    this.error.set(null);
  }
}