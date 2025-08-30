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
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MonthlyPeriodService } from '../../../../core/services/monthly-period.service';
import { MonthlyPeriod, PeriodSettings } from '../../../../core/models/monthly-period.model';

@Component({
  selector: 'app-monthly-period-settings',
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
    MatListModule,
    MatChipsModule
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Monthly Period Settings</h2>
          <p class="text-gray-600 text-sm">Configure custom monthly periods for budget tracking</p>
        </div>
      </div>

      <!-- Current Period Info -->
      @if (periodService.currentPeriod(); as currentPeriod) {
        <mat-card class="p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-gray-900">Current Period</h3>
            <mat-chip color="primary">Active</mat-chip>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div class="text-sm text-gray-600">Period</div>
              <div class="font-medium">{{ currentPeriod.label }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">Start Date</div>
              <div class="font-medium">{{ formatDate(currentPeriod.startDate) }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">End Date</div>
              <div class="font-medium">{{ formatDate(currentPeriod.endDate) }}</div>
            </div>
          </div>
        </mat-card>
      }

      <!-- Settings Form -->
      <mat-card class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Period Configuration</h3>
        
        <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()" class="space-y-4">
          <div class="flex items-center mb-4">
            <mat-slide-toggle formControlName="isCustomPeriod" (change)="onCustomPeriodChange($event.checked)">
              Use Custom Monthly Period
            </mat-slide-toggle>
          </div>

          @if (isCustomPeriodEnabled()) {
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Month Start Day</mat-label>
              <mat-select formControlName="monthStartDay">
                @for (day of startDayOptions; track day.value) {
                  <mat-option [value]="day.value">{{ day.label }}</mat-option>
                }
              </mat-select>
              <mat-hint>
                Choose the day of the month when your budget period should start
              </mat-hint>
              <mat-error *ngIf="settingsForm.get('monthStartDay')?.hasError('required')">
                Start day is required
              </mat-error>
            </mat-form-field>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex items-start">
                <mat-icon class="text-blue-600 mt-1 mr-2">info</mat-icon>
                <div>
                  <h4 class="font-medium text-blue-900 mb-1">Custom Period Example</h4>
                  <p class="text-sm text-blue-700">
                    If you select day 25, your monthly period will run from the 25th of each month to the 24th of the following month.
                    This is useful if your salary comes on the 25th and you want to align your budget accordingly.
                  </p>
                </div>
              </div>
            </div>
          } @else {
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-start">
                <mat-icon class="text-green-600 mt-1 mr-2">calendar_month</mat-icon>
                <div>
                  <h4 class="font-medium text-green-900 mb-1">Calendar Month</h4>
                  <p class="text-sm text-green-700">
                    Your monthly period will follow the standard calendar month (1st to last day of each month).
                  </p>
                </div>
              </div>
            </div>
          }

          <div class="flex gap-3 pt-4">
            <button type="submit" mat-raised-button color="primary" 
                    [disabled]="settingsForm.invalid || periodService.loading()">
              @if (periodService.loading()) {
                <mat-spinner diameter="20" class="mr-2"></mat-spinner>
              }
              Save Settings
            </button>
            <button type="button" mat-stroked-button (click)="generateFuturePeriods()" 
                    [disabled]="periodService.loading()">
              @if (generatingPeriods()) {
                <mat-spinner diameter="16" class="mr-2"></mat-spinner>
              } @else {
                <mat-icon class="mr-2">auto_awesome</mat-icon>
              }
              Generate Future Periods
            </button>
          </div>
        </form>
      </mat-card>

      <!-- Period History -->
      @if (periodService.monthlyPeriods().length > 0) {
        <mat-card class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Period History</h3>
          
          <div class="space-y-3">
            @for (period of periodService.availablePeriods(); track period.id) {
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3">
                      <h4 class="font-medium">{{ period.label }}</h4>
                      @if (period.isActive) {
                        <mat-chip color="primary" class="text-xs">Current</mat-chip>
                      }
                    </div>
                    <div class="text-sm text-gray-500 mt-1">
                      {{ formatDate(period.startDate) }} - {{ formatDate(period.endDate) }}
                    </div>
                  </div>
                  
                  @if (!period.isActive) {
                    <div class="flex items-center gap-2">
                      <button mat-stroked-button (click)="setActivePeriod(period)" 
                              [disabled]="periodService.loading()">
                        <mat-icon class="mr-1">play_arrow</mat-icon>
                        Set Active
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </mat-card>
      }

      <!-- Empty State -->
      @if (periodService.monthlyPeriods().length === 0 && !periodService.loading()) {
        <mat-card class="p-8 text-center">
          <mat-icon class="text-6xl text-gray-300 mb-4">calendar_today</mat-icon>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No Periods Found</h3>
          <p class="text-gray-600 mb-4">Configure your first monthly period to get started.</p>
          <button mat-raised-button color="primary" (click)="initializePeriods()">
            Initialize Periods
          </button>
        </mat-card>
      }
    </div>
  `
})
export class MonthlyPeriodSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly periodService = inject(MonthlyPeriodService);
  private readonly snackBar = inject(MatSnackBar);

  // Signals
  readonly generatingPeriods = signal<boolean>(false);
  
  // Computed values
  readonly isCustomPeriodEnabled = computed(() => 
    this.settingsForm.get('isCustomPeriod')?.value || false
  );

  // Form
  readonly settingsForm = this.fb.nonNullable.group({
    isCustomPeriod: [false],
    monthStartDay: [1, [Validators.required, Validators.min(1), Validators.max(28)]]
  });

  // Start day options
  readonly startDayOptions = Array.from({ length: 28 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}${this.getOrdinalSuffix(i + 1)} of each month`
  }));

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    // Load period settings
    this.periodService.getUserPeriodSettings().subscribe({
      next: (settings) => {
        if (settings) {
          this.settingsForm.patchValue({
            isCustomPeriod: settings.isCustomPeriod,
            monthStartDay: settings.monthStartDay
          });
        }
      },
      error: (error) => console.error('Failed to load period settings:', error)
    });

    // Load monthly periods
    this.periodService.getUserMonthlyPeriods().subscribe({
      next: (periods) => {
        console.log('Loaded periods:', periods.length);
      },
      error: (error) => console.error('Failed to load monthly periods:', error)
    });
  }

  protected onCustomPeriodChange(isCustom: boolean): void {
    if (!isCustom) {
      this.settingsForm.patchValue({ monthStartDay: 1 });
    }
  }

  protected saveSettings(): void {
    if (this.settingsForm.valid) {
      const formData = this.settingsForm.value;
      const currentSettings = this.periodService.periodSettings();
      
      if (currentSettings) {
        // Update existing settings
        this.periodService.updatePeriodSettings(currentSettings.id, {
          isCustomPeriod: formData.isCustomPeriod || false,
          monthStartDay: formData.monthStartDay || 1
        }).subscribe({
          next: () => {
            this.snackBar.open('Period settings updated successfully', 'Close', { duration: 3000 });
            this.loadData();
          },
          error: (error) => {
            console.error('Failed to update period settings:', error);
            this.snackBar.open('Failed to update period settings', 'Close', { duration: 5000 });
          }
        });
      } else {
        // Initialize new settings
        this.periodService.initializePeriodSettings(formData.monthStartDay || 1).subscribe({
          next: () => {
            this.snackBar.open('Period settings initialized successfully', 'Close', { duration: 3000 });
            this.loadData();
          },
          error: (error) => {
            console.error('Failed to initialize period settings:', error);
            this.snackBar.open('Failed to initialize period settings', 'Close', { duration: 5000 });
          }
        });
      }
    }
  }

  protected generateFuturePeriods(): void {
    this.generatingPeriods.set(true);
    this.periodService.generateFuturePeriods(12).subscribe({
      next: (periodIds) => {
        this.generatingPeriods.set(false);
        this.snackBar.open(`Generated ${periodIds.length} future periods`, 'Close', { duration: 3000 });
        this.loadData();
      },
      error: (error) => {
        console.error('Failed to generate future periods:', error);
        this.generatingPeriods.set(false);
        this.snackBar.open('Failed to generate future periods', 'Close', { duration: 5000 });
      }
    });
  }

  protected setActivePeriod(period: MonthlyPeriod): void {
    this.periodService.setActivePeriod(period.id).subscribe({
      next: () => {
        this.snackBar.open(`Set "${period.label}" as active period`, 'Close', { duration: 3000 });
        this.loadData();
      },
      error: (error) => {
        console.error('Failed to set active period:', error);
        this.snackBar.open('Failed to set active period', 'Close', { duration: 5000 });
      }
    });
  }

  protected initializePeriods(): void {
    const startDay = this.settingsForm.get('monthStartDay')?.value || 1;
    this.periodService.initializePeriodSettings(startDay).subscribe({
      next: () => {
        this.snackBar.open('Periods initialized successfully', 'Close', { duration: 3000 });
        this.loadData();
      },
      error: (error) => {
        console.error('Failed to initialize periods:', error);
        this.snackBar.open('Failed to initialize periods', 'Close', { duration: 5000 });
      }
    });
  }

  protected formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return date.toLocaleDateString();
  }

  private getOrdinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) {
      return 'th';
    }
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
}