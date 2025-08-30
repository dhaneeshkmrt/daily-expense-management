import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { BudgetService } from '../../../../core/services/budget.service';
import { CategoryService } from '../../../../core/services/category.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Budget, MonthlyBudgetSummary, BudgetAlert } from '../../../../core/models/budget.model';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-budget-container',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div class="max-w-6xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Budget Management</h1>
          <p class="text-gray-600">Track and manage your monthly budgets</p>
        </div>

        <!-- Month Selector -->
        <mat-card class="p-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">Current Period</h2>
            <form [formGroup]="monthForm" class="flex items-center gap-4">
              <mat-form-field appearance="outline" class="min-w-[200px]">
                <mat-label>Month Period</mat-label>
                <mat-select formControlName="monthPeriod" (selectionChange)="onMonthChange($event.value)">
                  @for (month of availableMonths(); track month.value) {
                    <mat-option [value]="month.value">{{ month.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </form>
          </div>
        </mat-card>

        <!-- Budget Summary -->
        @if (budgetSummary()) {
          <mat-card class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div class="text-center">
                <h3 class="text-sm font-medium text-gray-500 mb-1">Total Budget</h3>
                <p class="text-2xl font-bold text-blue-600">₹{{ budgetSummary()!.totalBudget.toLocaleString() }}</p>
              </div>
              <div class="text-center">
                <h3 class="text-sm font-medium text-gray-500 mb-1">Total Spent</h3>
                <p class="text-2xl font-bold text-green-600">₹{{ budgetSummary()!.totalSpent.toLocaleString() }}</p>
              </div>
              <div class="text-center">
                <h3 class="text-sm font-medium text-gray-500 mb-1">Remaining</h3>
                <p class="text-2xl font-bold" [class]="budgetSummary()!.totalRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'">
                  ₹{{ budgetSummary()!.totalRemaining.toLocaleString() }}
                </p>
              </div>
              <div class="text-center">
                <h3 class="text-sm font-medium text-gray-500 mb-1">Utilization</h3>
                <p class="text-2xl font-bold text-purple-600">{{ budgetSummary()!.budgetUtilizationPercentage.toFixed(1) }}%</p>
                <mat-progress-bar 
                  [value]="budgetSummary()!.budgetUtilizationPercentage" 
                  [color]="budgetSummary()!.budgetUtilizationPercentage > 100 ? 'warn' : 'primary'"
                  class="mt-2">
                </mat-progress-bar>
              </div>
            </div>
          </mat-card>
        }

        <!-- Budget Alerts -->
        @if (budgetAlerts().length > 0) {
          <mat-card class="p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Budget Alerts</h2>
            <div class="space-y-3">
              @for (alert of budgetAlerts(); track alert.id) {
                <div class="flex items-center gap-3 p-3 rounded-lg" 
                     [class]="getAlertBgClass(alert.type)">
                  <mat-icon [color]="alert.type === 'danger' ? 'warn' : 'primary'">
                    {{ alert.type === 'danger' ? 'error' : 'warning' }}
                  </mat-icon>
                  <div class="flex-1">
                    <div class="font-medium">{{ alert.categoryName }}</div>
                    <div class="text-sm text-gray-600">{{ alert.message }}</div>
                  </div>
                  <div class="text-right text-sm">
                    <div>₹{{ alert.currentAmount.toLocaleString() }}</div>
                    <div class="text-gray-500">of ₹{{ alert.budgetAmount.toLocaleString() }}</div>
                  </div>
                </div>
              }
            </div>
          </mat-card>
        }

        <!-- Category Budgets -->
        <mat-card class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Category Budgets</h2>
            <button mat-raised-button color="primary" (click)="openBudgetDialog()" [disabled]="budgetService.loading()">
              <mat-icon>add</mat-icon>
              Set Budget
            </button>
          </div>

          @if (budgetService.loading()) {
            <div class="text-center py-8">
              <mat-spinner diameter="40"></mat-spinner>
              <p class="mt-4 text-gray-600">Loading budgets...</p>
            </div>
          } @else if (budgets().length === 0) {
            <div class="text-center py-8">
              <mat-icon class="text-6xl text-gray-300 mb-4">account_balance_wallet</mat-icon>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No budgets set</h3>
              <p class="text-gray-600 mb-4">Create your first budget to start tracking expenses</p>
              <button mat-raised-button color="primary" (click)="openBudgetDialog()">
                Set Your First Budget
              </button>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (budget of budgets(); track budget.id) {
                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span class="text-lg">{{ getCategoryIcon(budget.categoryId) }}</span>
                      <h3 class="font-medium">{{ getCategoryName(budget.categoryId) }}</h3>
                    </div>
                    <button mat-icon-button (click)="editBudget(budget)">
                      <mat-icon class="text-gray-400">edit</mat-icon>
                    </button>
                  </div>
                  
                  <div class="space-y-2 mb-3">
                    <div class="flex justify-between text-sm">
                      <span>Budget:</span>
                      <span class="font-medium">₹{{ budget.budgetAmount.toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span>Spent:</span>
                      <span class="font-medium">₹{{ budget.spentAmount.toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span>Remaining:</span>
                      <span class="font-medium" [class]="budget.remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'">
                        ₹{{ budget.remainingAmount.toLocaleString() }}
                      </span>
                    </div>
                  </div>
                  
                  <mat-progress-bar 
                    [value]="getBudgetUtilization(budget)" 
                    [color]="budget.isOverBudget ? 'warn' : 'primary'"
                    class="mb-2">
                  </mat-progress-bar>
                  
                  <div class="text-xs text-center">
                    {{ getBudgetUtilization(budget).toFixed(1) }}% utilized
                    @if (budget.isOverBudget) {
                      <mat-chip class="ml-2" color="warn">Over Budget</mat-chip>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </mat-card>

        <!-- Set Budget Form (Expanded) -->
        @if (showBudgetForm()) {
          <mat-card class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              {{ editingBudget() ? 'Edit Budget' : 'Set New Budget' }}
            </h3>
            
            <form [formGroup]="budgetForm" (ngSubmit)="saveBudget()" class="space-y-4 max-w-md">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Category</mat-label>
                <mat-select formControlName="categoryId" [disabled]="!!editingBudget()">
                  @for (category of availableCategories(); track category.id) {
                    <mat-option [value]="category.id">
                      <span class="flex items-center gap-2">
                        <span>{{ category.icon }}</span>
                        {{ category.name }}
                      </span>
                    </mat-option>
                  }
                </mat-select>
                <mat-error *ngIf="budgetForm.get('categoryId')?.hasError('required')">
                  Category is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Budget Amount</mat-label>
                <input matInput type="number" formControlName="amount" placeholder="0.00" min="0" step="100">
                <span matTextPrefix>₹&nbsp;</span>
                <mat-error *ngIf="budgetForm.get('amount')?.hasError('required')">
                  Amount is required
                </mat-error>
                <mat-error *ngIf="budgetForm.get('amount')?.hasError('min')">
                  Amount must be greater than 0
                </mat-error>
              </mat-form-field>

              <div class="flex gap-3">
                <button type="submit" mat-raised-button color="primary" [disabled]="budgetForm.invalid || budgetService.loading()">
                  @if (budgetService.loading()) {
                    <mat-spinner diameter="20" class="mr-2"></mat-spinner>
                  }
                  {{ editingBudget() ? 'Update Budget' : 'Set Budget' }}
                </button>
                <button type="button" mat-stroked-button (click)="cancelBudgetForm()">
                  Cancel
                </button>
              </div>
            </form>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .budget-card {
      transition: transform 0.2s ease-in-out;
    }
    
    .budget-card:hover {
      transform: translateY(-2px);
    }
  `]
})
export class BudgetContainerComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly budgetService = inject(BudgetService);
  private readonly categoryService = inject(CategoryService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  // Signals
  readonly budgets = signal<Budget[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly budgetSummary = signal<MonthlyBudgetSummary | null>(null);
  readonly budgetAlerts = signal<BudgetAlert[]>([]);
  readonly showBudgetForm = signal<boolean>(false);
  readonly editingBudget = signal<Budget | null>(null);

  // Forms
  readonly monthForm = this.fb.nonNullable.group({
    monthPeriod: [this.budgetService.getCurrentMonthPeriod()]
  });

  readonly budgetForm = this.fb.nonNullable.group({
    categoryId: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]]
  });

  // Computed values
  readonly availableMonths = computed(() => {
    const current = new Date();
    const months = [];
    for (let i = -3; i <= 6; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() + i, 1);
      const monthPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({ value: monthPeriod, label });
    }
    return months;
  });

  readonly availableCategories = computed(() => {
    const existingBudgets = this.budgets();
    return this.categories().filter(cat => 
      !existingBudgets.some(budget => budget.categoryId === cat.id) || this.editingBudget()?.categoryId === cat.id
    );
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadBudgets();
  }

  private loadCategories(): void {
    this.categoryService.getUserCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (error) => console.error('Failed to load categories:', error)
    });
  }

  private loadBudgets(): void {
    const monthPeriod = this.monthForm.get('monthPeriod')?.value || this.budgetService.getCurrentMonthPeriod();
    
    this.budgetService.getUserBudgets(monthPeriod).subscribe({
      next: (budgets) => {
        this.budgets.set(budgets);
        this.loadBudgetSummary(monthPeriod);
        this.generateAlerts(monthPeriod);
      },
      error: (error) => {
        console.error('Failed to load budgets:', error);
        this.snackBar.open('Failed to load budgets', 'Close', { duration: 3000 });
      }
    });
  }

  private loadBudgetSummary(monthPeriod: string): void {
    this.budgetService.getMonthlyBudgetSummary(monthPeriod).subscribe({
      next: (summary) => this.budgetSummary.set(summary),
      error: (error) => console.error('Failed to load budget summary:', error)
    });
  }

  private generateAlerts(monthPeriod: string): void {
    this.budgetService.generateBudgetAlerts(monthPeriod).subscribe({
      next: (alerts) => this.budgetAlerts.set(alerts),
      error: (error) => console.error('Failed to generate alerts:', error)
    });
  }

  protected onMonthChange(monthPeriod: string): void {
    this.loadBudgets();
  }

  protected openBudgetDialog(): void {
    this.showBudgetForm.set(true);
    this.editingBudget.set(null);
    this.budgetForm.reset({ categoryId: '', amount: 0 });
  }

  protected editBudget(budget: Budget): void {
    this.showBudgetForm.set(true);
    this.editingBudget.set(budget);
    this.budgetForm.patchValue({
      categoryId: budget.categoryId,
      amount: budget.budgetAmount
    });
  }

  protected saveBudget(): void {
    if (this.budgetForm.valid) {
      const formData = this.budgetForm.value;
      const monthPeriod = this.monthForm.get('monthPeriod')?.value || this.budgetService.getCurrentMonthPeriod();
      
      this.budgetService.setBudget(formData.categoryId!, formData.amount!, monthPeriod).subscribe({
        next: () => {
          this.snackBar.open('Budget saved successfully', 'Close', { duration: 3000 });
          this.cancelBudgetForm();
          this.loadBudgets();
        },
        error: (error) => {
          console.error('Failed to save budget:', error);
          this.snackBar.open('Failed to save budget', 'Close', { duration: 3000 });
        }
      });
    }
  }

  protected cancelBudgetForm(): void {
    this.showBudgetForm.set(false);
    this.editingBudget.set(null);
    this.budgetForm.reset();
  }

  protected getCategoryName(categoryId: string): string {
    const category = this.categories().find(cat => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  }

  protected getCategoryIcon(categoryId: string): string {
    const category = this.categories().find(cat => cat.id === categoryId);
    return category?.icon || '📂';
  }

  protected getBudgetUtilization(budget: Budget): number {
    return budget.budgetAmount > 0 ? (budget.spentAmount / budget.budgetAmount) * 100 : 0;
  }

  protected getAlertBgClass(type: string): string {
    switch (type) {
      case 'danger':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  }
}