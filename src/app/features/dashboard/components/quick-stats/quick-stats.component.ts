import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface QuickStat {
  label: string;
  value: string;
  change: string;
  icon: string;
  trend: 'up' | 'down';
  color: string;
}

@Component({
  selector: 'app-quick-stats',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      @for (stat of quickStats(); track stat.label) {
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <div [class]="'w-12 h-12 rounded-full flex items-center justify-center ' + stat.color">
              <mat-icon class="text-white text-xl">{{ stat.icon }}</mat-icon>
            </div>
            <div [class]="'flex items-center text-sm font-medium ' + (stat.trend === 'up' ? 'text-green-600' : 'text-red-600')">
              <mat-icon class="text-sm mr-1">{{ stat.trend === 'up' ? 'trending_up' : 'trending_down' }}</mat-icon>
              {{ stat.change }}
            </div>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-900 mb-1">{{ stat.value }}</h3>
            <p class="text-gray-600 text-sm">{{ stat.label }}</p>
          </div>
        </div>
      }
    </div>
  `
})
export class QuickStatsComponent {
  protected readonly quickStats = signal<QuickStat[]>([
    {
      label: 'Total Spent This Month',
      value: '₹18,540',
      change: '+12%',
      icon: 'payments',
      trend: 'up',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      label: 'Budget Remaining',
      value: '₹6,460',
      change: '-8%',
      icon: 'account_balance_wallet',
      trend: 'down',
      color: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      label: 'Categories Over Budget',
      value: '2',
      change: '+1',
      icon: 'warning',
      trend: 'up',
      color: 'bg-gradient-to-r from-orange-500 to-orange-600'
    },
    {
      label: 'Days Until Settlement',
      value: '6',
      change: '-1',
      icon: 'calendar_today',
      trend: 'down',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600'
    }
  ]);
}