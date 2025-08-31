import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryHierarchyManagerComponent } from '../category-hierarchy-manager/category-hierarchy-manager.component';

@Component({
  selector: 'app-category-container',
  imports: [
    CommonModule,
    CategoryHierarchyManagerComponent
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Categories</h1>
          <p class="text-gray-600">Organize and manage your expense categories with 3-level hierarchy</p>
        </div>

        <!-- Category Management Component -->
        <app-category-hierarchy-manager></app-category-hierarchy-manager>
      </div>
    </div>
  `
})
export class CategoryContainerComponent {}