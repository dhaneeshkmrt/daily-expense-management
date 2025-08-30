import { Routes } from '@angular/router';
import { SettingsContainerComponent } from './components/settings-container/settings-container.component';

export const settingsRoutes: Routes = [
  {
    path: '',
    component: SettingsContainerComponent,
    title: 'Settings - Daily Expenses'
  }
];