import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { CsvService, CSVExportOptions } from '../../../../core/services/csv.service';
import { CategoryService } from '../../../../core/services/category.service';
import { BudgetService } from '../../../../core/services/budget.service';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-csv-export',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="p-6">
      <mat-card-header class="pb-4">
        <mat-card-title class="flex items-center gap-2">
          <mat-icon class="text-green-600">file_download</mat-icon>
          Export Data to CSV
        </mat-card-title>
        <mat-card-subtitle>
          Export your expenses and budgets in CSV format for analysis or backup
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <form [formGroup]="exportForm" class="space-y-6">
          <!-- Export Format -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-3">Export Format</h3>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Format Type</mat-label>
              <mat-select formControlName="format">
                <mat-option value="standard">
                  <div class="py-1">
                    <div class="font-medium">Standard Format</div>
                    <div class="text-sm text-gray-500">Date, Category, Subcategory, Amount, Payment, Description, Notes</div>
                  </div>
                </mat-option>
                <mat-option value="detailed">
                  <div class="py-1">
                    <div class="font-medium">Detailed Format</div>
                    <div class="text-sm text-gray-500">Includes all fields with timestamps and user info</div>
                  </div>
                </mat-option>
                <mat-option value="budget_report">
                  <div class="py-1">
                    <div class="font-medium">Budget Report</div>
                    <div class="text-sm text-gray-500">Budget vs actual spending analysis</div>
                  </div>
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Date Range Selection -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-3">Date Range</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Range Type</mat-label>
                <mat-select formControlName="rangeType" (selectionChange)="onRangeTypeChange($event.value)">
                  <mat-option value="current_month">Current Month</mat-option>
                  <mat-option value="last_month">Last Month</mat-option>
                  <mat-option value="current_year">Current Year</mat-option>
                  <mat-option value="custom">Custom Range</mat-option>
                  <mat-option value="specific_month">Specific Month</mat-option>
                </mat-select>
              </mat-form-field>

              @if (exportForm.get('rangeType')?.value === 'specific_month') {
                <mat-form-field appearance="outline">
                  <mat-label>Month</mat-label>
                  <mat-select formControlName="monthPeriod">
                    @for (month of availableMonths(); track month.value) {
                      <mat-option [value]="month.value">{{ month.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              }

              @if (exportForm.get('rangeType')?.value === 'custom') {
                <mat-form-field appearance="outline">
                  <mat-label>Start Date</mat-label>
                  <input matInput [matDatepicker]="startPicker" formControlName="startDate" placeholder="Start date">
                  <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                  <mat-datepicker #startPicker></mat-datepicker>
                </mat-form-field>
              }

              @if (exportForm.get('rangeType')?.value === 'custom') {
                <mat-form-field appearance="outline">
                  <mat-label>End Date</mat-label>
                  <input matInput [matDatepicker]="endPicker" formControlName="endDate" placeholder="End date">
                  <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                  <mat-datepicker #endPicker></mat-datepicker>
                </mat-form-field>
              }
            </div>
          </div>

          <!-- Category Filter -->
          @if (exportForm.get('format')?.value !== 'budget_report') {
            <div>
              <h3 class="text-lg font-medium text-gray-900 mb-3">Category Filter</h3>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Categories (Optional)</mat-label>
                <mat-select formControlName="categoryIds" multiple>
                  <mat-option value="">All Categories</mat-option>
                  @for (category of categories(); track category.id) {
                    <mat-option [value]="category.id">
                      <span class="flex items-center gap-2">
                        <span>{{ category.icon }}</span>
                        {{ category.name }}
                      </span>
                    </mat-option>
                  }
                </mat-select>
                <mat-hint>Leave empty to include all categories</mat-hint>
              </mat-form-field>
            </div>
          }

          <!-- Additional Options -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-3">Additional Options</h3>
            <div class="space-y-2">
              @if (exportForm.get('format')?.value !== 'budget_report') {
                <mat-checkbox formControlName="includeNotes">
                  Include notes in export
                </mat-checkbox>
              }
            </div>
          </div>

          <!-- Export Summary -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 class="font-medium text-blue-900 mb-2">Export Summary</h4>
            <div class="text-sm text-blue-800 space-y-1">
              <div>Format: <strong>{{ getFormatLabel() }}</strong></div>
              <div>Date Range: <strong>{{ getDateRangeLabel() }}</strong></div>
              <div>Categories: <strong>{{ getCategoryFilterLabel() }}</strong></div>
              <div>Filename: <strong>{{ getPreviewFilename() }}</strong></div>
            </div>
          </div>
        </form>
      </mat-card-content>

      <mat-card-actions class="flex gap-3 pt-4">
        <button
          mat-raised-button
          color="primary"
          (click)="exportData()"
          [disabled]="exportForm.invalid || loading()"
          class="flex-1 md:flex-none">
          @if (loading()) {
            <mat-spinner diameter="20" class="mr-2"></mat-spinner>
          } @else {
            <mat-icon class="mr-2">file_download</mat-icon>
          }
          Export CSV
        </button>

        <button
          mat-stroked-button
          (click)="resetForm()"
          [disabled]="loading()"
          class="flex-1 md:flex-none">
          <mat-icon class="mr-2">refresh</mat-icon>
          Reset
        </button>
      </mat-card-actions>
    </mat-card>

    <!-- Import Section -->
    <mat-card class="p-6 mt-6">
      <mat-card-header class="pb-4">
        <mat-card-title class="flex items-center gap-2">
          <mat-icon class="text-blue-600">file_upload</mat-icon>
          Import Data from CSV
        </mat-card-title>
        <mat-card-subtitle>
          Import expenses from a CSV file (supports standard format)
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="space-y-4">
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
               (click)="fileInput.click()"
               (dragover)="onDragOver($event)"
               (drop)="onDrop($event)">
            <mat-icon class="text-4xl text-gray-400 mb-2">cloud_upload</mat-icon>
            <p class="text-gray-600 mb-2">Click to select CSV file or drag and drop</p>
            <p class="text-sm text-gray-500">Supports .csv files up to 10MB</p>
            <input
              #fileInput
              type="file"
              accept=".csv"
              (change)="onFileSelected($event)"
              class="hidden">
          </div>

          @if (selectedFile()) {
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-green-600">description</mat-icon>
                  <span class="font-medium">{{ selectedFile()!.name }}</span>
                  <span class="text-sm text-gray-500">({{ formatFileSize(selectedFile()!.size) }})</span>
                </div>
                <button mat-icon-button (click)="clearSelectedFile()" color="warn">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      </mat-card-content>

      <mat-card-actions class="flex gap-3 pt-4">
        <button
          mat-raised-button
          color="primary"
          (click)="importData()"
          [disabled]="!selectedFile() || importing()"
          class="flex-1 md:flex-none">
          @if (importing()) {
            <mat-spinner diameter="20" class="mr-2"></mat-spinner>
          } @else {
            <mat-icon class="mr-2">file_upload</mat-icon>
          }
          Import CSV
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .drag-over {
      border-color: #3B82F6 !important;
      background-color: #EBF8FF;
    }
  `]
})
export class CsvExportComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly csvService = inject(CsvService);
  private readonly categoryService = inject(CategoryService);
  private readonly budgetService = inject(BudgetService);
  private readonly snackBar = inject(MatSnackBar);

  // Signals
  readonly categories = signal<Category[]>([]);
  readonly loading = signal<boolean>(false);
  readonly importing = signal<boolean>(false);
  readonly selectedFile = signal<File | null>(null);

  // Form
  readonly exportForm = this.fb.nonNullable.group({
    format: ['standard' as 'standard' | 'detailed' | 'budget_report', [Validators.required]],
    rangeType: ['current_month', [Validators.required]],
    monthPeriod: [this.budgetService.getCurrentMonthPeriod()],
    startDate: [new Date()],
    endDate: [new Date()],
    categoryIds: [[] as string[]],
    includeNotes: [true]
  });

  // Computed values
  readonly availableMonths = computed(() => {
    const current = new Date();
    const months = [];
    for (let i = -12; i <= 3; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() + i, 1);
      const monthPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({ value: monthPeriod, label });
    }
    return months;
  });

  ngOnInit(): void {
    this.loadCategories();
    this.initializeDateRange();
  }

  private loadCategories(): void {
    this.categoryService.getUserCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (error) => console.error('Failed to load categories:', error)
    });
  }

  private initializeDateRange(): void {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    this.exportForm.patchValue({
      startDate: startOfMonth,
      endDate: endOfMonth
    });
  }

  protected onRangeTypeChange(rangeType: string): void {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let monthPeriod: string;

    switch (rangeType) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        monthPeriod = this.budgetService.getCurrentMonthPeriod();
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        monthPeriod = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'current_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        monthPeriod = '';
        break;
      default:
        return; // Don't update for custom or specific_month
    }

    this.exportForm.patchValue({
      startDate,
      endDate,
      monthPeriod
    });
  }

  protected exportData(): void {
    if (this.exportForm.valid) {
      this.loading.set(true);
      const formValues = this.exportForm.value;
      
      const options: CSVExportOptions = {
        format: formValues.format!,
        includeNotes: formValues.includeNotes,
        currency: '₹'
      };

      // Set date range or month period
      if (formValues.rangeType === 'custom') {
        options.dateRange = {
          startDate: formValues.startDate!,
          endDate: formValues.endDate!
        };
      } else if (formValues.rangeType === 'specific_month' || formValues.rangeType !== 'current_year') {
        options.monthPeriod = formValues.monthPeriod!;
      }

      // Set category filter
      if (formValues.categoryIds && formValues.categoryIds.length > 0) {
        options.categoryIds = formValues.categoryIds;
      }

      this.csvService.exportExpenses(options).subscribe({
        next: (csvContent) => {
          const filename = this.csvService.generateFilename(options);
          this.csvService.downloadCSV(csvContent, filename);
          this.loading.set(false);
          this.snackBar.open('CSV exported successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Failed to export CSV:', error);
          this.loading.set(false);
          this.snackBar.open('Failed to export CSV', 'Close', { duration: 5000 });
        }
      });
    }
  }

  protected resetForm(): void {
    this.exportForm.reset({
      format: 'standard',
      rangeType: 'current_month',
      monthPeriod: this.budgetService.getCurrentMonthPeriod(),
      categoryIds: [],
      includeNotes: true
    });
    this.initializeDateRange();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.handleFileSelection(file);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.handleFileSelection(file);
    }
  }

  private handleFileSelection(file: File): void {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      this.snackBar.open('Please select a CSV file', 'Close', { duration: 3000 });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      this.snackBar.open('File size must be less than 10MB', 'Close', { duration: 3000 });
      return;
    }

    this.selectedFile.set(file);
  }

  protected clearSelectedFile(): void {
    this.selectedFile.set(null);
  }

  protected importData(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.importing.set(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      this.csvService.importExpenses(csvContent).subscribe({
        next: (importedIds) => {
          this.importing.set(false);
          this.selectedFile.set(null);
          this.snackBar.open(`Successfully imported ${importedIds.length} expenses`, 'Close', { duration: 5000 });
        },
        error: (error) => {
          console.error('Failed to import CSV:', error);
          this.importing.set(false);
          this.snackBar.open('Failed to import CSV. Please check the file format.', 'Close', { duration: 5000 });
        }
      });
    };

    reader.onerror = () => {
      this.importing.set(false);
      this.snackBar.open('Failed to read the file', 'Close', { duration: 3000 });
    };

    reader.readAsText(file);
  }

  protected formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // Helper methods for summary display
  protected getFormatLabel(): string {
    const format = this.exportForm.get('format')?.value;
    switch (format) {
      case 'detailed': return 'Detailed Format';
      case 'budget_report': return 'Budget Report';
      default: return 'Standard Format';
    }
  }

  protected getDateRangeLabel(): string {
    const rangeType = this.exportForm.get('rangeType')?.value;
    switch (rangeType) {
      case 'current_month': return 'Current Month';
      case 'last_month': return 'Last Month';
      case 'current_year': return 'Current Year';
      case 'specific_month':
        const monthPeriod = this.exportForm.get('monthPeriod')?.value;
        const month = this.availableMonths().find(m => m.value === monthPeriod);
        return month?.label || 'Unknown Month';
      case 'custom':
        const startDate = this.exportForm.get('startDate')?.value;
        const endDate = this.exportForm.get('endDate')?.value;
        return `${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}`;
      default: return 'Unknown Range';
    }
  }

  protected getCategoryFilterLabel(): string {
    const categoryIds = this.exportForm.get('categoryIds')?.value;
    if (!categoryIds || categoryIds.length === 0) {
      return 'All Categories';
    }
    return `${categoryIds.length} Selected`;
  }

  protected getPreviewFilename(): string {
    const formValues = this.exportForm.value;
    const options: CSVExportOptions = {
      format: formValues.format!,
      monthPeriod: formValues.rangeType === 'specific_month' ? formValues.monthPeriod! : undefined,
      dateRange: formValues.rangeType === 'custom' ? {
        startDate: formValues.startDate!,
        endDate: formValues.endDate!
      } : undefined
    };
    
    return this.csvService.generateFilename(options);
  }
}