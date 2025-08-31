import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CategoryService } from '../../../../core/services/category.service';
import { BudgetService } from '../../../../core/services/budget.service';
import { Category, Subcategory, MicroCategory } from '../../../../core/models/category.model';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { BudgetEditDialogComponent, BudgetEditDialogData, BudgetEditResult } from '../../../../shared/components/budget-edit-dialog/budget-edit-dialog.component';

@Component({
  selector: 'app-category-hierarchy-manager',
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
    MatTableModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Category Management</h2>
          <p class="text-gray-600 text-sm">Manage categories with subcategories, micro categories and budgets</p>
        </div>
        <div class="flex gap-2">
          <button mat-stroked-button (click)="initializePredefined()" 
                  [disabled]="categoryService.loading()">
            <mat-icon class="mr-2">auto_awesome</mat-icon>
            Initialize Predefined
          </button>
          <button mat-raised-button color="primary" (click)="showCreateForm.set(true)">
            <mat-icon class="mr-2">add</mat-icon>
            Add Category
          </button>
        </div>
      </div>

      <!-- Create/Edit Form -->
      @if (showCreateForm() || editingCategory()) {
        <mat-card class="p-6">
          <h3 class="text-lg font-semibold mb-4">
            {{ editingCategory() ? 'Edit Category' : 'Create New Category' }}
          </h3>
          
          <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()" class="space-y-4">
            <!-- Category Details -->
            <div class="border border-gray-200 rounded-lg p-4 mb-6">
              <h4 class="font-medium text-gray-900 mb-4">Category Information</h4>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <mat-form-field appearance="outline">
                  <mat-label>Category Name</mat-label>
                  <input matInput formControlName="name" placeholder="e.g., Monthly, Medical">
                  <mat-error *ngIf="categoryForm.get('name')?.hasError('required')">
                    Name is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Icon</mat-label>
                  <input matInput formControlName="icon" placeholder="🏠" maxlength="2">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Color</mat-label>
                  <input matInput type="color" formControlName="color">
                </mat-form-field>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <mat-form-field appearance="outline">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="2" 
                            placeholder="Category description..."></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Monthly Budget</mat-label>
                  <input matInput type="number" formControlName="budget" min="0" step="100">
                  <span matTextPrefix>₹&nbsp;</span>
                  <mat-hint>Set monthly budget for this category</mat-hint>
                </mat-form-field>
              </div>

              <div class="flex items-center gap-4 mt-4">
                <mat-form-field appearance="outline" class="w-24">
                  <mat-label>Order</mat-label>
                  <input matInput type="number" formControlName="order" min="0">
                </mat-form-field>
                
                <mat-slide-toggle formControlName="isActive">
                  Active
                </mat-slide-toggle>
              </div>
            </div>

            <!-- Subcategories -->
            <div class="border border-gray-200 rounded-lg p-4 mb-6">
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-medium text-gray-900">Subcategories</h4>
                <button type="button" mat-stroked-button (click)="addSubcategory()">
                  <mat-icon class="mr-2">add</mat-icon>
                  Add Subcategory
                </button>
              </div>
              
              <div formArrayName="subcategories" class="space-y-4">
                @for (subcategoryControl of subcategoriesFormArray.controls; track subcategoryControl; let i = $index) {
                  <div [formGroupName]="i" class="border border-gray-100 rounded-lg p-4 bg-gray-50">
                    <div class="flex items-start justify-between mb-3">
                      <h5 class="font-medium text-sm text-gray-700">Subcategory {{ i + 1 }}</h5>
                      <button type="button" mat-icon-button color="warn" (click)="removeSubcategory(i)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <mat-form-field appearance="outline">
                        <mat-label>Subcategory Name</mat-label>
                        <input matInput formControlName="name" placeholder="e.g., Grocery, Petrol">
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Description</mat-label>
                        <input matInput formControlName="description" placeholder="Optional description">
                      </mat-form-field>
                    </div>

                    <div class="flex items-center gap-4 mb-4">
                      <mat-form-field appearance="outline" class="w-24">
                        <mat-label>Order</mat-label>
                        <input matInput type="number" formControlName="order" min="0">
                      </mat-form-field>
                      
                      <mat-slide-toggle formControlName="isActive">
                        Active
                      </mat-slide-toggle>
                    </div>

                    <!-- Micro Categories for this Subcategory -->
                    <div class="border border-gray-200 rounded-lg p-3 bg-white">
                      <div class="flex items-center justify-between mb-3">
                        <h6 class="font-medium text-xs text-gray-600 uppercase tracking-wide">Micro Categories</h6>
                        <button type="button" mat-stroked-button size="small" (click)="addMicroCategory(i)">
                          <mat-icon class="mr-1 text-sm">add</mat-icon>
                          Add Micro
                        </button>
                      </div>
                      
                      <div formArrayName="microCategories" class="space-y-3">
                        @for (microControl of getMicroCategoriesFormArray(i).controls; track microControl; let j = $index) {
                          <div [formGroupName]="j" class="flex items-center gap-3 p-2 border border-gray-100 rounded">
                            <mat-form-field appearance="outline" class="flex-1">
                              <mat-label>Name</mat-label>
                              <input matInput formControlName="name" placeholder="e.g., Milk (recurring)">
                            </mat-form-field>

                            <mat-form-field appearance="outline" class="w-24">
                              <mat-label>Order</mat-label>
                              <input matInput type="number" formControlName="order" min="0">
                            </mat-form-field>

                            <mat-slide-toggle formControlName="isRecurring" class="scale-75">
                              Recurring
                            </mat-slide-toggle>

                            <mat-slide-toggle formControlName="isActive" class="scale-75">
                              Active
                            </mat-slide-toggle>

                            <button type="button" mat-icon-button size="small" color="warn" 
                                    (click)="removeMicroCategory(i, j)">
                              <mat-icon class="text-sm">delete</mat-icon>
                            </button>
                          </div>
                        }
                        @empty {
                          <div class="text-center py-2 text-gray-500 text-sm">
                            No micro categories. Click "Add Micro" to create one.
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
                @empty {
                  <div class="text-center py-4 text-gray-500">
                    No subcategories. Click "Add Subcategory" to create one.
                  </div>
                }
              </div>
            </div>

            <!-- Form Actions -->
            <div class="flex gap-3 pt-4">
              <button type="submit" mat-raised-button color="primary" 
                      [disabled]="categoryForm.invalid || categoryService.loading()">
                @if (categoryService.loading()) {
                  <mat-spinner diameter="20" class="mr-2"></mat-spinner>
                }
                {{ editingCategory() ? 'Update Category' : 'Create Category' }}
              </button>
              <button type="button" mat-stroked-button (click)="cancelForm()">
                Cancel
              </button>
            </div>
          </form>
        </mat-card>
      }

      <!-- Categories Table -->
      <mat-card class="p-6">
        <h3 class="text-lg font-semibold mb-4">Categories Overview</h3>
        
        @if (categories().length > 0) {
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="categories()" class="w-full">
              <!-- Category Column -->
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Category</th>
                <td mat-cell *matCellDef="let category">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white" 
                         [style.backgroundColor]="category.color">
                      {{ category.icon }}
                    </div>
                    <div>
                      <div class="font-medium">{{ category.name }}</div>
                      @if (category.description) {
                        <div class="text-sm text-gray-600">{{ category.description }}</div>
                      }
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Subcategories Column -->
              <ng-container matColumnDef="subcategories">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Subcategories</th>
                <td mat-cell *matCellDef="let category">
                  <div class="space-y-1">
                    @for (subcategory of getCategorySubcategories(category.id); track subcategory.id) {
                      <div class="flex items-center justify-between">
                        <span class="text-sm">{{ subcategory.name }}</span>
                        <div class="flex items-center gap-1">
                          @if (getSubcategoryMicroCategories(subcategory.id).length > 0) {
                            <mat-chip class="text-xs scale-75">
                              {{ getSubcategoryMicroCategories(subcategory.id).length }} micro
                            </mat-chip>
                          }
                          @if (!subcategory.isActive) {
                            <mat-chip color="warn" class="text-xs scale-75">Inactive</mat-chip>
                          }
                        </div>
                      </div>
                    }
                    @empty {
                      <span class="text-sm text-gray-500">No subcategories</span>
                    }
                  </div>
                </td>
              </ng-container>

              <!-- Budget Column -->
              <ng-container matColumnDef="budget">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Monthly Budget</th>
                <td mat-cell *matCellDef="let category">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">₹{{ getCategoryBudget(category.id) | number }}</span>
                    <button mat-icon-button size="small" (click)="quickEditBudget(category)">
                      <mat-icon class="text-sm">edit</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Status</th>
                <td mat-cell *matCellDef="let category">
                  <mat-chip [color]="category.isActive ? 'primary' : 'basic'" class="text-xs">
                    {{ category.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="font-semibold">Actions</th>
                <td mat-cell *matCellDef="let category">
                  <div class="flex items-center gap-2">
                    <button mat-icon-button (click)="editCategory(category)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button [matMenuTriggerFor]="actionMenu">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    
                    <mat-menu #actionMenu="matMenu">
                      <button mat-menu-item (click)="toggleCategoryStatus(category)">
                        <mat-icon>{{ category.isActive ? 'visibility_off' : 'visibility' }}</mat-icon>
                        {{ category.isActive ? 'Deactivate' : 'Activate' }}
                      </button>
                      <button mat-menu-item (click)="deleteCategory(category)" class="text-red-600">
                        <mat-icon class="text-red-600">delete</mat-icon>
                        Delete
                      </button>
                    </mat-menu>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                  class="hover:bg-gray-50 cursor-pointer"></tr>
            </table>
          </div>
        } @else {
          <div class="text-center py-12">
            <mat-icon class="text-6xl text-gray-300 mb-4">category</mat-icon>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
            <p class="text-gray-600 mb-4">Create your first category to get started with expense tracking.</p>
            <button mat-raised-button color="primary" (click)="showCreateForm.set(true)">
              Create First Category
            </button>
          </div>
        }
      </mat-card>
    </div>
  `
})
export class CategoryHierarchyManagerComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly categoryService = inject(CategoryService);
  private readonly budgetService = inject(BudgetService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // Signals
  readonly showCreateForm = signal<boolean>(false);
  readonly editingCategory = signal<Category | null>(null);

  // Table configuration
  readonly displayedColumns = ['category', 'subcategories', 'budget', 'status', 'actions'];

  // Computed values
  readonly categories = computed(() => this.categoryService.categories());
  readonly categoriesWithHierarchy = computed(() => this.categoryService.categoriesWithSubcategories());

  // Form
  readonly categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    icon: ['📁', [Validators.required]],
    color: ['#3b82f6', [Validators.required]],
    budget: [0, [Validators.min(0)]],
    order: [0, [Validators.min(0)]],
    isActive: [true],
    subcategories: this.fb.array([])
  });

  // Form array getters
  get subcategoriesFormArray() {
    return this.categoryForm.get('subcategories') as FormArray;
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.categoryService.getUserCategories().subscribe({
      next: (categories) => {
        console.log('Loaded categories:', categories.length);
      },
      error: (error) => console.error('Failed to load categories:', error)
    });
  }

  // Form management methods
  protected addSubcategory(): void {
    const subcategoryGroup = this.fb.nonNullable.group({
      name: ['', [Validators.required]],
      description: [''],
      order: [0, [Validators.min(0)]],
      isActive: [true],
      microCategories: this.fb.array([])
    });
    
    this.subcategoriesFormArray.push(subcategoryGroup);
  }

  protected removeSubcategory(index: number): void {
    this.subcategoriesFormArray.removeAt(index);
  }

  protected addMicroCategory(subcategoryIndex: number): void {
    const microCategoryGroup = this.fb.nonNullable.group({
      name: ['', [Validators.required]],
      order: [0, [Validators.min(0)]],
      isRecurring: [false],
      isActive: [true]
    });
    
    this.getMicroCategoriesFormArray(subcategoryIndex).push(microCategoryGroup);
  }

  protected removeMicroCategory(subcategoryIndex: number, microCategoryIndex: number): void {
    this.getMicroCategoriesFormArray(subcategoryIndex).removeAt(microCategoryIndex);
  }

  protected getMicroCategoriesFormArray(subcategoryIndex: number): FormArray {
    const subcategoryGroup = this.subcategoriesFormArray.at(subcategoryIndex);
    return subcategoryGroup.get('microCategories') as FormArray;
  }

  // Data access methods
  protected getCategorySubcategories(categoryId: string): Subcategory[] {
    const category = this.categoriesWithHierarchy().find(cat => cat.id === categoryId);
    return category?.subcategories || [];
  }

  protected getSubcategoryMicroCategories(subcategoryId: string): MicroCategory[] {
    const allCategories = this.categoriesWithHierarchy();
    for (const category of allCategories) {
      for (const subcategory of category.subcategories) {
        if (subcategory.id === subcategoryId) {
          return subcategory.microCategories || [];
        }
      }
    }
    return [];
  }

  protected getCategoryBudget(categoryId: string): number {
    // This would need to be implemented to get actual budget from budget service
    return 0;
  }

  // Action methods
  protected saveCategory(): void {
    if (this.categoryForm.valid) {
      const formData = this.categoryForm.value;
      const isEditing = this.editingCategory() !== null;
      
      // First create/update the category
      const categoryData = {
        name: formData.name!,
        description: formData.description || '',
        icon: formData.icon!,
        color: formData.color!,
        order: formData.order!,
        isActive: formData.isActive!
      };

      if (isEditing) {
        this.categoryService.updateCategory(this.editingCategory()!.id, categoryData).subscribe({
          next: () => {
            const finalCategoryId = this.editingCategory()!.id;
            
            // Set budget if specified
            if (formData.budget && formData.budget > 0) {
              this.budgetService.setBudgetForCategory(finalCategoryId, formData.budget).subscribe({
                next: () => console.log('Budget set successfully'),
                error: (error: any) => console.error('Failed to set budget:', error)
              });
            }

            // Create subcategories and micro categories
            this.createSubcategoriesAndMicros(finalCategoryId, formData.subcategories || []);
            
            this.snackBar.open('Category updated successfully', 'Close', { duration: 3000 });
            this.cancelForm();
            this.loadData();
          },
          error: (error: any) => {
            console.error('Failed to update category:', error);
            this.snackBar.open('Failed to update category', 'Close', { duration: 5000 });
          }
        });
      } else {
        this.categoryService.addCategory(categoryData as any).subscribe({
          next: (categoryId: string) => {
            
            // Set budget if specified
            if (formData.budget && formData.budget > 0) {
              this.budgetService.setBudgetForCategory(categoryId, formData.budget).subscribe({
                next: () => console.log('Budget set successfully'),
                error: (error: any) => console.error('Failed to set budget:', error)
              });
            }

            // Create subcategories and micro categories
            this.createSubcategoriesAndMicros(categoryId, formData.subcategories || []);
            
            this.snackBar.open('Category created successfully', 'Close', { duration: 3000 });
            this.cancelForm();
            this.loadData();
          },
          error: (error: any) => {
            console.error('Failed to create category:', error);
            this.snackBar.open('Failed to create category', 'Close', { duration: 5000 });
          }
        });
      }
    }
  }

  private createSubcategoriesAndMicros(categoryId: string, subcategories: any[]): void {
    subcategories.forEach((subData, subIndex) => {
      if (subData.name) {
        const subcategoryData = {
          categoryId,
          name: subData.name,
          description: subData.description || '',
          order: subData.order || subIndex,
          isActive: subData.isActive !== false
        };

        this.categoryService.addSubcategory(subcategoryData).subscribe({
          next: (subcategoryId) => {
            // Create micro categories for this subcategory
            if (subData.microCategories && subData.microCategories.length > 0) {
              subData.microCategories.forEach((microData: any, microIndex: number) => {
                if (microData.name) {
                  const microCategoryData = {
                    subcategoryId,
                    name: microData.name,
                    order: microData.order || microIndex,
                    isRecurring: microData.isRecurring || false,
                    isActive: microData.isActive !== false
                  };

                  this.categoryService.addMicroCategory(microCategoryData).subscribe({
                    next: () => console.log('Micro category created'),
                    error: (error) => console.error('Failed to create micro category:', error)
                  });
                }
              });
            }
          },
          error: (error) => console.error('Failed to create subcategory:', error)
        });
      }
    });
  }

  protected editCategory(category: Category): void {
    this.editingCategory.set(category);
    this.showCreateForm.set(true);
    
    // Populate form with category data
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description || '',
      icon: category.icon,
      color: category.color,
      budget: this.getCategoryBudget(category.id),
      order: category.order,
      isActive: category.isActive
    });

    // Load subcategories and micro categories
    // This would need to be implemented to populate the form arrays
  }

  protected deleteCategory(category: Category): void {
    const dialogData: ConfirmationDialogData = {
      title: 'Delete Category',
      message: `Are you sure you want to delete "${category.name}" and all its subcategories? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.categoryService.deleteCategory(category.id).subscribe({
          next: () => {
            this.snackBar.open('Category deleted successfully', 'Close', { duration: 3000 });
            this.loadData();
          },
          error: (error) => {
            console.error('Failed to delete category:', error);
            this.snackBar.open('Failed to delete category', 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  protected toggleCategoryStatus(category: Category): void {
    const action = category.isActive ? 'deactivate' : 'activate';
    const dialogData: ConfirmationDialogData = {
      title: `${action === 'activate' ? 'Activate' : 'Deactivate'} Category`,
      message: `Are you sure you want to ${action} "${category.name}"? ${
        category.isActive 
          ? 'This will prevent new expenses from being categorized under this category.' 
          : 'This will allow expenses to be categorized under this category again.'
      }`,
      confirmText: action === 'activate' ? 'Activate' : 'Deactivate',
      cancelText: 'Cancel',
      type: category.isActive ? 'warning' : 'info'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.categoryService.updateCategory(category.id, { isActive: !category.isActive }).subscribe({
          next: () => {
            this.snackBar.open(`Category ${category.isActive ? 'deactivated' : 'activated'}`, 'Close', { duration: 3000 });
            this.loadData();
          },
          error: (error) => {
            console.error('Failed to toggle category status:', error);
            this.snackBar.open('Failed to update category status', 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  protected quickEditBudget(category: Category): void {
    const currentBudget = this.getCategoryBudget(category.id);
    
    const dialogData: BudgetEditDialogData = {
      categoryName: category.name,
      currentBudget: currentBudget
    };

    const dialogRef = this.dialog.open(BudgetEditDialogComponent, {
      data: dialogData,
      width: '450px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: BudgetEditResult) => {
      if (result && typeof result.budget === 'number') {
        this.budgetService.setBudgetForCategory(category.id, result.budget).subscribe({
          next: () => {
            this.snackBar.open('Budget updated successfully', 'Close', { duration: 3000 });
            this.loadData(); // Reload data to show updated budget
          },
          error: (error) => {
            console.error('Failed to update budget:', error);
            this.snackBar.open('Failed to update budget', 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  protected initializePredefined(): void {
    this.categoryService.initializePredefinedCategories().subscribe({
      next: () => {
        this.snackBar.open('Predefined categories initialized successfully', 'Close', { duration: 3000 });
        this.loadData();
      },
      error: (error) => {
        console.error('Failed to initialize predefined categories:', error);
        this.snackBar.open('Failed to initialize predefined categories', 'Close', { duration: 5000 });
      }
    });
  }

  protected cancelForm(): void {
    this.showCreateForm.set(false);
    this.editingCategory.set(null);
    this.categoryForm.reset({
      name: '',
      description: '',
      icon: '📁',
      color: '#3b82f6',
      budget: 0,
      order: 0,
      isActive: true
    });
    
    // Clear form arrays
    while (this.subcategoriesFormArray.length !== 0) {
      this.subcategoriesFormArray.removeAt(0);
    }
  }
}