import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-container',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">📂</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Categories</h1>
          <p class="text-gray-600 mb-4">Manage your expense categories</p>
          <p class="text-sm text-gray-500">Feature will be implemented in the next phase.</p>
        </div>
      </div>
    </div>
  `
})
export class CategoryContainerComponent {}