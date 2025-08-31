import { NgModule } from '@angular/core';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { BudgetEditDialogComponent } from './components/budget-edit-dialog/budget-edit-dialog.component';

@NgModule({
  imports: [
    ConfirmationDialogComponent,
    BudgetEditDialogComponent
  ],
  exports: [
    ConfirmationDialogComponent,
    BudgetEditDialogComponent
  ]
})
export class SharedModule {}