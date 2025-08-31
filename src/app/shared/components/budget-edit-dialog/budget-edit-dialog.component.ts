import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface BudgetEditDialogData {
  categoryName: string;
  currentBudget: number;
}

export interface BudgetEditResult {
  budget: number;
}

@Component({
  selector: 'app-budget-edit-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="budget-edit-dialog">
      <div class="dialog-header flex items-center gap-3 p-6 pb-4">
        <mat-icon class="text-blue-500">account_balance_wallet</mat-icon>
        <h2 mat-dialog-title class="text-xl font-semibold m-0">Edit Budget</h2>
      </div>

      <mat-dialog-content class="px-6 pb-4">
        <p class="text-gray-700 mb-4">
          Set monthly budget for <strong>{{ data.categoryName }}</strong>
        </p>

        <form [formGroup]="budgetForm" class="space-y-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Monthly Budget Amount</mat-label>
            <input matInput 
                   type="number" 
                   formControlName="budget"
                   min="0" 
                   step="100"
                   placeholder="Enter budget amount">
            <span matTextPrefix>₹&nbsp;</span>
            <mat-hint>Enter 0 to remove budget limit</mat-hint>
            <mat-error *ngIf="budgetForm.get('budget')?.hasError('required')">
              Budget amount is required
            </mat-error>
            <mat-error *ngIf="budgetForm.get('budget')?.hasError('min')">
              Budget amount cannot be negative
            </mat-error>
          </mat-form-field>

          @if (data.currentBudget > 0) {
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div class="flex items-center gap-2 text-blue-700">
                <mat-icon class="text-sm">info</mat-icon>
                <span class="text-sm">
                  Current budget: <strong>₹{{ data.currentBudget | number }}</strong>
                </span>
              </div>
            </div>
          }
        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="flex justify-end gap-3 p-6 pt-4 bg-gray-50">
        <button mat-stroked-button (click)="onCancel()" class="min-w-[80px]">
          Cancel
        </button>
        <button mat-flat-button 
                color="primary"
                (click)="onSave()" 
                [disabled]="budgetForm.invalid"
                class="min-w-[80px]">
          Update Budget
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .budget-edit-dialog {
      min-width: 400px;
      max-width: 500px;
    }
    
    .dialog-header {
      border-bottom: 1px solid #e5e7eb;
    }
    
    mat-dialog-actions {
      border-top: 1px solid #e5e7eb;
      margin: 0;
    }
  `]
})
export class BudgetEditDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<BudgetEditDialogComponent>);
  readonly data = inject<BudgetEditDialogData>(MAT_DIALOG_DATA);

  readonly budgetForm = this.fb.nonNullable.group({
    budget: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    // Set current budget value
    this.budgetForm.patchValue({
      budget: this.data.currentBudget
    });

    // Focus on the input field
    setTimeout(() => {
      const input = document.querySelector('input[formControlName="budget"]') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.budgetForm.valid) {
      const result: BudgetEditResult = {
        budget: this.budgetForm.value.budget!
      };
      this.dialogRef.close(result);
    }
  }
}