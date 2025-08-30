import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
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
    </div>
  `
})
export class RecentExpensesComponent {
  protected readonly recentExpenses = signal<RecentExpense[]>([
    {
      id: '1',
      description: 'Grocery Shopping',
      amount: 1200,
      category: 'Monthly',
      subcategory: 'Grocery',
      paidBy: 'DD',
      date: 'Nov 28',
      time: '2:30 PM'
    },
    {
      id: '2',
      description: 'Petrol Fill',
      amount: 800,
      category: 'Monthly',
      subcategory: 'Petrol',
      paidBy: 'DC',
      date: 'Nov 28',
      time: '10:15 AM'
    },
    {
      id: '3',
      description: 'Medicine',
      amount: 340,
      category: 'Medical',
      subcategory: 'Medical Bill',
      paidBy: 'ND',
      date: 'Nov 27',
      time: '6:45 PM'
    },
    {
      id: '4',
      description: 'Coffee & Snacks',
      amount: 180,
      category: 'Food & Snack',
      subcategory: 'Snacks',
      paidBy: 'NC',
      date: 'Nov 27',
      time: '4:20 PM'
    },
    {
      id: '5',
      description: 'Mangoes',
      amount: 250,
      category: 'Fruits',
      subcategory: 'Fruits',
      paidBy: 'DD',
      date: 'Nov 26',
      time: '7:30 PM'
    }
  ]);

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