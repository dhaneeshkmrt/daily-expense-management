import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { ExpenseService } from '../../../../core/services/expense.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ExpenseFormData, Expense } from '../../../../core/models/expense.model';
import { PaymentMethodCode, PAYMENT_METHODS } from '../../../../core/models/user.model';

@Component({
  selector: 'app-expense-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  template: `
    <mat-card class="expense-form-card">
      <mat-card-header>
        <mat-card-title class="flex items-center gap-2">
          <mat-icon class="text-blue-600">receipt_long</mat-icon>
          {{ editMode() ? 'Edit Expense' : 'Add New Expense' }}
        </mat-card-title>
      </mat-card-header>

      <mat-card-content class="mt-4">
        <!-- Error Message -->
        @if (expenseService.error()) {
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {{ expenseService.error() }}
          </div>
        }

        <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Date and Amount Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <mat-form-field appearance="fill" class="w-full">
              <mat-label>Date</mat-label>
              <input
                matInput
                [matDatepicker]="datePicker"
                formControlName="date"
                placeholder="Select date"
                [class.mat-form-field-invalid]="dateControl.invalid && dateControl.touched">
              <mat-datepicker-toggle matIconSuffix [for]="datePicker"></mat-datepicker-toggle>
              <mat-datepicker #datePicker></mat-datepicker>
              <mat-error *ngIf="dateControl.hasError('required')">
                Date is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="fill" class="w-full">
              <mat-label>Amount</mat-label>
              <input
                matInput
                type="number"
                step="0.01"
                min="0"
                formControlName="amount"
                placeholder="0.00"
                [class.mat-form-field-invalid]="amountControl.invalid && amountControl.touched">
              <span matTextPrefix>₹&nbsp;</span>
              <mat-error *ngIf="amountControl.hasError('required')">
                Amount is required
              </mat-error>
              <mat-error *ngIf="amountControl.hasError('min')">
                Amount must be greater than 0
              </mat-error>
            </mat-form-field>
          </div>

          <!-- Description -->
          <mat-form-field appearance="fill" class="w-full">
            <mat-label>Description</mat-label>
            <input
              matInput
              formControlName="description"
              placeholder="What did you buy?"
              [class.mat-form-field-invalid]="descriptionControl.invalid && descriptionControl.touched">
            <mat-error *ngIf="descriptionControl.hasError('required')">
              Description is required
            </mat-error>
          </mat-form-field>

          <!-- Category Selectors -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <mat-form-field appearance="fill" class="w-full">
              <mat-label>Category</mat-label>
              <mat-select formControlName="categoryId">
                @for (category of mockCategories; track category.id) {
                  <mat-option [value]="category.id">{{ category.name }}</mat-option>
                }
              </mat-select>
              <mat-error *ngIf="categoryIdControl.hasError('required')">
                Category is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="fill" class="w-full">
              <mat-label>Subcategory</mat-label>
              <mat-select formControlName="subcategoryId">
                @for (subcategory of mockSubcategories; track subcategory.id) {
                  <mat-option [value]="subcategory.id">{{ subcategory.name }}</mat-option>
                }
              </mat-select>
              <mat-error *ngIf="subcategoryIdControl.hasError('required')">
                Subcategory is required
              </mat-error>
            </mat-form-field>
          </div>

          <!-- Payment Method -->
          <mat-form-field appearance="fill" class="w-full">
            <mat-label>Payment Method</mat-label>
            <mat-select formControlName="paidBy">
              @for (method of availablePaymentMethods(); track method.code) {
                <mat-option [value]="method.code">
                  {{ method.label }}
                  <span class="text-sm text-gray-500 ml-2">({{ method.type === 'cash' ? 'Cash' : 'Digital' }})</span>
                </mat-option>
              }
            </mat-select>
            <mat-error *ngIf="paidByControl.hasError('required')">
              Payment method is required
            </mat-error>
          </mat-form-field>

          <!-- Notes (Optional) -->
          <mat-form-field appearance="fill" class="w-full">
            <mat-label>Notes (Optional)</mat-label>
            <textarea
              matInput
              rows="3"
              formControlName="notes"
              placeholder="Additional notes...">
            </textarea>
          </mat-form-field>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4">
            <button
              type="submit"
              mat-raised-button
              color="primary"
              [disabled]="expenseForm.invalid || expenseService.loading()"
              class="flex-1 md:flex-none md:min-w-[120px]">
              @if (expenseService.loading()) {
                <mat-spinner diameter="20" color="accent" class="mr-2"></mat-spinner>
              }
              {{ editMode() ? 'Update' : 'Add' }} Expense
            </button>

            <button
              type="button"
              mat-stroked-button
              (click)="onCancel()"
              [disabled]="expenseService.loading()"
              class="flex-1 md:flex-none md:min-w-[120px]">
              Cancel
            </button>

            @if (editMode()) {
              <button
                type="button"
                mat-stroked-button
                color="warn"
                (click)="onDelete()"
                [disabled]="expenseService.loading()"
                class="md:min-w-[120px]">
                Delete
              </button>
            }
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .expense-form-card {
      max-width: 600px;
      margin: 0 auto;
    }

    // Clean form field styling
    ::ng-deep .mat-mdc-form-field {
      width: 100%;
      margin-bottom: 1rem;
    }
  `]
})
export class ExpenseFormComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly expenseService = inject(ExpenseService);
  private readonly authService = inject(AuthService);

  // Inputs
  readonly expense = input<Expense | null>(null);
  readonly editMode = input(false);

  // Outputs
  readonly expenseAdded = output<string>();
  readonly expenseUpdated = output<void>();
  readonly cancelled = output<void>();

  // Form
  readonly expenseForm = this.fb.nonNullable.group({
    date: [new Date(), [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.required]],
    notes: [''],
    categoryId: ['', [Validators.required]],
    subcategoryId: ['', [Validators.required]],
    microCategoryId: [''],
    paidBy: ['' as PaymentMethodCode, [Validators.required]]
  });

  // Form controls
  protected get dateControl() { return this.expenseForm.controls.date; }
  protected get amountControl() { return this.expenseForm.controls.amount; }
  protected get descriptionControl() { return this.expenseForm.controls.description; }
  protected get categoryIdControl() { return this.expenseForm.controls.categoryId; }
  protected get subcategoryIdControl() { return this.expenseForm.controls.subcategoryId; }
  protected get paidByControl() { return this.expenseForm.controls.paidBy; }

  // Available payment methods based on current user
  protected readonly availablePaymentMethods = signal([
    { code: 'DC' as const, label: 'Dhaneesh Cash', type: 'cash' as const },
    { code: 'DD' as const, label: 'Dhaneesh Digital', type: 'digital' as const },
    { code: 'NC' as const, label: 'Nisha Cash', type: 'cash' as const },
    { code: 'ND' as const, label: 'Nisha Digital', type: 'digital' as const }
  ]);

  // Mock data for categories (will be replaced with real data)
  protected readonly mockCategories = [
    { id: 'food', name: 'Food & Dining' },
    { id: 'transport', name: 'Transportation' },
    { id: 'shopping', name: 'Shopping' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'bills', name: 'Bills & Utilities' },
    { id: 'health', name: 'Healthcare' },
    { id: 'education', name: 'Education' },
    { id: 'other', name: 'Other' }
  ];

  protected readonly mockSubcategories = [
    { id: 'restaurant', name: 'Restaurant' },
    { id: 'groceries', name: 'Groceries' },
    { id: 'fuel', name: 'Fuel' },
    { id: 'public-transport', name: 'Public Transport' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'movies', name: 'Movies' },
    { id: 'electricity', name: 'Electricity' }
  ];

  constructor() {
    // Initialize form with expense data if in edit mode
    const expense = this.expense();
    if (expense && this.editMode()) {
      const expenseDate = expense.date instanceof Date 
        ? expense.date 
        : expense.date?.toDate?.() 
        ? expense.date.toDate() 
        : new Date();
        
      this.expenseForm.patchValue({
        date: expenseDate,
        amount: expense.amount,
        description: expense.description,
        notes: expense.notes || '',
        categoryId: expense.categoryId,
        subcategoryId: expense.subcategoryId,
        paidBy: expense.paidBy
      });
    }
  }

  protected onSubmit(): void {
    if (this.expenseForm.valid) {
      this.expenseService.clearError();
      const formData: ExpenseFormData = this.expenseForm.value as ExpenseFormData;

      if (this.editMode() && this.expense()) {
        // Update existing expense
        this.expenseService.updateExpense(this.expense()!.id, formData).subscribe({
          next: () => {
            console.log('Expense updated successfully');
            this.expenseUpdated.emit();
          },
          error: (error) => console.error('Failed to update expense:', error)
        });
      } else {
        // Add new expense
        this.expenseService.addExpense(formData).subscribe({
          next: (id) => {
            console.log('Expense added successfully with ID:', id);
            this.expenseAdded.emit(id);
            this.resetForm();
          },
          error: (error) => console.error('Failed to add expense:', error)
        });
      }
    }
  }

  protected onCancel(): void {
    this.resetForm();
    this.cancelled.emit();
  }

  protected onDelete(): void {
    if (this.expense() && confirm('Are you sure you want to delete this expense?')) {
      this.expenseService.deleteExpense(this.expense()!.id).subscribe({
        next: () => {
          console.log('Expense deleted successfully');
          this.cancelled.emit();
        },
        error: (error) => console.error('Failed to delete expense:', error)
      });
    }
  }

  private resetForm(): void {
    this.expenseForm.reset({
      date: new Date(),
      amount: 0,
      description: '',
      notes: '',
      categoryId: '',
      subcategoryId: '',
      microCategoryId: '',
      paidBy: '' as PaymentMethodCode
    });
  }
}