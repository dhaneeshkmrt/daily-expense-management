import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { RecurringExpensesComponent } from '../recurring-expenses/recurring-expenses.component';
import { MonthlyPeriodSettingsComponent } from '../monthly-period-settings/monthly-period-settings.component';

@Component({
  selector: 'app-settings-container',
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    RecurringExpensesComponent,
    MonthlyPeriodSettingsComponent
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p class="text-gray-600">Configure your expense tracking preferences</p>
        </div>

        <!-- Settings Tabs -->
        <mat-tab-group class="bg-white rounded-lg shadow-lg" animationDuration="200ms">
          <mat-tab label="Recurring Expenses">
            <div class="p-6">
              <app-recurring-expenses></app-recurring-expenses>
            </div>
          </mat-tab>
          
          <mat-tab label="Monthly Periods">
            <div class="p-6">
              <app-monthly-period-settings></app-monthly-period-settings>
            </div>
          </mat-tab>
          
          <mat-tab label="Budget Settings" [disabled]="true">
            <div class="p-8 text-center text-gray-500">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-2xl">💰</span>
              </div>
              <h3 class="text-lg font-medium mb-2">Budget Preferences</h3>
              <p class="mb-4">Alert thresholds, auto-transfers, etc.</p>
              <p class="text-sm">Coming in the next phase</p>
            </div>
          </mat-tab>
          
          <mat-tab label="User Preferences" [disabled]="true">
            <div class="p-8 text-center text-gray-500">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-2xl">👤</span>
              </div>
              <h3 class="text-lg font-medium mb-2">User Settings</h3>
              <p class="mb-4">Profile, notifications, app preferences</p>
              <p class="text-sm">Coming in the next phase</p>
            </div>
          </mat-tab>
          
          <mat-tab label="Data & Privacy" [disabled]="true">
            <div class="p-8 text-center text-gray-500">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-2xl">🔒</span>
              </div>
              <h3 class="text-lg font-medium mb-2">Data Management</h3>
              <p class="mb-4">Backup, restore, privacy settings</p>
              <p class="text-sm">Coming in the next phase</p>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `
})
export class SettingsContainerComponent {}