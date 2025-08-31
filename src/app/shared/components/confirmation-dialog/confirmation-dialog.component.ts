import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

@Component({
  selector: 'app-confirmation-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirmation-dialog">
      <div class="dialog-header flex items-center gap-3 p-6 pb-4">
        <mat-icon [class]="getIconClass()">{{ getIcon() }}</mat-icon>
        <h2 mat-dialog-title class="text-xl font-semibold m-0">{{ data.title }}</h2>
      </div>

      <mat-dialog-content class="px-6 pb-4">
        <p class="text-gray-700 leading-relaxed">{{ data.message }}</p>
      </mat-dialog-content>

      <mat-dialog-actions class="flex justify-end gap-3 p-6 pt-4 bg-gray-50">
        <button mat-stroked-button (click)="onCancel()" class="min-w-[80px]">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button mat-flat-button 
                [color]="getButtonColor()" 
                (click)="onConfirm()" 
                class="min-w-[80px]">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      min-width: 400px;
      max-width: 500px;
    }
    
    .dialog-header {
      border-bottom: 1px solid #e5e7eb;
    }
    
    mat-dialog-actions {
      border-top: 1px solid #e5e7eb;
      margin: 0;
    }
  `]
})
export class ConfirmationDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmationDialogComponent>);
  readonly data = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  getIcon(): string {
    switch (this.data.type) {
      case 'warning': return 'warning';
      case 'danger': return 'error';
      case 'info': return 'info';
      default: return 'help';
    }
  }

  getIconClass(): string {
    switch (this.data.type) {
      case 'warning': return 'text-amber-500';
      case 'danger': return 'text-red-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  }

  getButtonColor(): string {
    switch (this.data.type) {
      case 'danger': return 'warn';
      case 'warning': return 'accent';
      default: return 'primary';
    }
  }
}