import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface NavigationItem {
  path: string;
  label: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-mobile-nav',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <!-- Overlay -->
    @if (isOpen()) {
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300"
        (click)="onCloseNav()">
      </div>
    }
    
    <!-- Mobile Navigation Panel -->
    <div [class]="'fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 md:hidden ' +
      (isOpen() ? 'translate-x-0' : '-translate-x-full')">
      
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-100">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <mat-icon class="text-white text-xl">account_balance_wallet</mat-icon>
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900">Daily Expenses</h2>
            <p class="text-sm text-gray-500">Dhaneesh Kumar</p>
          </div>
        </div>
        <button mat-icon-button (click)="onCloseNav()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <!-- Navigation Menu -->
      <nav class="py-6">
        <ul class="space-y-1 px-4">
          @for (item of navigationItems; track item.path) {
            <li>
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                (click)="onCloseNav()"
                class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors duration-200 text-gray-700 hover:bg-gray-100">
                
                <mat-icon class="mr-3 text-lg text-gray-400">{{ item.icon }}</mat-icon>
                <span class="flex-1">{{ item.label }}</span>
                
                @if (item.badge) {
                  <span class="ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {{ item.badge }}
                  </span>
                }
              </a>
            </li>
          }
        </ul>
      </nav>
      
      <!-- User Section -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            DK
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Dhaneesh Kumar</p>
            <p class="text-xs text-gray-500">Primary User</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './mobile-nav.component.scss'
})
export class MobileNavComponent {
  // Angular-specific properties (inputs, outputs) grouped first
  readonly isOpen = input(false);
  readonly toggleNav = output<void>();
  readonly closeNav = output<void>();
  
  // Component properties
  protected readonly navigationItems: NavigationItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/expenses', label: 'Expenses', icon: 'receipt_long', badge: 2 },
    { path: '/categories', label: 'Categories', icon: 'category' },
    { path: '/budgets', label: 'Budgets', icon: 'account_balance_wallet' },
    { path: '/reports', label: 'Reports', icon: 'assessment' },
    { path: '/reconciliation', label: 'Balance Sheet', icon: 'balance' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
  ];
  
  // Methods
  protected onCloseNav(): void {
    this.closeNav.emit();
  }
}