import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/category.model';

interface CategoryEditData {
  category: Category;
}

interface CategoryEditForm {
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
}

@Component({
  selector: 'app-category-edit-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="category-edit-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title class="text-xl font-semibold text-gray-900">
          Edit Category
        </h2>
        <button mat-icon-button mat-dialog-close class="text-gray-400 hover:text-gray-600">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        <form #editForm="ngForm" class="space-y-6">
          <!-- Category Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input 
              type="text" 
              [(ngModel)]="formData.name"
              name="categoryName"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter category name"
              required>
          </div>
          
          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea 
              [(ngModel)]="formData.description"
              name="categoryDescription"
              rows="3"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter category description"></textarea>
          </div>
          
          <!-- Icon and Color -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <input 
                type="text" 
                [(ngModel)]="formData.icon"
                name="categoryIcon"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="🏠"
                maxlength="2">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input 
                type="color" 
                [(ngModel)]="formData.color"
                name="categoryColor"
                class="w-full h-12 border border-gray-300 rounded-lg">
            </div>
          </div>

          <!-- Preview -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div 
                class="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                [style.backgroundColor]="formData.color">
                {{formData.icon}}
              </div>
              <div>
                <h3 class="font-medium text-gray-900">{{formData.name || 'Category Name'}}</h3>
                <p class="text-sm text-gray-600">{{formData.description || 'No description'}}</p>
              </div>
            </div>
          </div>

          <!-- Status Toggle -->
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 class="text-sm font-medium text-gray-900">Category Status</h4>
              <p class="text-sm text-gray-600">Enable or disable this category</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                [(ngModel)]="formData.isActive"
                name="isActive"
                class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button 
          mat-stroked-button 
          mat-dialog-close
          class="flex-1">
          Cancel
        </button>
        <button 
          mat-flat-button 
          color="primary"
          (click)="updateCategory()"
          [disabled]="loading() || !formData.name.trim()"
          class="flex-1">
          @if (loading()) {
            <mat-spinner diameter="20" class="mr-2"></mat-spinner>
          }
          Update Category
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .category-edit-dialog {
      width: 500px;
      max-width: 95vw;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 0 24px;
      margin-bottom: 0;
    }

    .dialog-content {
      padding: 24px !important;
      max-height: 70vh;
      overflow-y: auto;
    }

    .dialog-actions {
      padding: 16px 24px 24px 24px !important;
      gap: 12px;
    }

    ::ng-deep .mat-mdc-dialog-title {
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Custom toggle switch styling */
    input[type="checkbox"]:checked + div {
      background-color: #3b82f6;
    }

    input[type="checkbox"]:checked + div:after {
      transform: translateX(20px);
    }

    @media (max-width: 640px) {
      .category-edit-dialog {
        width: 100vw;
        height: 100vh;
        max-width: none;
        max-height: none;
      }
      
      .dialog-content {
        max-height: calc(100vh - 120px);
      }
    }
  `]
})
export class CategoryEditDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CategoryEditDialogComponent>);
  private readonly data = inject<CategoryEditData>(MAT_DIALOG_DATA);
  private readonly categoryService = inject(CategoryService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  
  // Form data initialized with category data
  formData: CategoryEditForm = {
    name: this.data.category.name,
    description: this.data.category.description || '',
    icon: this.data.category.icon,
    color: this.data.category.color,
    isActive: this.data.category.isActive
  };

  protected updateCategory(): void {
    if (!this.formData.name?.trim()) {
      this.snackBar.open('Please enter a category name', 'Close', { duration: 3000 });
      return;
    }

    this.loading.set(true);

    const updates = {
      name: this.formData.name.trim(),
      description: this.formData.description?.trim() || undefined,
      icon: this.formData.icon,
      color: this.formData.color,
      isActive: this.formData.isActive
    };

    this.categoryService.updateCategory(this.data.category.id, updates).subscribe({
      next: () => {
        this.snackBar.open('Category updated successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close(true); // Return true to indicate successful update
      },
      error: (error) => {
        console.error('Failed to update category:', error);
        this.snackBar.open('Failed to update category', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }
}