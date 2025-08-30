import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule
  ],
  template: `
    <mat-toolbar class="bg-white shadow-sm border-b border-gray-100 h-16">
      <div class="w-full flex items-center justify-between px-4">
        <!-- Mobile Menu Button -->
        @if (showMenuButton()) {
          <button mat-icon-button (click)="onMenuClick()" class="md:hidden">
            <mat-icon>menu</mat-icon>
          </button>
        }
        
        <!-- Title/Breadcrumb -->
        <div class="flex-1 flex items-center">
          <h1 class="text-lg font-semibold text-gray-900 ml-4 md:ml-0">
            {{ title() }}
          </h1>
        </div>
        
        <!-- Quick Actions -->
        <div class="flex items-center space-x-2">
          <button 
            mat-icon-button 
            matTooltip="Quick Add Expense" 
            class="text-blue-600 hover:bg-blue-50">
            <mat-icon>add_circle</mat-icon>
          </button>
          
          <button 
            mat-icon-button 
            matTooltip="Notifications"
            [matBadge]="notificationCount()"
            matBadgeColor="warn"
            [matBadgeHidden]="notificationCount() === 0"
            class="text-gray-600 hover:bg-gray-50">
            <mat-icon>notifications</mat-icon>
          </button>
          
          <!-- User Menu -->
          <button 
            mat-icon-button 
            [matMenuTriggerFor]="userMenu"
            class="ml-2">
            <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
              {{ userInitials() }}
            </div>
          </button>
        </div>
      </div>
    </mat-toolbar>
    
    <!-- User Menu -->
    <mat-menu #userMenu="matMenu" class="mt-2">
      <div class="px-4 py-3 border-b border-gray-100">
        <p class="font-medium text-gray-900">{{ userName() }}</p>
        <p class="text-sm text-gray-500">{{ userEmail() }}</p>
      </div>
      <button mat-menu-item class="flex items-center space-x-3 py-3">
        <mat-icon class="text-gray-500">person</mat-icon>
        <span>Profile</span>
      </button>
      <button mat-menu-item class="flex items-center space-x-3 py-3">
        <mat-icon class="text-gray-500">settings</mat-icon>
        <span>Settings</span>
      </button>
      <button mat-menu-item class="flex items-center space-x-3 py-3">
        <mat-icon class="text-gray-500">help</mat-icon>
        <span>Help & Support</span>
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item class="flex items-center space-x-3 py-3 text-red-600">
        <mat-icon>logout</mat-icon>
        <span>Sign Out</span>
      </button>
    </mat-menu>
  `,
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  // Angular-specific properties (inputs, outputs) grouped first
  protected readonly showMenuButton = input(false);
  protected readonly title = input('Dashboard');
  protected readonly notificationCount = input(0);
  protected readonly userName = input('Dhaneesh Kumar');
  protected readonly userEmail = input('dhaneesh@example.com');
  protected readonly userInitials = input('DK');
  
  protected readonly menuClick = output<void>();
  
  // Methods after properties
  protected onMenuClick(): void {
    this.menuClick.emit();
  }
}