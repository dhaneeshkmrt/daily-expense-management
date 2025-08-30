import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainLayoutComponent } from './shared/components/layout/main-layout/main-layout.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainLayoutComponent],
  template: `<app-main-layout></app-main-layout>`,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('daily-expense-management');
}
