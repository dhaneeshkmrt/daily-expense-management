import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface QuickAction {
  label: string;
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  action: string;
}

@Component({
  selector: 'app-quick-actions',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div class="space-y-3">
        @for (action of quickActions; track action.action) {
          <button 
            (click)="onActionClick(action.action)"
            [class]="'w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-md ' + action.gradientFrom + ' ' + action.gradientTo + ' ' + action.borderColor">
            <div class="flex items-center space-x-3">
              <div [class]="'w-8 h-8 rounded-full flex items-center justify-center ' + action.bgColor">
                <mat-icon [class]="'text-white text-sm'">{{ action.icon }}</mat-icon>
              </div>
              <span [class]="'font-medium ' + action.textColor">{{ action.label }}</span>
            </div>
            <mat-icon [class]="action.textColor">arrow_forward</mat-icon>
          </button>
        }
      </div>
    </div>
  `
})
export class QuickActionsComponent {
  // Outputs
  protected readonly actionClicked = output<string>();

  protected readonly quickActions: QuickAction[] = [
    {
      label: 'Add Expense',
      icon: 'add',
      gradientFrom: 'bg-gradient-to-r from-green-50 to-green-100',
      gradientTo: '',
      borderColor: 'border-green-200',
      bgColor: 'bg-green-600',
      textColor: 'text-green-800',
      action: 'add-expense'
    },
    {
      label: 'Balance Sheet',
      icon: 'account_balance',
      gradientFrom: 'bg-gradient-to-r from-blue-50 to-blue-100',
      gradientTo: '',
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-600',
      textColor: 'text-blue-800',
      action: 'balance-sheet'
    },
    {
      label: 'Export CSV',
      icon: 'file_download',
      gradientFrom: 'bg-gradient-to-r from-purple-50 to-purple-100',
      gradientTo: '',
      borderColor: 'border-purple-200',
      bgColor: 'bg-purple-600',
      textColor: 'text-purple-800',
      action: 'export-csv'
    }
  ];

  protected onActionClick(action: string): void {
    this.actionClicked.emit(action);
  }
}