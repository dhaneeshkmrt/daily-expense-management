import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { ReconciliationService, MonthlyReconciliation } from '../../../../core/services/reconciliation.service';
import { BudgetService } from '../../../../core/services/budget.service';

@Component({
  selector: 'app-reconciliation-container',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div class="max-w-7xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Monthly Balance Sheet & Reconciliation</h1>
          <p class="text-gray-600">Track spending, compare with budgets, and calculate settlements</p>
        </div>

        <!-- Month Selector -->
        <mat-card class="p-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">Select Period</h2>
            <form [formGroup]="monthForm" class="flex items-center gap-4">
              <mat-form-field appearance="outline" class="min-w-[200px]">
                <mat-label>Month Period</mat-label>
                <mat-select formControlName="monthPeriod" (selectionChange)="onMonthChange($event.value)">
                  @for (month of availableMonths(); track month.value) {
                    <mat-option [value]="month.value">{{ month.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="generateReport()" [disabled]="reconciliationService.loading()">
                @if (reconciliationService.loading()) {
                  <mat-spinner diameter="20" class="mr-2"></mat-spinner>
                } @else {
                  <mat-icon class="mr-2">analytics</mat-icon>
                }
                Generate Report
              </button>
            </form>
          </div>
        </mat-card>

        <!-- Loading State -->
        @if (reconciliationService.loading()) {
          <mat-card class="p-8 text-center">
            <mat-spinner diameter="40" class="mx-auto mb-4"></mat-spinner>
            <p class="text-gray-600">Generating reconciliation report...</p>
          </mat-card>
        }

        <!-- Reconciliation Report -->
        @if (reconciliation() && !reconciliationService.loading()) {
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <mat-card class="p-6 text-center">
              <h3 class="text-sm font-medium text-gray-500 mb-1">Total Expenses</h3>
              <p class="text-2xl font-bold text-blue-600">₹{{ reconciliation()!.totalExpenses.toLocaleString() }}</p>
            </mat-card>
            
            <mat-card class="p-6 text-center">
              <h3 class="text-sm font-medium text-gray-500 mb-1">Budget Variance</h3>
              <p class="text-2xl font-bold" [class]="reconciliation()!.budgetComparison.totalVariance >= 0 ? 'text-red-600' : 'text-green-600'">
                ₹{{ Math.abs(reconciliation()!.budgetComparison.totalVariance).toLocaleString() }}
                <span class="text-sm">{{ reconciliation()!.budgetComparison.totalVariance >= 0 ? 'Over' : 'Under' }}</span>
              </p>
            </mat-card>

            <mat-card class="p-6 text-center">
              <h3 class="text-sm font-medium text-gray-500 mb-1">Net Settlement</h3>
              <p class="text-2xl font-bold" [class]="reconciliation()!.settlementSummary.netSettlement >= 0 ? 'text-orange-600' : 'text-purple-600'">
                ₹{{ Math.abs(reconciliation()!.settlementSummary.netSettlement).toLocaleString() }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ reconciliation()!.settlementSummary.netSettlement >= 0 ? 'D owes N' : 'N owes D' }}
              </p>
            </mat-card>

            <mat-card class="p-6 text-center">
              <h3 class="text-sm font-medium text-gray-500 mb-1">Categories Over Budget</h3>
              <p class="text-2xl font-bold text-red-600">{{ reconciliation()!.budgetComparison.overBudgetCategories.length }}</p>
            </mat-card>
          </div>

          <!-- Settlement Summary -->
          <mat-card class="p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <mat-icon class="text-green-600">account_balance</mat-icon>
              Settlement Summary
            </h2>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p class="text-green-800 font-medium">{{ reconciliation()!.settlementSummary.settlementNote }}</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Dhaneesh Summary -->
              <div class="border border-gray-200 rounded-lg p-4">
                <h3 class="font-medium text-gray-900 mb-2">Dhaneesh's Spending</h3>
                @if (dhaneeshBreakdown()) {
                  <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                      <span>Total Spent:</span>
                      <span class="font-medium">₹{{ dhaneeshBreakdown()!.totalSpent.toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span>Cash:</span>
                      <span>₹{{ dhaneeshBreakdown()!.paymentMethods.cash.toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span>Digital:</span>
                      <span>₹{{ dhaneeshBreakdown()!.paymentMethods.digital.toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span>Expenses:</span>
                      <span>{{ dhaneeshBreakdown()!.expenseCount }} transactions</span>
                    </div>
                  </div>
                }
              </div>

              <!-- Nisha Summary -->
              <div class="border border-gray-200 rounded-lg p-4">
                <h3 class="font-medium text-gray-900 mb-2">Nisha's Spending</h3>
                @if (nishaBreakdown()) {
                  <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                      <span>Total Spent:</span>
                      <span class="font-medium">₹{{ nishaBreakdown()!.totalSpent.toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span>Cash:</span>
                      <span>₹{{ nishaBreakdown()!.paymentMethods.cash.toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span>Digital:</span>
                      <span>₹{{ nishaBreakdown()!.paymentMethods.digital.toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span>Expenses:</span>
                      <span>{{ nishaBreakdown()!.expenseCount }} transactions</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </mat-card>

          <!-- Detailed Tabs -->
          <mat-tab-group class="bg-white rounded-lg shadow-lg" animationDuration="200ms">
            <!-- Balance Sheet Tab -->
            <mat-tab label="Balance Sheet">
              <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Category Budget vs Actual</h3>
                <div class="overflow-x-auto">
                  <table mat-table [dataSource]="reconciliation()!.balanceSheet" class="w-full">
                    <ng-container matColumnDef="category">
                      <th mat-header-cell *matHeaderCellDef class="font-semibold">Category</th>
                      <td mat-cell *matCellDef="let element">{{ element.category }}</td>
                    </ng-container>

                    <ng-container matColumnDef="budgeted">
                      <th mat-header-cell *matHeaderCellDef class="font-semibold text-right">Budgeted</th>
                      <td mat-cell *matCellDef="let element" class="text-right">₹{{ element.budgeted.toLocaleString() }}</td>
                    </ng-container>

                    <ng-container matColumnDef="actual">
                      <th mat-header-cell *matHeaderCellDef class="font-semibold text-right">Actual</th>
                      <td mat-cell *matCellDef="let element" class="text-right">₹{{ element.actual.toLocaleString() }}</td>
                    </ng-container>

                    <ng-container matColumnDef="variance">
                      <th mat-header-cell *matHeaderCellDef class="font-semibold text-right">Variance</th>
                      <td mat-cell *matCellDef="let element" class="text-right" [class]="element.variance >= 0 ? 'text-red-600' : 'text-green-600'">
                        {{ element.variance >= 0 ? '+' : '' }}₹{{ element.variance.toLocaleString() }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef class="font-semibold">Status</th>
                      <td mat-cell *matCellDef="let element">
                        <mat-chip [color]="getStatusColor(element.status)" class="text-xs">
                          {{ getStatusLabel(element.status) }}
                        </mat-chip>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                  </table>
                </div>
              </div>
            </mat-tab>

            <!-- Payment Methods Tab -->
            <mat-tab label="Payment Methods">
              <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Payment Method Breakdown</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  @for (method of reconciliation()!.paymentMethodBreakdown; track method.code) {
                    <div class="border border-gray-200 rounded-lg p-4 text-center">
                      <h4 class="font-medium text-gray-900 mb-2">{{ method.label }}</h4>
                      <p class="text-2xl font-bold text-blue-600">₹{{ method.totalAmount.toLocaleString() }}</p>
                      <p class="text-sm text-gray-500">{{ method.expenseCount }} transactions</p>
                      <p class="text-sm text-gray-500">{{ method.percentage.toFixed(1) }}% of total</p>
                    </div>
                  }
                </div>
              </div>
            </mat-tab>

            <!-- Category Analysis Tab -->
            <mat-tab label="Category Analysis">
              <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
                <div class="space-y-4">
                  @for (category of reconciliation()!.categoryBreakdown; track category.categoryId) {
                    <div class="border border-gray-200 rounded-lg p-4">
                      <div class="flex items-center justify-between mb-2">
                        <h4 class="font-medium text-gray-900">{{ category.categoryName }}</h4>
                        <mat-chip [color]="category.variance > 0 ? 'warn' : 'primary'" class="text-xs">
                          {{ category.utilizationPercentage.toFixed(1) }}% utilized
                        </mat-chip>
                      </div>
                      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span class="text-gray-500">Budget:</span>
                          <p class="font-medium">₹{{ category.budgetAmount.toLocaleString() }}</p>
                        </div>
                        <div>
                          <span class="text-gray-500">Spent:</span>
                          <p class="font-medium">₹{{ category.totalAmount.toLocaleString() }}</p>
                        </div>
                        <div>
                          <span class="text-gray-500">Variance:</span>
                          <p class="font-medium" [class]="category.variance >= 0 ? 'text-red-600' : 'text-green-600'">
                            {{ category.variance >= 0 ? '+' : '' }}₹{{ category.variance.toLocaleString() }}
                          </p>
                        </div>
                        <div>
                          <span class="text-gray-500">Transactions:</span>
                          <p class="font-medium">{{ category.expenseCount }}</p>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>

          <!-- Export Actions -->
          <mat-card class="p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Export Report</h2>
            <div class="flex gap-3">
              <button mat-raised-button color="primary" (click)="downloadReport()" [disabled]="reconciliationService.loading()">
                <mat-icon class="mr-2">file_download</mat-icon>
                Download CSV Report
              </button>
            </div>
          </mat-card>
        }

        <!-- No Data State -->
        @if (!reconciliation() && !reconciliationService.loading()) {
          <mat-card class="p-8 text-center">
            <mat-icon class="text-6xl text-gray-300 mb-4">balance</mat-icon>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Reconciliation Report</h3>
            <p class="text-gray-600 mb-4">Select a month period and generate a report to view reconciliation details</p>
            <button mat-raised-button color="primary" (click)="generateReport()">
              Generate Report
            </button>
          </mat-card>
        }
      </div>
    </div>
  `
})
export class ReconciliationContainerComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly reconciliationService = inject(ReconciliationService);
  private readonly budgetService = inject(BudgetService);
  private readonly snackBar = inject(MatSnackBar);

  // Table columns
  readonly displayedColumns = ['category', 'budgeted', 'actual', 'variance', 'status'];

  // Signals
  readonly reconciliation = computed(() => this.reconciliationService.monthlyReconciliation());

  // Computed values for user breakdowns
  readonly dhaneeshBreakdown = computed(() => {
    const reconciliation = this.reconciliation();
    return reconciliation?.userBreakdown.find(user => user.userName === 'Dhaneesh') || null;
  });

  readonly nishaBreakdown = computed(() => {
    const reconciliation = this.reconciliation();
    return reconciliation?.userBreakdown.find(user => user.userName === 'Nisha') || null;
  });

  // Form
  readonly monthForm = this.fb.nonNullable.group({
    monthPeriod: [this.reconciliationService.getCurrentMonthPeriod()]
  });

  // Available months
  readonly availableMonths = computed(() => {
    const current = new Date();
    const months = [];
    for (let i = -6; i <= 3; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() + i, 1);
      const monthPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({ value: monthPeriod, label });
    }
    return months;
  });

  // Math reference for template
  protected readonly Math = Math;

  ngOnInit(): void {
    // Auto-generate report for current month
    this.generateReport();
  }

  protected onMonthChange(monthPeriod: string): void {
    // Auto-generate when month changes
    this.generateReport();
  }

  protected generateReport(): void {
    const monthPeriod = this.monthForm.get('monthPeriod')?.value || this.reconciliationService.getCurrentMonthPeriod();
    
    this.reconciliationService.generateMonthlyReconciliation(monthPeriod).subscribe({
      next: (reconciliation) => {
        console.log('Reconciliation report generated:', reconciliation);
        this.snackBar.open('Reconciliation report generated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Failed to generate reconciliation report:', error);
        this.snackBar.open('Failed to generate reconciliation report', 'Close', { duration: 5000 });
      }
    });
  }

  protected downloadReport(): void {
    const monthPeriod = this.monthForm.get('monthPeriod')?.value || this.reconciliationService.getCurrentMonthPeriod();
    
    this.reconciliationService.downloadReconciliationReport(monthPeriod).subscribe({
      next: () => {
        this.snackBar.open('Report downloaded successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Failed to download report:', error);
        this.snackBar.open('Failed to download report', 'Close', { duration: 5000 });
      }
    });
  }

  protected getStatusColor(status: string): string {
    switch (status) {
      case 'over':
        return 'warn';
      case 'under':
        return 'accent';
      default:
        return 'primary';
    }
  }

  protected getStatusLabel(status: string): string {
    switch (status) {
      case 'over':
        return 'Over Budget';
      case 'under':
        return 'Under Budget';
      default:
        return 'On Track';
    }
  }
}