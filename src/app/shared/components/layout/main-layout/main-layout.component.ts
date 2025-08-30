import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MobileNavComponent } from '../mobile-nav/mobile-nav.component';

@Component({
  selector: 'app-main-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    MobileNavComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Mobile Navigation -->
      <app-mobile-nav 
        [isOpen]="mobileNavOpen()"
        (toggleNav)="toggleMobileNav()"
        (closeNav)="closeMobileNav()">
      </app-mobile-nav>
      
      <!-- Desktop Layout -->
      <div class="hidden md:flex h-screen">
        <!-- Sidebar -->
        <app-sidebar class="w-80 flex-shrink-0"></app-sidebar>
        
        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <app-header></app-header>
          
          <main class="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>
      
      <!-- Mobile Layout -->
      <div class="md:hidden">
        <!-- Mobile Header -->
        <app-header 
          [showMenuButton]="true"
          (menuClick)="toggleMobileNav()">
        </app-header>
        
        <!-- Mobile Content -->
        <main class="pt-16 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  protected readonly mobileNavOpen = signal(false);
  
  protected toggleMobileNav(): void {
    this.mobileNavOpen.update(open => !open);
  }
  
  protected closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }
}