import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { RecurringExpenseService, RecurringExpenseTemplate } from '../../../../core/services/recurring-expense.service';
import { CategoryService } from '../../../../core/services/category.service';
import { RecurringExpense } from '../../../../core/models/expense.model';
import { Category } from '../../../../core/models/category.model';
import { PaymentMethodCode } from '../../../../core/models/user.model';

@Component({
  selector: 'app-recurring-expenses',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatChipsModule,
    MatListModule
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Recurring Expenses</h2>
          <p class="text-gray-600 text-sm">Automate regular expenses like milk, electricity, etc.</p>
        </div>
        <button mat-raised-button color="primary" (click)="showCreateForm.set(true)" [disabled]="recurringService.loading()">
          <mat-icon class="mr-2">add</mat-icon>
          Add Recurring
        </button>
      </div>

      <!-- Quick Actions -->
      <mat-card class="p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div class="flex gap-3">
          <button mat-stroked-button (click)="triggerRecurring()" [disabled]="recurringService.loading()">
            @if (triggering()) {
              <mat-spinner diameter="16" class="mr-2"></mat-spinner>
            } @else {
              <mat-icon class="mr-2">play_arrow</mat-icon>
            }
            Trigger Now
          </button>
          <button mat-stroked-button (click)="loadSuggestions()" [disabled]="loadingSuggestions()">
            @if (loadingSuggestions()) {
              <mat-spinner diameter="16" class="mr-2"></mat-spinner>
            } @else {
              <mat-icon class="mr-2">auto_fix_high</mat-icon>
            }
            Get Suggestions
          </button>
        </div>
      </mat-card>

      <!-- Create/Edit Form -->
      @if (showCreateForm() || editingExpense()) {
        <mat-card class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            {{ editingExpense() ? 'Edit Recurring Expense' : 'Create Recurring Expense' }}
          </h3>
          
          <form [formGroup]="recurringForm" (ngSubmit)="saveRecurringExpense()" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Template Name</mat-label>
                <input matInput formControlName="templateName" placeholder="e.g., Daily Milk">
                <mat-error *ngIf="recurringForm.get('templateName')?.hasError('required')">
                  Template name is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Amount</mat-label>
                <input matInput type="number" formControlName="amount" placeholder="0.00" min="0" step="0.01">
                <span matTextPrefix>₹&nbsp;</span>
                <mat-error *ngIf="recurringForm.get('amount')?.hasError('required')">
                  Amount is required
                </mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Description</mat-label>
              <input matInput formControlName="description" placeholder="What is this expense for?">
              <mat-error *ngIf="recurringForm.get('description')?.hasError('required')">
                Description is required
              </mat-error>
            </mat-form-field>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Category</mat-label>
                <mat-select formControlName="categoryId" (selectionChange)="onCategoryChange($event.value)">
                  @for (category of categories(); track category.id) {
                    <mat-option [value]="category.id">
                      <span class="flex items-center gap-2">
                        <span>{{ category.icon }}</span>
                        {{ category.name }}
                      </span>
                    </mat-option>
                  }
                </mat-select>
                <mat-error *ngIf="recurringForm.get('categoryId')?.hasError('required')">
                  Category is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Subcategory</mat-label>
                <mat-select formControlName="subcategoryId" [disabled]="!selectedCategorySubcategories().length">
                  @for (subcategory of selectedCategorySubcategories(); track subcategory.id) {
                    <mat-option [value]="subcategory.id">{{ subcategory.name }}</mat-option>
                  }
                </mat-select>
                <mat-error *ngIf="recurringForm.get('subcategoryId')?.hasError('required')">
                  Subcategory is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Frequency</mat-label>
                <mat-select formControlName="frequency">
                  <mat-option value="daily">Daily</mat-option>
                  <mat-option value="weekly">Weekly</mat-option>
                  <mat-option value="monthly">Monthly</mat-option>
                </mat-select>
                <mat-error *ngIf="recurringForm.get('frequency')?.hasError('required')">
                  Frequency is required
                </mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Payment Method</mat-label>
              <mat-select formControlName="paidBy">
                <mat-option value="DC">Dhaneesh Cash</mat-option>
                <mat-option value="DD">Dhaneesh Digital</mat-option>
                <mat-option value="NC">Nisha Cash</mat-option>
                <mat-option value="ND">Nisha Digital</mat-option>
              </mat-select>
              <mat-error *ngIf="recurringForm.get('paidBy')?.hasError('required')">
                Payment method is required
              </mat-error>
            </mat-form-field>

            <div class="flex items-center mb-4">
              <mat-slide-toggle formControlName="isActive">
                Active (will create expenses automatically)
              </mat-slide-toggle>
            </div>

            <div class="flex gap-3">
              <button type="submit" mat-raised-button color="primary" [disabled]="recurringForm.invalid || recurringService.loading()">
                @if (recurringService.loading()) {
                  <mat-spinner diameter="20" class="mr-2"></mat-spinner>
                }
                {{ editingExpense() ? 'Update' : 'Create' }}
              </button>
              <button type="button" mat-stroked-button (click)="cancelForm()">
                Cancel
              </button>
            </div>
          </form>
        </mat-card>
      }

      <!-- Suggestions -->
      @if (suggestions().length > 0 && !showCreateForm() && !editingExpense()) {
        <mat-card class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Suggested Recurring Expenses</h3>
          <p class="text-sm text-gray-600 mb-4">Based on your expense patterns:</p>
          <div class="space-y-3">
            @for (suggestion of suggestions(); track suggestion.id) {
              <div class="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div class="flex-1">
                  <div class="font-medium">{{ suggestion.name }}</div>
                  <div class="text-sm text-gray-600">₹{{ suggestion.defaultAmount }} - {{ suggestion.description }}</div>
                </div>
                <button mat-stroked-button (click)="createFromSuggestion(suggestion)" [disabled]="recurringService.loading()">
                  Add
                </button>
              </div>
            }
          </div>
        </mat-card>
      }

      <!-- Predefined Templates -->
      @if (!showCreateForm() && !editingExpense()) {
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Quick Templates</mat-panel-title>
            <mat-panel-description>Common recurring expenses</mat-panel-description>
          </mat-expansion-panel-header>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
            @for (template of predefinedTemplates; track template.id) {
              <div class="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                <div class="flex-1">
                  <div class="font-medium text-sm">{{ template.name }}</div>
                  <div class="text-xs text-gray-600">₹{{ template.defaultAmount }}</div>
                </div>
                <button mat-stroked-button size="small" (click)="useTemplate(template)" [disabled]="recurringService.loading()">
                  Use
                </button>
              </div>
            }
          </div>
        </mat-expansion-panel>
      }

      <!-- Active Recurring Expenses -->
      @if (recurringExpenses().length > 0) {
        <mat-card class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Your Recurring Expenses</h3>
          
          <div class="space-y-3">
            @for (expense of recurringExpenses(); track expense.id) {
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3">
                      <h4 class="font-medium">{{ expense.templateName }}</h4>
                      <mat-chip [color]="expense.isActive ? 'primary' : 'basic'" class="text-xs">
                        {{ expense.isActive ? 'Active' : 'Inactive' }}
                      </mat-chip>
                      <mat-chip color="accent" class="text-xs">
                        {{ expense.frequency }}
                      </mat-chip>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">{{ expense.description }}</p>
                    <div class="text-sm text-gray-500 mt-2">
                      ₹{{ expense.amount.toLocaleString() }} • {{ expense.paidBy }}
                      @if (expense.lastCreated) {
                        • Last: {{ formatDate(expense.lastCreated) }}
                      }
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <button mat-icon-button (click)="toggleExpense(expense)" [disabled]="recurringService.loading()">
                      <mat-icon [color]="expense.isActive ? 'warn' : 'primary'">
                        {{ expense.isActive ? 'pause' : 'play_arrow' }}
                      </mat-icon>
                    </button>
                    <button mat-icon-button (click)="createExpenseNow(expense)" [disabled]="recurringService.loading()">
                      <mat-icon color="accent">add_circle</mat-icon>
                    </button>
                    <button mat-icon-button (click)="editExpense(expense)" [disabled]="recurringService.loading()">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button (click)="deleteExpense(expense)" [disabled]="recurringService.loading()" color="warn">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </mat-card>
      }

      <!-- Empty State -->
      @if (recurringExpenses().length === 0 && !recurringService.loading() && !showCreateForm()) {
        <mat-card class="p-8 text-center">
          <mat-icon class="text-6xl text-gray-300 mb-4">repeat</mat-icon>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No Recurring Expenses</h3>
          <p class="text-gray-600 mb-4">Set up automatic recurring expenses like milk, electricity bills, etc.</p>
          <button mat-raised-button color="primary" (click)="showCreateForm.set(true)">
            Create Your First Recurring Expense
          </button>
        </mat-card>
      }
    </div>
  `
})
export class RecurringExpensesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly recurringService = inject(RecurringExpenseService);
  private readonly categoryService = inject(CategoryService);
  private readonly snackBar = inject(MatSnackBar);

  // Signals
  readonly categories = signal<Category[]>([]);
  readonly recurringExpenses = signal<RecurringExpense[]>([]);
  readonly suggestions = signal<RecurringExpenseTemplate[]>([]);
  readonly showCreateForm = signal<boolean>(false);
  readonly editingExpense = signal<RecurringExpense | null>(null);
  readonly loadingSuggestions = signal<boolean>(false);
  readonly triggering = signal<boolean>(false);

  // Computed values
  readonly selectedCategorySubcategories = computed(() => {
    const categoryId = this.recurringForm.get('categoryId')?.value;
    if (!categoryId) return [];
    
    const category = this.categories().find(cat => cat.id === categoryId);
    return category?.subcategories || [];
  });

  // Form
  readonly recurringForm = this.fb.nonNullable.group({
    templateName: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    subcategoryId: ['', [Validators.required]],
    microCategoryId: [''],
    paidBy: ['DC' as PaymentMethodCode, [Validators.required]],
    frequency: ['monthly' as 'daily' | 'weekly' | 'monthly', [Validators.required]],
    isActive: [true]
  });

  // Predefined templates
  readonly predefinedTemplates = this.recurringService.getPredefinedTemplates();

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    // Load categories
    this.categoryService.getUserCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (error) => console.error('Failed to load categories:', error)
    });

    // Load recurring expenses
    this.recurringService.getUserRecurringExpenses().subscribe({
      next: (expenses) => this.recurringExpenses.set(expenses),
      error: (error) => console.error('Failed to load recurring expenses:', error)
    });
  }

  protected onCategoryChange(categoryId: string): void {
    // Reset subcategory when category changes
    this.recurringForm.patchValue({
      subcategoryId: '',
      microCategoryId: ''
    });
  }

  protected saveRecurringExpense(): void {
    if (this.recurringForm.valid) {
      const formData = this.recurringForm.value;
      const editingId = this.editingExpense()?.id;

      if (editingId) {
        this.recurringService.updateRecurringExpense(editingId, formData as any).subscribe({
          next: () => {
            this.snackBar.open('Recurring expense updated successfully', 'Close', { duration: 3000 });
            this.cancelForm();
            this.loadData();
          },
          error: (error: any) => {
            console.error('Failed to save recurring expense:', error);
            this.snackBar.open('Failed to save recurring expense', 'Close', { duration: 5000 });
          }
        });
      } else {
        this.recurringService.addRecurringExpense(formData as any).subscribe({
          next: () => {
            this.snackBar.open('Recurring expense created successfully', 'Close', { duration: 3000 });
            this.cancelForm();
            this.loadData();
          },
          error: (error: any) => {
            console.error('Failed to save recurring expense:', error);
            this.snackBar.open('Failed to save recurring expense', 'Close', { duration: 5000 });
          }
        });
      }
    }
  }

  protected cancelForm(): void {
    this.showCreateForm.set(false);
    this.editingExpense.set(null);
    this.recurringForm.reset({
      templateName: '',
      amount: 0,
      description: '',
      categoryId: '',
      subcategoryId: '',
      microCategoryId: '',
      paidBy: 'DC',
      frequency: 'monthly',
      isActive: true
    });
  }

  protected editExpense(expense: RecurringExpense): void {
    this.editingExpense.set(expense);
    this.showCreateForm.set(false);
    this.recurringForm.patchValue({
      templateName: expense.templateName,
      amount: expense.amount,
      description: expense.description,
      categoryId: expense.categoryId,
      subcategoryId: expense.subcategoryId,
      microCategoryId: expense.microCategoryId || '',
      paidBy: expense.paidBy,
      frequency: expense.frequency,
      isActive: expense.isActive
    });
  }

  protected toggleExpense(expense: RecurringExpense): void {
    this.recurringService.toggleRecurringExpense(expense.id, !expense.isActive).subscribe({
      next: () => {
        this.snackBar.open(`Recurring expense ${expense.isActive ? 'paused' : 'activated'}`, 'Close', { duration: 3000 });
        this.loadData();
      },
      error: (error) => {
        console.error('Failed to toggle recurring expense:', error);
        this.snackBar.open('Failed to update recurring expense', 'Close', { duration: 5000 });
      }
    });
  }

  protected createExpenseNow(expense: RecurringExpense): void {
    this.recurringService.createExpenseFromTemplate(expense).subscribe({
      next: (expenseId) => {
        this.snackBar.open('Expense created successfully', 'Close', { duration: 3000 });
        this.loadData();
      },
      error: (error) => {
        console.error('Failed to create expense from template:', error);
        this.snackBar.open('Failed to create expense', 'Close', { duration: 5000 });
      }
    });
  }

  protected deleteExpense(expense: RecurringExpense): void {
    if (confirm(`Are you sure you want to delete "${expense.templateName}"?`)) {
      this.recurringService.deleteRecurringExpense(expense.id).subscribe({
        next: () => {
          this.snackBar.open('Recurring expense deleted', 'Close', { duration: 3000 });
          this.loadData();
        },
        error: (error) => {
          console.error('Failed to delete recurring expense:', error);
          this.snackBar.open('Failed to delete recurring expense', 'Close', { duration: 5000 });
        }
      });
    }
  }

  protected loadSuggestions(): void {
    this.loadingSuggestions.set(true);
    this.recurringService.getSuggestedRecurringExpenses().subscribe({
      next: (suggestions) => {
        this.suggestions.set(suggestions);
        this.loadingSuggestions.set(false);
        this.snackBar.open(`Found ${suggestions.length} suggestions based on your expense patterns`, 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Failed to load suggestions:', error);
        this.loadingSuggestions.set(false);
        this.snackBar.open('Failed to load suggestions', 'Close', { duration: 5000 });
      }
    });
  }

  protected createFromSuggestion(suggestion: RecurringExpenseTemplate): void {
    this.recurringService.createFromSuggestion(suggestion).subscribe({
      next: () => {
        this.snackBar.open('Recurring expense created from suggestion', 'Close', { duration: 3000 });
        this.loadData();
        // Remove this suggestion from the list
        const currentSuggestions = this.suggestions();
        this.suggestions.set(currentSuggestions.filter(s => s.id !== suggestion.id));
      },
      error: (error) => {
        console.error('Failed to create from suggestion:', error);
        this.snackBar.open('Failed to create recurring expense', 'Close', { duration: 5000 });
      }
    });
  }

  protected useTemplate(template: RecurringExpenseTemplate): void {
    this.showCreateForm.set(true);
    this.recurringForm.patchValue({
      templateName: template.name,
      amount: template.defaultAmount,
      description: template.description,
      categoryId: template.categoryId,
      subcategoryId: template.subcategoryId,
      paidBy: template.paymentMethod as PaymentMethodCode,
      frequency: 'monthly',
      isActive: true
    });
  }

  protected triggerRecurring(): void {
    this.triggering.set(true);
    this.recurringService.triggerRecurringExpenses().subscribe({
      next: (createdIds) => {
        this.triggering.set(false);
        if (createdIds.length > 0) {
          this.snackBar.open(`Created ${createdIds.length} recurring expenses`, 'Close', { duration: 3000 });
        } else {
          this.snackBar.open('No recurring expenses were due', 'Close', { duration: 3000 });
        }
        this.loadData();
      },
      error: (error) => {
        console.error('Failed to trigger recurring expenses:', error);
        this.triggering.set(false);
        this.snackBar.open('Failed to process recurring expenses', 'Close', { duration: 5000 });
      }
    });
  }

  protected formatDate(date: Date | null): string {
    if (!date) return 'Never';
    return date.toLocaleDateString();
  }
}