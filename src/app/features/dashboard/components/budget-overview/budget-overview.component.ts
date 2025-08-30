import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

interface CategoryBudget {
  name: string;
  spent: number;
  budget: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-budget-overview',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule
  ],
  template: `
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div class="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <h2 class="text-xl font-semibold mb-2">Budget Overview - November 2024</h2>
        <p class="opacity-90">Track your spending across categories</p>
      </div>
      
      <div class="p-6">
        <div class="space-y-6">
          @for (category of categoryBudgets(); track category.name) {
            <div class="group">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                  <div [class]="'w-10 h-10 rounded-full flex items-center justify-center ' + category.color">
                    <mat-icon class="text-white text-lg">{{ category.icon }}</mat-icon>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900">{{ category.name }}</h3>
                    <p class="text-sm text-gray-600">
                      ₹{{ category.spent | number:'1.0-0' }} of ₹{{ category.budget | number:'1.0-0' }}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <div [class]="'text-sm font-medium ' + (getPercentage(category.spent, category.budget) > 90 ? 'text-red-600' : getPercentage(category.spent, category.budget) > 70 ? 'text-yellow-600' : 'text-green-600')">
                    {{ getPercentage(category.spent, category.budget) }}% used
                  </div>
                  <div class="text-xs text-gray-500">
                    ₹{{ category.budget - category.spent | number:'1.0-0' }} remaining
                  </div>
                </div>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  [class]="'h-2 rounded-full transition-all duration-500 ' + (getPercentage(category.spent, category.budget) > 90 ? 'bg-red-500' : getPercentage(category.spent, category.budget) > 70 ? 'bg-yellow-500' : 'bg-green-500')"
                  [style.width.%]="getPercentage(category.spent, category.budget)">
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class BudgetOverviewComponent {
  protected readonly categoryBudgets = signal<CategoryBudget[]>([
    { name: 'Monthly', spent: 8500, budget: 10000, icon: 'shopping_cart', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { name: 'Food & Snack', spent: 3200, budget: 3000, icon: 'restaurant', color: 'bg-gradient-to-r from-orange-500 to-orange-600' },
    { name: 'Medical', spent: 1200, budget: 2500, icon: 'local_hospital', color: 'bg-gradient-to-r from-red-500 to-red-600' },
    { name: 'Tour', spent: 4500, budget: 5000, icon: 'flight', color: 'bg-gradient-to-r from-green-500 to-green-600' },
    { name: 'Fruits', spent: 800, budget: 1500, icon: 'eco', color: 'bg-gradient-to-r from-lime-500 to-lime-600' },
    { name: 'Gift', spent: 340, budget: 2000, icon: 'card_giftcard', color: 'bg-gradient-to-r from-pink-500 to-pink-600' }
  ]);

  protected getPercentage(spent: number, budget: number): number {
    return Math.min(Math.round((spent / budget) * 100), 100);
  }
}