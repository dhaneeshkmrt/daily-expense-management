import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/category.model';
import { CategoryEditDialogComponent } from '../category-edit-dialog/category-edit-dialog.component';

interface CategoryForm {
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
}

@Component({
  selector: 'app-category-container',
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="categories-container">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-gray-100 px-6 py-4 mb-6">
        <div class="max-w-7xl mx-auto">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Categories</h1>
              <p class="text-gray-600 mt-1">Organize and manage your expense categories</p>
            </div>
            
            <!-- Quick Actions -->
            <div class="flex gap-3">
              <button 
                mat-stroked-button 
                (click)="selectedTab.set(0)"
                class="flex items-center gap-2">
                <mat-icon>add</mat-icon>
                Add Category
              </button>
              
              <button 
                mat-flat-button 
                color="primary"
                (click)="initializePredefinedCategories()"
                [disabled]="categoryService.loading()"
                matTooltip="Initialize with predefined categories">
                <mat-icon>auto_awesome</mat-icon>
                Quick Setup
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
          class="category-tabs">
          
          <!-- Add Category Tab -->
          <mat-tab label="Add Category">
            <ng-template matTabContent>
              <div class="py-6">
                <div class="max-w-2xl mx-auto">
                  <div class="bg-white rounded-2xl shadow-lg p-8">
                    <h2 class="text-xl font-semibold text-gray-900 mb-6">Create New Category</h2>
                    
                    <!-- Add Category Form -->
                    <form (ngSubmit)="addCategory()" #categoryForm="ngForm" class="space-y-6">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                        <input 
                          type="text" 
                          [(ngModel)]="categoryFormData.name"
                          name="categoryName"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter category name"
                          required>
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea 
                          [(ngModel)]="categoryFormData.description"
                          name="categoryDescription"
                          rows="3"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter category description"></textarea>
                      </div>
                      
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                          <input 
                            type="text" 
                            [(ngModel)]="categoryFormData.icon"
                            name="categoryIcon"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="🏠"
                            maxlength="2">
                        </div>
                        
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-2">Color</label>
                          <input 
                            type="color" 
                            [(ngModel)]="categoryFormData.color"
                            name="categoryColor"
                            class="w-full h-12 border border-gray-300 rounded-lg">
                        </div>
                      </div>
                      
                      <div class="flex gap-4">
                        <button 
                          type="submit"
                          mat-flat-button 
                          color="primary"
                          [disabled]="categoryService.loading() || !categoryFormData.name"
                          class="flex-1">
                          @if (categoryService.loading()) {
                            <mat-spinner diameter="20" class="mr-2"></mat-spinner>
                          }
                          Add Category
                        </button>
                        
                        <button 
                          type="button"
                          mat-stroked-button 
                          (click)="resetForm()"
                          class="flex-1">
                          Clear
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </ng-template>
          </mat-tab>

          <!-- Manage Categories Tab -->
          <mat-tab label="Manage Categories">
            <ng-template matTabContent>
              <div class="py-6">
                @if (categoryService.loading()) {
                  <div class="text-center py-12">
                    <mat-spinner diameter="40" class="mx-auto mb-4"></mat-spinner>
                    <p class="text-gray-600">Loading categories...</p>
                  </div>
                } @else if (categoryService.categoriesWithSubcategories().length === 0) {
                  <div class="text-center py-12 bg-gray-50 rounded-2xl">
                    <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <mat-icon class="text-purple-600 text-2xl">category</mat-icon>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No Categories Yet</h3>
                    <p class="text-gray-600 mb-4">Get started by creating your first category or using our quick setup.</p>
                    <div class="flex gap-3 justify-center">
                      <button 
                        mat-flat-button 
                        color="primary"
                        (click)="selectedTab.set(0)">
                        Add Category
                      </button>
                      <button 
                        mat-stroked-button 
                        (click)="initializePredefinedCategories()">
                        Quick Setup
                      </button>
                    </div>
                  </div>
                } @else {
                  <!-- Categories Grid -->
                  <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    @for (category of categoryService.categoriesWithSubcategories(); track category.id) {
                      <mat-card class="category-card hover:shadow-lg transition-shadow">
                        <mat-card-header>
                          <div class="flex items-center gap-3 w-full">
                            <div 
                              class="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                              [style.backgroundColor]="category.color">
                              {{category.icon}}
                            </div>
                            <div class="flex-1">
                              <mat-card-title class="text-lg">{{category.name}}</mat-card-title>
                              <mat-card-subtitle>{{category.subcategories.length}} subcategories</mat-card-subtitle>
                            </div>
                            <button 
                              mat-icon-button 
                              [matMenuTriggerFor]="categoryMenu"
                              class="text-gray-400 hover:text-gray-600">
                              <mat-icon>more_vert</mat-icon>
                            </button>
                          </div>
                        </mat-card-header>
                        
                        <mat-card-content>
                          @if (category.description) {
                            <p class="text-gray-600 text-sm mb-4">{{category.description}}</p>
                          }
                          
                          <!-- Subcategories -->
                          @if (category.subcategories.length > 0) {
                            <div class="space-y-2">
                              <h4 class="text-sm font-medium text-gray-700">Subcategories:</h4>
                              <div class="flex flex-wrap gap-1">
                                @for (subcategory of category.subcategories.slice(0, 6); track subcategory.id) {
                                  <mat-chip class="text-xs">{{subcategory.name}}</mat-chip>
                                }
                                @if (category.subcategories.length > 6) {
                                  <mat-chip class="text-xs bg-gray-100">+{{category.subcategories.length - 6}} more</mat-chip>
                                }
                              </div>
                            </div>
                          }
                        </mat-card-content>
                        
                        <mat-card-actions class="flex justify-between">
                          <div class="flex items-center gap-2">
                            <span class="text-xs px-2 py-1 rounded-full"
                                  [class.bg-green-100]="category.isActive"
                                  [class.text-green-800]="category.isActive"
                                  [class.bg-red-100]="!category.isActive"
                                  [class.text-red-800]="!category.isActive">
                              {{category.isActive ? 'Active' : 'Inactive'}}
                            </span>
                          </div>
                          <div class="flex gap-2">
                            <button 
                              mat-icon-button 
                              color="primary"
                              (click)="editCategory(category)"
                              matTooltip="Edit category">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button 
                              mat-icon-button 
                              color="warn"
                              (click)="deleteCategory(category)"
                              matTooltip="Delete category">
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>
                        </mat-card-actions>
                        
                        <!-- Category Menu -->
                        <mat-menu #categoryMenu="matMenu">
                          <button mat-menu-item (click)="viewCategoryDetails(category)">
                            <mat-icon>visibility</mat-icon>
                            View Details
                          </button>
                          <button mat-menu-item (click)="editCategory(category)">
                            <mat-icon>edit</mat-icon>
                            Edit Category
                          </button>
                          <button mat-menu-item (click)="toggleCategoryStatus(category)">
                            <mat-icon>{{category.isActive ? 'visibility_off' : 'visibility'}}</mat-icon>
                            {{category.isActive ? 'Deactivate' : 'Activate'}}
                          </button>
                          <mat-divider></mat-divider>
                          <button mat-menu-item (click)="deleteCategory(category)" class="text-red-600">
                            <mat-icon>delete</mat-icon>
                            Delete Category
                          </button>
                        </mat-menu>
                      </mat-card>
                    }
                  </div>
                }
              </div>
            </ng-template>
          </mat-tab>

          <!-- Statistics Tab -->
          <mat-tab label="Statistics">
            <ng-template matTabContent>
              <div class="py-6">
                <div class="text-center py-12 bg-gray-50 rounded-2xl">
                  <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <mat-icon class="text-green-600 text-2xl">analytics</mat-icon>
                  </div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Category Statistics</h3>
                  <p class="text-gray-600">Detailed category usage statistics and insights will be available here.</p>
                </div>
              </div>
            </ng-template>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .categories-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }

    .category-tabs {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .category-card {
      transition: all 0.2s ease-in-out;
      border-radius: 12px !important;
      border: 1px solid #e5e7eb;
    }

    .category-card:hover {
      transform: translateY(-2px);
      border-color: #3b82f6;
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

    ::ng-deep .mat-mdc-card-header {
      padding: 16px 16px 0 16px !important;
    }

    ::ng-deep .mat-mdc-card-content {
      padding: 0 16px 16px 16px !important;
    }

    ::ng-deep .mat-mdc-card-actions {
      padding: 8px 16px 16px 16px !important;
    }

    @media (max-width: 768px) {
      .categories-container {
        .max-w-7xl {
          padding: 0 1rem;
        }
      }
      
      .grid {
        grid-template-columns: 1fr !important;
      }
    }
  `]
})
export class CategoryContainerComponent implements OnInit {
  readonly categoryService = inject(CategoryService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // Tab management
  readonly selectedTab = signal(1); // Default to "Manage Categories" tab

  // Form data - using regular properties instead of signals for form binding
  categoryFormData: CategoryForm = {
    name: '',
    description: '',
    icon: '📂',
    color: '#3B82F6',
    order: 0,
    isActive: true
  };

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.categoryService.getUserCategories().subscribe({
      next: (categories) => {
        console.log('Categories loaded:', categories.length);
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
      }
    });
  }

  protected addCategory(): void {
    console.log('addCategory - Form data:', this.categoryFormData);
    
    if (!this.categoryFormData.name.trim()) {
      this.snackBar.open('Please enter a category name', 'Close', { duration: 3000 });
      return;
    }

    // Set order based on current categories count
    const currentCount = this.categoryService.categories().length;
    console.log('addCategory - Current categories count:', currentCount);
    
    const categoryToAdd = {
      ...this.categoryFormData,
      order: currentCount
    };
    
    console.log('addCategory - About to call service with:', categoryToAdd);
    
    this.categoryService.addCategory(categoryToAdd).subscribe({
      next: (categoryId) => {
        console.log('addCategory - Success! Category ID:', categoryId);
        this.snackBar.open('Category added successfully!', 'Close', { duration: 3000 });
        this.resetForm();
        this.selectedTab.set(1); // Switch to manage tab
        this.loadCategories(); // Refresh categories
      },
      error: (error) => {
        console.error('addCategory - Failed to add category:', error);
        this.snackBar.open(`Failed to add category: ${error.message}`, 'Close', { duration: 5000 });
      }
    });
  }

  protected resetForm(): void {
    this.categoryFormData = {
      name: '',
      description: '',
      icon: '📂',
      color: '#3B82F6',
      order: 0,
      isActive: true
    };
  }

  protected editCategory(category: Category): void {
    const dialogRef = this.dialog.open(CategoryEditDialogComponent, {
      data: { category },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Category was updated successfully, refresh the list
        this.loadCategories();
      }
    });
  }

  protected deleteCategory(category: Category): void {
    if (confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.snackBar.open('Category deleted successfully', 'Close', { duration: 3000 });
          this.loadCategories(); // Refresh categories
        },
        error: (error) => {
          console.error('Failed to delete category:', error);
          this.snackBar.open('Failed to delete category', 'Close', { duration: 3000 });
        }
      });
    }
  }

  protected toggleCategoryStatus(category: Category): void {
    this.categoryService.updateCategory(category.id, { isActive: !category.isActive }).subscribe({
      next: () => {
        const status = !category.isActive ? 'activated' : 'deactivated';
        this.snackBar.open(`Category ${status} successfully`, 'Close', { duration: 3000 });
        this.loadCategories(); // Refresh categories
      },
      error: (error) => {
        console.error('Failed to update category status:', error);
        this.snackBar.open('Failed to update category', 'Close', { duration: 3000 });
      }
    });
  }

  protected viewCategoryDetails(category: Category): void {
    // TODO: Implement category details view
    console.log('View category details:', category);
    this.snackBar.open('Category details view coming soon!', 'Close', { duration: 3000 });
  }

  protected initializePredefinedCategories(): void {
    if (confirm('This will add predefined categories to your account. Continue?')) {
      this.categoryService.initializePredefinedCategories().subscribe({
        next: () => {
          this.snackBar.open('Predefined categories added successfully!', 'Close', { duration: 3000 });
          this.loadCategories(); // Refresh categories
        },
        error: (error) => {
          console.error('Failed to initialize predefined categories:', error);
          this.snackBar.open('Failed to initialize categories', 'Close', { duration: 3000 });
        }
      });
    }
  }
}