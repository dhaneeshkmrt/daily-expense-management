# Daily Expense Management App - Project Specification

## 📋 Overview
Digital expense management app replicating paper notebook workflow for Dhaneesh and Nisha's family expense tracking with advanced categorization, budget management, and reconciliation features.

## 👥 Users & Payment Methods

### **Users**
- **Dhaneesh (DK)**: Primary user, spends from personal allocation
- **Nisha**: Budget holder, manages overall monthly budget

### **Payment Methods**
- **DC**: Dhaneesh Cash
- **DD**: Dhaneesh Digital (bank/cards)
- **NC**: Nisha Cash  
- **ND**: Nisha Digital (bank/cards)

### **Budget Flow**
1. Nisha manages the overall monthly budget
2. Dhaneesh spends from his personal allocation
3. Monthly balance sheet reconciliation (last weekend of month)
4. Nisha calculates Dhaneesh's spending and settles with him

## 🏗️ Enhanced Data Structure

### **Three-Level Categorization**
```typescript
interface Category {
  id: string;
  name: string;
  monthlyBudget: number;
  accountBalance: number; // Category account for unused budget
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  parentCategoryId: string;
  microCategories: MicroCategory[];
}

interface MicroCategory {
  id: string;
  name: string;
  parentSubcategoryId: string;
  isRecurring: boolean; // Flag for recurring monthly expenses
}
```

### **Enhanced Expense Model**
```typescript
interface Expense {
  id: string;
  date: Date;
  categoryId: string;
  subcategoryId: string;
  microCategoryId?: string;
  amount: number;
  paidBy: 'dc' | 'dd' | 'nc' | 'nd'; // Payment method
  description: string;
  notes?: string;
  month: string; // Custom month period
  isRecurring: boolean;
}
```

### **Custom Monthly Period**
```typescript
interface MonthlyPeriod {
  id: string;
  startDate: Date; // Customizable month start
  endDate: Date;   // Customizable month end
  label: string;   // e.g., "Nov 2024", "Dec 1-31, 2024"
}
```

## 📊 Predefined Categories (from your CSV data)

### **Income**
- Monthly, Interest, Fruits, Food & Snack, Gift, Medical, Emergency, Home, Tour, Dk Exp, Dk Professional, Nisha, WFO

### **Monthly**
- **Subcategories**: Grocery, Petrol, Veg, Non-veg, Gas, Dk Appa, Nisha Amma, Milk, Egg, Anna Exp, Electricity, Others
- **Micro-categories** (recurring): Milk (recurring), Egg (recurring), Gas (recurring)

### **Fruits**
- **Subcategories**: Nuts, Fruits

### **Gift**
- **Subcategories**: Relatives, Close Relatives, Friends, Neighbour, Donation

### **Medical**
- **Subcategories**: Hospital Bill, Medical Bill, Lab test, Health Insurance, Others, Travel, Term Insurance, Pregnancy, Food

### **Tour**
- **Subcategories**: Travel, Stay, Food, Entry Fee, Shopping, Tips+Donation, Outing, Outing Food

### **Emergency**
- **Subcategories**: Home, Medical, Tour, Gift, Bike

### **Home**
- **Subcategories**: Electric, Land Maintenance, Plumbing, Construction, Utensils, Farm & Garden, Decoration

### **DK Professional**
- **Subcategories**: Subscriptions, Meetups, Shopping

### **Nisha**
- **Subcategories**: Investment, Mobile, Personal Grooming, Gift, Office, Borrow, Cash Rtn

### **DK**
- **Subcategories**: Investment, Mobile&Internet, Personal Grooming, Gift, Borrow, Subscriptions, Others, Office expense, Cash Rtn

### **WFO**
- **Subcategories**: Travel, Food, Home, Gift, Local Travel, Internet+ subscriptions, Sports, Monthly, DMart, Quick Commerce

### **Food & Snack**
- **Subcategories**: Food, Snacks

## 📅 Custom Monthly Period Feature

### **Flexible Month Definition**
- Default: 1st to last day of calendar month
- Custom: User-defined start/end dates (e.g., 25th to 24th)
- Balance sheet preparation: Last weekend of the period
- Budget reset: Beginning of each custom period

### **Period Management**
- Set custom monthly start/end dates in settings
- Historical period tracking
- Period-wise budget allocation and rollover

## 📤 CSV Export Feature

### **Export Format** (matching your current format)
```csv
Date,Cate,sub,Amount,Paid by,Desc,Notes
2-Nov-24,Monthly,Milk,₹600.00,nd,,
2-Nov-24,Monthly,Egg,₹100.00,nc,,
2-Nov-24,Monthly,Grocery,₹110.00,nc,,
```

### **Export Options**
- Current month expenses
- Custom date range
- Category-wise exports
- Annual subcategory reports (e.g., yearly petrol expenses)
- Balance sheet format for reconciliation

## 🔄 Enhanced Workflow

### **Daily Usage**
1. Quick expense entry with 3-level categorization
2. Payment method selection (DC/DD/NC/ND)
3. Auto-suggestions for recurring expenses
4. Real-time budget tracking

### **Monthly Reconciliation** 
1. Custom period-end balance sheet
2. Calculate Dhaneesh vs Nisha spending
3. Bank/cash balance matching
4. Category-wise budget vs actual
5. Unused budget transfer to category accounts
6. Settlement calculation between users

### **Budget Management**
- Transfer between categories when exceeded
- Category account utilization for future months
- Recurring expense automation
- Budget alerts and notifications

## 🎨 UI/UX Enhancements

### **Multi-User Interface**
- User selector for expense entry
- Payment method quick buttons (DC/DD/NC/ND)
- User-wise spending summary
- Settlement tracking dashboard

### **Advanced Categorization**
- Hierarchical category picker (Category → Sub → Micro)
- Recurring expense templates
- Smart suggestions based on history
- Quick entry for frequent combinations

### **Reconciliation Dashboard**
- Monthly balance sheet view
- User spending breakdown
- Bank/cash balance input
- Settlement calculations
- Export to CSV functionality

## 🚀 Updated Implementation Roadmap

### **Phase 1: Enhanced Foundation** (Week 1-2)
- Multi-user system (Dhaneesh & Nisha)
- 3-level categorization structure
- Payment method tracking
- Firebase setup with AngularFire

### **Phase 2: Custom Period & CSV** (Week 3-4)
- Customizable monthly periods
- CSV import/export functionality
- Predefined category structure setup
- Basic expense entry with all fields

### **Phase 3: Budget & Settlement** (Week 5-6)
- Budget management system
- Category accounts
- User settlement calculations
- Monthly reconciliation tools

### **Phase 4: Advanced Features** (Week 7-8)
- Recurring expense automation
- Balance sheet generation
- Advanced reporting and analytics
- Mobile-optimized interface

### **Phase 5: Polish & Optimization** (Week 9-10)
- Offline support
- Data backup/restore
- Performance optimization
- User experience refinements

## 🔧 Technical Considerations

### **Data Storage** (Firebase/Firestore)
- User management and permissions
- Hierarchical category structure
- Efficient querying for custom periods
- Real-time synchronization

### **CSV Integration**
- Parse existing CSV data for import
- Generate exports in exact format
- Data validation and migration tools
- Backup and restore functionality

### **Multi-User Architecture**
- User authentication and roles
- Shared expense tracking
- Settlement calculations
- Permission-based access

This enhanced specification incorporates all your suggestions and maintains compatibility with your existing CSV workflow while adding powerful digital features.