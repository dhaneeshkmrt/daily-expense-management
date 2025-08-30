import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { ExpenseListComponent } from '../expense-list/expense-list.component';

@Component({
  selector: 'app-expenses-container',
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    ExpenseFormComponent,
    ExpenseListComponent
  ],
  template: `
    <div class="expenses-container">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-gray-100 px-6 py-4 mb-6">
        <div class="max-w-7xl mx-auto">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Expenses</h1>
              <p class="text-gray-600 mt-1">Track and manage your daily expenses</p>
            </div>
            
            <!-- Quick Actions -->
            <div class="flex gap-3">
              <button 
                mat-stroked-button 
                (click)="selectedTab.set(0)"
                class="flex items-center gap-2">
                <mat-icon>add</mat-icon>
                Quick Add
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-6">
        <mat-tab-group 
          [selectedIndex]="selectedTab()" 
          (selectedIndexChange)="selectedTab.set($event)"
          class="expense-tabs">
          
          <!-- Add Expense Tab -->
          <mat-tab label="Add Expense">
            <ng-template matTabContent>
              <div class="py-6">
                <app-expense-form
                  (expenseAdded)="onExpenseAdded($event)"
                  (cancelled)="selectedTab.set(1)">
                </app-expense-form>
              </div>
            </ng-template>
          </mat-tab>

          <!-- View Expenses Tab -->
          <mat-tab label="View Expenses">
            <ng-template matTabContent>
              <div class="py-6">
                <app-expense-list
                  (addExpenseRequested)="onAddExpenseRequested()"
                  (editExpenseRequested)="onEditExpenseRequested($event)">
                </app-expense-list>
              </div>
            </ng-template>
          </mat-tab>

          <!-- Analytics Tab -->
          <mat-tab label="Analytics">
            <ng-template matTabContent>
              <div class="py-6">
                <div class="text-center py-12 bg-gray-50 rounded-2xl">
                  <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <mat-icon class="text-blue-600 text-2xl">analytics</mat-icon>
                  </div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                  <p class="text-gray-600">Detailed expense analytics and insights will be available here.</p>
                </div>
              </div>
            </ng-template>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .expenses-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }

    .expense-tabs {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    ::ng-deep .mat-mdc-tab-group {
      .mat-mdc-tab-header {
        background-color: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }

      .mat-mdc-tab {
        min-width: 120px;
      }

      .mat-mdc-tab-body-wrapper {
        background-color: white;
      }
    }

    @media (max-width: 768px) {
      .expenses-container {
        .max-w-7xl {
          padding: 0 1rem;
        }
      }
    }
  `]
})
export class ExpensesContainerComponent {
  // Tab management
  readonly selectedTab = signal(1); // Default to "View Expenses" tab

  protected onExpenseAdded(expenseId: string): void {
    console.log('Expense added:', expenseId);
    // Switch to view expenses tab after adding
    this.selectedTab.set(1);
  }

  onAddExpenseRequested(): void {
    // Switch to add expense tab
    this.selectedTab.set(0);
  }

  onEditExpenseRequested(expenseId: string): void {
    // For now just log, could implement edit modal or navigate to edit form
    console.log('Edit expense requested:', expenseId);
    // TODO: Implement edit functionality
  }
}