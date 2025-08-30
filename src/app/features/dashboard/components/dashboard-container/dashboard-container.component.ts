import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { QuickStatsComponent } from '../quick-stats/quick-stats.component';
import { BudgetOverviewComponent } from '../budget-overview/budget-overview.component';
import { RecentExpensesComponent } from '../recent-expenses/recent-expenses.component';
import { PaymentMethodsComponent } from '../payment-methods/payment-methods.component';
import { QuickActionsComponent } from '../quick-actions/quick-actions.component';

@Component({
  selector: 'app-dashboard-container',
  imports: [
    CommonModule,
    QuickStatsComponent,
    BudgetOverviewComponent,
    RecentExpensesComponent,
    PaymentMethodsComponent,
    QuickActionsComponent
  ],
  template: `
    <div class="space-y-8">
      <!-- Welcome Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, Dhaneesh! 👋
          </h1>
          <p class="text-gray-600">
            Here's what's happening with your expenses this month.
          </p>
        </div>
        <div class="mt-4 md:mt-0">
          <button class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2">
            <span>📝</span>
            <span>Quick Add Expense</span>
          </button>
        </div>
      </div>

      <!-- Quick Stats -->
      <app-quick-stats></app-quick-stats>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Budget Overview -->
        <div class="lg:col-span-2">
          <app-budget-overview></app-budget-overview>
        </div>

        <!-- Right Sidebar -->
        <div class="space-y-6">
          <app-payment-methods></app-payment-methods>
          <app-recent-expenses></app-recent-expenses>
          <app-quick-actions (actionClicked)="handleQuickAction($event)"></app-quick-actions>
        </div>
      </div>
    </div>
  `
})
export class DashboardContainerComponent {
  private readonly router = inject(Router);

  protected handleQuickAction(action: string): void {
    switch (action) {
      case 'add-expense':
        this.router.navigate(['/expenses']);
        break;
      case 'balance-sheet':
        this.router.navigate(['/reconciliation']);
        break;
      case 'export-csv':
        this.router.navigate(['/reports']);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }
}