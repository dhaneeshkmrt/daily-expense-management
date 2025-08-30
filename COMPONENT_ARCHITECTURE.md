# Component Architecture - Daily Expense Management

## 📁 Folder Structure

```
src/app/
├── core/                     # Core singleton services, guards, interceptors
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   └── storage.service.ts
│   ├── guards/
│   │   └── auth.guard.ts
│   └── models/
│       ├── user.model.ts
│       ├── expense.model.ts
│       ├── category.model.ts
│       └── budget.model.ts
│
├── shared/                   # Shared components, pipes, directives
│   ├── components/
│   │   ├── ui/              # Pure UI components
│   │   │   ├── button/
│   │   │   ├── card/
│   │   │   ├── modal/
│   │   │   ├── loading/
│   │   │   └── confirmation-dialog/
│   │   ├── layout/          # Layout components
│   │   │   ├── header/
│   │   │   ├── sidebar/
│   │   │   ├── main-layout/
│   │   │   └── mobile-nav/
│   │   └── forms/           # Form components
│   │       ├── amount-input/
│   │       ├── category-selector/
│   │       ├── date-picker/
│   │       └── payment-method-selector/
│   ├── pipes/
│   │   ├── currency.pipe.ts
│   │   ├── date-format.pipe.ts
│   │   └── percentage.pipe.ts
│   └── directives/
│       └── click-outside.directive.ts
│
├── features/                 # Feature modules (lazy-loaded)
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── dashboard-container/
│   │   │   ├── quick-stats/
│   │   │   ├── budget-overview/
│   │   │   ├── recent-expenses/
│   │   │   ├── payment-methods/
│   │   │   └── quick-actions/
│   │   ├── services/
│   │   │   └── dashboard.service.ts
│   │   └── dashboard.routes.ts
│   │
│   ├── expenses/
│   │   ├── components/
│   │   │   ├── expense-list/
│   │   │   ├── expense-form/
│   │   │   ├── expense-item/
│   │   │   ├── expense-filter/
│   │   │   └── quick-add-expense/
│   │   ├── services/
│   │   │   └── expense.service.ts
│   │   └── expenses.routes.ts
│   │
│   ├── categories/
│   │   ├── components/
│   │   │   ├── category-list/
│   │   │   ├── category-form/
│   │   │   ├── category-tree/
│   │   │   ├── subcategory-manager/
│   │   │   └── micro-category-manager/
│   │   ├── services/
│   │   │   └── category.service.ts
│   │   └── categories.routes.ts
│   │
│   ├── budgets/
│   │   ├── components/
│   │   │   ├── budget-list/
│   │   │   ├── budget-form/
│   │   │   ├── budget-transfer/
│   │   │   ├── category-accounts/
│   │   │   └── budget-alerts/
│   │   ├── services/
│   │   │   └── budget.service.ts
│   │   └── budgets.routes.ts
│   │
│   ├── reports/
│   │   ├── components/
│   │   │   ├── monthly-report/
│   │   │   ├── category-report/
│   │   │   ├── annual-subcategory-report/
│   │   │   ├── user-spending-report/
│   │   │   └── export-options/
│   │   ├── services/
│   │   │   └── report.service.ts
│   │   └── reports.routes.ts
│   │
│   ├── reconciliation/
│   │   ├── components/
│   │   │   ├── balance-sheet/
│   │   │   ├── user-settlement/
│   │   │   ├── bank-balance-input/
│   │   │   ├── reconciliation-summary/
│   │   │   └── monthly-period-selector/
│   │   ├── services/
│   │   │   └── reconciliation.service.ts
│   │   └── reconciliation.routes.ts
│   │
│   └── settings/
│       ├── components/
│       │   ├── user-profile/
│       │   ├── monthly-period-settings/
│       │   ├── category-settings/
│       │   ├── notification-settings/
│       │   └── data-management/
│       ├── services/
│       │   └── settings.service.ts
│       └── settings.routes.ts
│
└── app.component.ts          # Root component
└── app.routes.ts            # Main routing
└── app.config.ts            # App configuration
```

## 🏗️ Component Hierarchy & Responsibilities

### **1. Core Layer**
- **Services**: Authentication, user management, data persistence
- **Models**: TypeScript interfaces and types
- **Guards**: Route protection and navigation logic

### **2. Shared Layer**
- **UI Components**: Reusable, pure components (buttons, cards, modals)
- **Layout Components**: Navigation, headers, sidebars
- **Form Components**: Specialized form controls
- **Pipes & Directives**: Common utilities

### **3. Feature Layer**
Each feature module follows the same pattern:
- **Container Components**: Smart components that manage state
- **Presentation Components**: Dumb components that display data
- **Services**: Feature-specific business logic
- **Routes**: Feature routing configuration

## 🎯 Component Types & Patterns

### **Smart vs Dumb Components**

#### Smart Components (Containers)
- Manage state and business logic
- Make API calls and handle data
- Pass data down to dumb components
- Handle user interactions that affect state

Example: `ExpenseListContainerComponent`

#### Dumb Components (Presentational)
- Only receive data via inputs
- Emit events via outputs
- Pure functions of their inputs
- No side effects or API calls

Example: `ExpenseItemComponent`

### **Component Communication Patterns** (Following Angular Style Guide)

1. **Parent → Child**: Use `input()` function (preferred) over `@Input()` decorator
2. **Child → Parent**: Use `output()` function (preferred) over `@Output()` decorator  
3. **Service Communication**: Shared services with signals and `inject()` function
4. **State Management**: Angular signals for reactive state

### **Angular Style Guide Compliance**

- **Use `input()` and `output()` functions** instead of decorators for new components
- **Use `inject()` function** instead of constructor parameter injection
- **Use `protected`** for class members only used by component templates
- **Use `readonly`** for properties initialized by Angular (inputs, outputs, queries)
- **Group Angular-specific properties** (inputs, outputs, queries) before methods
- **Keep components focused on presentation** - business logic goes in services
- **Use `@if`, `@for`, `@switch`** control flow blocks instead of structural directives
- **Prefer `class` and `style` bindings** over `ngClass` and `ngStyle`
- **Name event handlers for what they do**, not the triggering event

## 🔄 Data Flow Architecture

```
User Interaction
       ↓
Smart Component
       ↓
Service Layer
       ↓
API/Storage
       ↓
Update Signals
       ↓
Reactive Updates
       ↓
Dumb Components
       ↓
UI Updates
```

## 📱 Responsive Design Strategy

### **Mobile-First Components**
- All components designed for mobile first
- Progressive enhancement for larger screens
- Touch-friendly interactions
- Optimized for thumb navigation

### **Breakpoint Strategy**
- `sm`: 640px (small phones)
- `md`: 768px (tablets)
- `lg`: 1024px (laptops)
- `xl`: 1280px (desktops)

## 🎨 Styling Strategy

### **Tailwind + Angular Material**
- Tailwind for layout, spacing, colors
- Angular Material for complex components (date picker, select)
- CSS Grid and Flexbox for layouts
- Custom CSS variables for theming

### **Component Styling**
```scss
// Component-specific styles in .scss files
// Global styles in styles.scss
// Tailwind utilities for most styling
```

## 🔧 Development Patterns

### **Signal-Based Architecture**
```typescript
// Services use signals for reactive state
readonly expenses = signal<Expense[]>([]);
readonly loading = signal<boolean>(false);
readonly error = signal<string | null>(null);

// Components consume signals reactively
readonly totalSpent = computed(() => 
  this.expenses().reduce((sum, expense) => sum + expense.amount, 0)
);
```

### **Dependency Injection**
```typescript
// Use inject() function instead of constructor injection
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
}
```

### **Component Structure**
```typescript
@Component({
  // Standalone components with explicit imports
  imports: [CommonModule, MatButtonModule, ...],
  // Signal-based reactive programming
  // Protected properties for template access
  // Computed values for derived state
})
```

## 🚀 Implementation Priority

### **Phase 1: Core Infrastructure**
1. Shared components and layout
2. Core services and models
3. Basic routing structure

### **Phase 2: Dashboard & Expenses**
1. Dashboard feature module
2. Expense management features
3. Quick add functionality

### **Phase 3: Categories & Budgets**
1. Category management
2. Budget tracking and alerts
3. Category accounts

### **Phase 4: Reports & Reconciliation**
1. Reporting features
2. Balance sheet functionality
3. CSV export/import

### **Phase 5: Settings & Polish**
1. User preferences
2. Data management
3. Performance optimization

This architecture ensures:
- **Scalability**: Easy to add new features
- **Maintainability**: Clear separation of concerns
- **Testability**: Pure functions and dependency injection
- **Performance**: Lazy loading and signals
- **User Experience**: Mobile-first responsive design