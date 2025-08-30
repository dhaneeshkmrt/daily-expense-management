import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

interface NavigationItem {
  path: string;
  label: string;
  icon: string;
  badge?: number;
  children?: NavigationItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule
  ],
  template: `
    <aside class="h-full bg-white border-r border-gray-200 flex flex-col">
      <!-- Logo/Brand Section -->
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <mat-icon class="text-white text-xl">account_balance_wallet</mat-icon>
          </div>
          <div>
            <h1 class="text-lg font-bold text-gray-900">Daily Expenses</h1>
            <p class="text-sm text-gray-500">{{ currentUser().name }}</p>
          </div>
        </div>
      </div>
      
      <!-- Navigation Menu -->
      <nav class="flex-1 py-6 px-4 overflow-y-auto">
        <ul class="space-y-1">
          @for (item of navigationItems; track item.path) {
            <li>
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                #rla="routerLinkActive"
                [class]="'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group hover:bg-gray-50 ' + 
                  (rla.isActive ? '' : 'text-gray-700 hover:text-gray-900')">
                
                <mat-icon 
                  [class]="'mr-3 flex-shrink-0 text-lg ' + 
                    (rla.isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600')">
                  {{ item.icon }}
                </mat-icon>
                
                <span class="flex-1">{{ item.label }}</span>
                
                @if (item.badge) {
                  <span class="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {{ item.badge }}
                  </span>
                }
              </a>
            </li>
          }
        </ul>
      </nav>
      
      <!-- User Section -->
      <div class="p-4 border-t border-gray-100">
        <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
          <div class="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            {{ currentUser().initials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ currentUser().name }}</p>
            <p class="text-xs text-gray-500 truncate">{{ currentUser().role }}</p>
          </div>
        </div>
      </div>
    </aside>
  `,
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  protected readonly currentUser = signal({
    name: 'Dhaneesh Kumar',
    initials: 'DK',
    role: 'Primary User'
  });

  protected readonly navigationItems: NavigationItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/expenses', label: 'Expenses', icon: 'receipt_long', badge: 2 },
    { path: '/categories', label: 'Categories', icon: 'category' },
    { path: '/budgets', label: 'Budgets', icon: 'account_balance_wallet' },
    { path: '/reports', label: 'Reports', icon: 'assessment' },
    { path: '/reconciliation', label: 'Balance Sheet', icon: 'balance' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
  ];
}