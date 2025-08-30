import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { CsvExportComponent } from '../csv-export/csv-export.component';

@Component({
  selector: 'app-report-container',
  imports: [
    CommonModule,
    MatTabsModule,
    CsvExportComponent
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p class="text-gray-600">Export data and analyze your spending patterns</p>
        </div>

        <!-- Tabs -->
        <mat-tab-group class="bg-white rounded-lg shadow-lg" animationDuration="200ms">
          <mat-tab label="CSV Export/Import">
            <div class="p-6">
              <app-csv-export></app-csv-export>
            </div>
          </mat-tab>
          
          <mat-tab label="Spending Analysis" [disabled]="true">
            <div class="p-8 text-center text-gray-500">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-2xl">📈</span>
              </div>
              <h3 class="text-lg font-medium mb-2">Spending Analysis</h3>
              <p class="mb-4">Visual charts and spending patterns analysis</p>
              <p class="text-sm">Coming in the next phase</p>
            </div>
          </mat-tab>
          
          <mat-tab label="Category Reports" [disabled]="true">
            <div class="p-8 text-center text-gray-500">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-2xl">🏷️</span>
              </div>
              <h3 class="text-lg font-medium mb-2">Category Reports</h3>
              <p class="mb-4">Detailed category-wise expense breakdown</p>
              <p class="text-sm">Coming in the next phase</p>
            </div>
          </mat-tab>
          
          <mat-tab label="Budget Performance" [disabled]="true">
            <div class="p-8 text-center text-gray-500">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-2xl">🎯</span>
              </div>
              <h3 class="text-lg font-medium mb-2">Budget Performance</h3>
              <p class="mb-4">Track budget adherence and performance metrics</p>
              <p class="text-sm">Coming in the next phase</p>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `
})
export class ReportContainerComponent {}