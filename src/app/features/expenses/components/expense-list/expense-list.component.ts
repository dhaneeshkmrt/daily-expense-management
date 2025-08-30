import { Component, inject, signal, OnInit, output, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExpenseService } from '../../../../core/services/expense.service';
import { Expense } from '../../../../core/models/expense.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-expense-list',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <div class="expense-list-container">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Your Expenses</h2>
          <p class="text-gray-600 mt-1">
            @if (expenses().length > 0) {
              {{ expenses().length }} expenses • ₹{{ totalAmount() | number:'1.2-2' }} total
            } @else {
              No expenses found
            }
          </p>
        </div>
        
        <button 
          mat-raised-button 
          color="primary" 
          (click)="onAddExpense()"
          class="flex items-center gap-2">
          <mat-icon>add</mat-icon>
          Add Expense
        </button>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      }

      <!-- Error State -->
      @if (expenseService.error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-4">
          <div class="flex items-center gap-3">
            <mat-icon class="text-red-600">error</mat-icon>
            <div>
              <h3 class="font-medium">Error Loading Expenses</h3>
              <p class="text-sm mt-1">{{ expenseService.error() }}</p>
            </div>
          </div>
          <button 
            mat-stroked-button 
            color="primary" 
            (click)="retryLoad()" 
            class="mt-3">
            Try Again
          </button>
        </div>
      }

      <!-- Empty State -->
      @if (!isLoading() && expenses().length === 0 && !expenseService.error()) {
        <div class="text-center py-12 bg-gray-50 rounded-2xl">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <mat-icon class="text-gray-400 text-2xl">receipt_long</mat-icon>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
          <p class="text-gray-600 mb-6">Start tracking your expenses by adding your first transaction.</p>
          <button 
            mat-raised-button 
            color="primary" 
            (click)="onAddExpense()"
            class="flex items-center gap-2 mx-auto">
            <mat-icon>add</mat-icon>
            Add Your First Expense
          </button>
        </div>
      }

      <!-- Expense List -->
      @if (!isLoading() && expenses().length > 0) {
        <div class="space-y-3">
          @for (expense of expenses(); track expense.id) {
            <mat-card class="expense-card hover:shadow-lg transition-shadow duration-200">
              <mat-card-content class="p-4">
                <div class="flex items-center justify-between">
                  <!-- Main Content -->
                  <div class="flex-1">
                    <div class="flex items-center gap-3">
                      <!-- Category Icon -->
                      <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <mat-icon class="text-blue-600">{{ getCategoryIcon(expense.categoryId) }}</mat-icon>
                      </div>
                      
                      <!-- Details -->
                      <div class="flex-1">
                        <h3 class="font-medium text-gray-900">{{ expense.description }}</h3>
                        <div class="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span class="flex items-center gap-1">
                            <mat-icon class="text-xs">calendar_today</mat-icon>
                            {{ formatDate(expense.date) }}
                          </span>
                          <span class="flex items-center gap-1">
                            <mat-icon class="text-xs">category</mat-icon>
                            {{ getCategoryName(expense.categoryId) }}
                          </span>
                          <mat-chip class="payment-method-chip" [class]="getPaymentMethodClass(expense.paidBy)">
                            {{ getPaymentMethodLabel(expense.paidBy) }}
                          </mat-chip>
                        </div>
                        @if (expense.notes) {
                          <p class="text-sm text-gray-500 mt-2">{{ expense.notes }}</p>
                        }
                      </div>
                    </div>
                  </div>

                  <!-- Amount and Actions -->
                  <div class="flex items-center gap-3">
                    <div class="text-right">
                      <div class="text-lg font-semibold text-gray-900">
                        ₹{{ expense.amount | number:'1.2-2' }}
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ formatTime(expense.date) }}
                      </div>
                    </div>

                    <!-- Actions Menu -->
                    <button 
                      mat-icon-button 
                      [matMenuTriggerFor]="expenseMenu"
                      matTooltip="More actions">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    
                    <mat-menu #expenseMenu="matMenu">
                      <button mat-menu-item (click)="onEditExpense(expense)">
                        <mat-icon>edit</mat-icon>
                        <span>Edit</span>
                      </button>
                      <button mat-menu-item (click)="onDuplicateExpense(expense)">
                        <mat-icon>content_copy</mat-icon>
                        <span>Duplicate</span>
                      </button>
                      <button mat-menu-item (click)="onDeleteExpense(expense)" class="text-red-600">
                        <mat-icon>delete</mat-icon>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- Load More Button -->
        @if (hasMore()) {
          <div class="text-center mt-6">
            <button 
              mat-stroked-button 
              (click)="loadMore()"
              [disabled]="isLoading()"
              class="px-8">
              @if (isLoading()) {
                <mat-spinner diameter="20" class="mr-2"></mat-spinner>
              }
              Load More
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .expense-list-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }

    .expense-card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
    }

    .expense-card:hover {
      border-color: #3b82f6;
    }

    .payment-method-chip {
      font-size: 0.75rem;
      height: 24px;
    }

    .payment-method-chip.dc { background-color: #dbeafe; color: #1d4ed8; }
    .payment-method-chip.dd { background-color: #dcfce7; color: #15803d; }
    .payment-method-chip.nc { background-color: #fef3c7; color: #d97706; }
    .payment-method-chip.nd { background-color: #fce7f3; color: #be185d; }

    @media (max-width: 768px) {
      .expense-list-container {
        padding: 0.5rem;
      }
    }
  `]
})
export class ExpenseListComponent implements OnInit {
  protected readonly expenseService = inject(ExpenseService);
  private readonly destroyRef = inject(DestroyRef);

  // Output events
  readonly addExpenseRequested = output<void>();
  readonly editExpenseRequested = output<string>();

  // Component state
  readonly expenses = signal<Expense[]>([]);
  readonly isLoading = signal(false);
  readonly hasMore = signal(true);

  // Computed values
  readonly totalAmount = signal(0);

  ngOnInit(): void {
    this.loadExpenses();
  }

  private loadExpenses(): void {
    this.isLoading.set(true);
    
    this.expenseService.getUserExpenses().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (expenses) => {
        this.expenses.set(expenses);
        this.calculateTotalAmount();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load expenses:', error);
        this.isLoading.set(false);
      }
    });
  }

  private calculateTotalAmount(): void {
    const total = this.expenses().reduce((sum, expense) => sum + expense.amount, 0);
    this.totalAmount.set(total);
  }

  protected onAddExpense(): void {
    this.addExpenseRequested.emit();
  }

  protected onEditExpense(expense: Expense): void {
    this.editExpenseRequested.emit(expense.id);
  }

  protected onDuplicateExpense(expense: Expense): void {
    // Create a new expense with same data but new date
    const duplicateData = {
      date: new Date(),
      amount: expense.amount,
      description: `${expense.description} (Copy)`,
      notes: expense.notes,
      categoryId: expense.categoryId,
      subcategoryId: expense.subcategoryId,
      microCategoryId: expense.microCategoryId,
      paidBy: expense.paidBy
    };

    this.expenseService.addExpense(duplicateData).subscribe({
      next: (id) => {
        console.log('Expense duplicated successfully:', id);
      },
      error: (error) => {
        console.error('Failed to duplicate expense:', error);
      }
    });
  }

  protected onDeleteExpense(expense: Expense): void {
    if (confirm(`Are you sure you want to delete "${expense.description}"?`)) {
      this.expenseService.deleteExpense(expense.id).subscribe({
        next: () => {
          console.log('Expense deleted successfully');
        },
        error: (error) => {
          console.error('Failed to delete expense:', error);
        }
      });
    }
  }

  protected loadMore(): void {
    // Implement pagination logic
    console.log('Load more expenses');
  }

  protected retryLoad(): void {
    this.expenseService.clearError();
    this.loadExpenses();
  }

  // Helper methods for display
  protected formatDate(date: Date | any): string {
    const dateObj = date instanceof Date 
      ? date 
      : date?.toDate?.() 
      ? date.toDate() 
      : new Date();
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(dateObj);
  }

  protected formatTime(date: Date | any): string {
    const dateObj = date instanceof Date 
      ? date 
      : date?.toDate?.() 
      ? date.toDate() 
      : new Date();
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  }

  protected getCategoryIcon(categoryId: string): string {
    const icons: Record<string, string> = {
      'food': 'restaurant',
      'transport': 'directions_car',
      'shopping': 'shopping_cart',
      'entertainment': 'movie',
      'bills': 'receipt',
      'health': 'local_hospital',
      'education': 'school',
      'other': 'category'
    };
    return icons[categoryId] || 'category';
  }

  protected getCategoryName(categoryId: string): string {
    const names: Record<string, string> = {
      'food': 'Food & Dining',
      'transport': 'Transportation',
      'shopping': 'Shopping',
      'entertainment': 'Entertainment',
      'bills': 'Bills & Utilities',
      'health': 'Healthcare',
      'education': 'Education',
      'other': 'Other'
    };
    return names[categoryId] || 'Unknown';
  }

  protected getPaymentMethodLabel(paidBy: string): string {
    const labels: Record<string, string> = {
      'DC': 'Dhaneesh Cash',
      'DD': 'Dhaneesh Digital',
      'NC': 'Nisha Cash',
      'ND': 'Nisha Digital'
    };
    return labels[paidBy] || paidBy;
  }

  protected getPaymentMethodClass(paidBy: string): string {
    return paidBy.toLowerCase();
  }
}