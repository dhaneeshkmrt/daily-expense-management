import { Component, signal, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ExpenseService } from '../../../../core/services/expense.service';
import { Expense } from '../../../../core/models/expense.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface RecentExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  subcategory: string;
  paidBy: string;
  date: string;
  time: string;
}

@Component({
  selector: 'app-recent-expenses',
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Recent Expenses</h3>
          <button class="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors">
            View All
          </button>
        </div>
      </div>
      
      @if (loading()) {
        <div class="flex justify-center items-center py-8">
          <mat-spinner diameter="30"></mat-spinner>
        </div>
      } @else if (recentExpenses().length === 0) {
        <div class="text-center py-8 text-gray-500">
          <p>No recent expenses found</p>
        </div>
      } @else {
        <div class="divide-y divide-gray-100">
          @for (expense of recentExpenses(); track expense.id) {
            <div class="p-4 hover:bg-gray-50 transition-colors duration-150">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <h4 class="font-medium text-gray-900 text-sm">{{ expense.description }}</h4>
                    <span class="text-sm font-semibold text-gray-900">₹{{ expense.amount | number:'1.0-0' }}</span>
                  </div>
                  <div class="flex items-center justify-between text-xs text-gray-600">
                    <span>{{ expense.category }} • {{ expense.subcategory }}</span>
                    <div class="flex items-center space-x-2">
                      <span [class]="getPaymentMethodClass(expense.paidBy)">{{ expense.paidBy }}</span>
                      <span>{{ expense.time }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class RecentExpensesComponent implements OnInit {
  private readonly expenseService = inject(ExpenseService);
  private readonly destroyRef = inject(DestroyRef);

  // Component state
  readonly loading = signal(true);
  readonly recentExpenses = signal<RecentExpense[]>([]);

  ngOnInit(): void {
    this.loadRecentExpenses();
  }

  private loadRecentExpenses(): void {
    this.expenseService.getRecentExpenses(5).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (expenses) => {
        const recentExpenses = expenses.map(expense => this.mapExpenseToRecentExpense(expense));
        this.recentExpenses.set(recentExpenses);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load recent expenses:', error);
        this.loading.set(false);
      }
    });
  }

  private mapExpenseToRecentExpense(expense: Expense): RecentExpense {
    const date = expense.date instanceof Date 
      ? expense.date 
      : expense.date?.toDate?.() 
      ? expense.date.toDate() 
      : new Date();
    
    return {
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      category: this.getCategoryName(expense.categoryId),
      subcategory: this.getSubcategoryName(expense.subcategoryId),
      paidBy: expense.paidBy,
      date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
  }

  private getCategoryName(categoryId: string): string {
    const categoryNames: Record<string, string> = {
      'food': 'Food & Dining',
      'transport': 'Transportation',
      'shopping': 'Shopping',
      'entertainment': 'Entertainment',
      'bills': 'Bills & Utilities',
      'health': 'Healthcare',
      'education': 'Education',
      'other': 'Other'
    };
    return categoryNames[categoryId] || 'Unknown';
  }

  private getSubcategoryName(subcategoryId: string): string {
    const subcategoryNames: Record<string, string> = {
      'restaurant': 'Restaurant',
      'groceries': 'Groceries',
      'fuel': 'Fuel',
      'public-transport': 'Public Transport',
      'clothing': 'Clothing',
      'electronics': 'Electronics',
      'movies': 'Movies',
      'electricity': 'Electricity'
    };
    return subcategoryNames[subcategoryId] || 'Unknown';
  }

  protected getPaymentMethodClass(paidBy: string): string {
    const classes = {
      'DC': 'px-2 py-1 bg-green-100 text-green-800 rounded font-medium',
      'DD': 'px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium',
      'NC': 'px-2 py-1 bg-pink-100 text-pink-800 rounded font-medium',
      'ND': 'px-2 py-1 bg-purple-100 text-purple-800 rounded font-medium'
    };
    return classes[paidBy as keyof typeof classes] || 'px-2 py-1 bg-gray-100 text-gray-800 rounded font-medium';
  }
}