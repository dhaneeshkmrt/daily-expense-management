import { Component, computed, signal, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ExpenseService } from '../../../../core/services/expense.service';
import { AuthService } from '../../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    @if (loading()) {
      <div class="flex justify-center items-center py-12">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    } @else {
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
    }
  `
})
export class QuickStatsComponent implements OnInit {
  private readonly expenseService = inject(ExpenseService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  // Component state
  readonly loading = signal(true);
  readonly monthlyStats = signal({
    total: 0,
    count: 0,
    average: 0
  });

  // Computed stats
  protected readonly quickStats = computed<QuickStat[]>(() => {
    const stats = this.monthlyStats();
    const currentDate = new Date();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - currentDate.getDate();

    return [
      {
        label: 'Total Spent This Month',
        value: `₹${stats.total.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        change: stats.count > 0 ? `${stats.count} transactions` : 'No data',
        icon: 'payments',
        trend: 'up',
        color: 'bg-gradient-to-r from-blue-500 to-blue-600'
      },
      {
        label: 'Average Per Transaction',
        value: stats.average > 0 ? `₹${stats.average.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '₹0',
        change: stats.count > 0 ? `from ${stats.count} expenses` : 'No expenses',
        icon: 'account_balance_wallet',
        trend: 'up',
        color: 'bg-gradient-to-r from-green-500 to-green-600'
      },
      {
        label: 'Daily Average',
        value: `₹${Math.round(stats.total / Math.max(currentDate.getDate(), 1)).toLocaleString('en-IN')}`,
        change: `${currentDate.getDate()} days`,
        icon: 'today',
        trend: 'up',
        color: 'bg-gradient-to-r from-orange-500 to-orange-600'
      },
      {
        label: 'Days Remaining',
        value: daysRemaining.toString(),
        change: `in ${currentDate.toLocaleDateString('en-IN', { month: 'short' })}`,
        icon: 'calendar_today',
        trend: 'down',
        color: 'bg-gradient-to-r from-purple-500 to-purple-600'
      }
    ];
  });

  ngOnInit(): void {
    this.loadMonthlyStats();
  }

  private loadMonthlyStats(): void {
    const currentMonth = this.getCurrentMonthPeriod();
    
    this.expenseService.getExpenseStats(currentMonth).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (stats) => {
        this.monthlyStats.set({
          total: stats.total,
          count: stats.count,
          average: stats.average
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load monthly stats:', error);
        this.loading.set(false);
      }
    });
  }

  private getCurrentMonthPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}