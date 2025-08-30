export interface Category {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
  subcategories: Subcategory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subcategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  order: number;
  isActive: boolean;
  microCategories: MicroCategory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MicroCategory {
  id: string;
  name: string;
  description?: string;
  subcategoryId: string;
  isRecurring: boolean;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryHierarchy {
  category: Category;
  subcategory: Subcategory;
  microCategory?: MicroCategory;
}

export interface CategoryStats {
  categoryId: string;
  totalSpent: number;
  expenseCount: number;
  lastExpenseDate?: Date;
  averageExpense: number;
  monthlyTrend: number; // Percentage change from last month
}

// Predefined categories from CSV data
export const PREDEFINED_CATEGORIES = {
  INCOME: {
    name: 'Income',
    subcategories: ['Monthly', 'Interest', 'Fruits', 'Food & Snack', 'Gift', 'Medical', 'Emergency', 'Home', 'Tour', 'Dk Exp', 'Dk Professional', 'Nisha', 'WFO']
  },
  MONTHLY: {
    name: 'Monthly',
    subcategories: ['Grocery', 'Petrol', 'Veg', 'Non-veg', 'Gas', 'Dk Appa', 'Nisha Amma', 'Milk', 'Egg', 'Anna Exp', 'Electricity', 'Others']
  },
  FRUITS: {
    name: 'Fruits',
    subcategories: ['Nuts', 'Fruits']
  },
  GIFT: {
    name: 'Gift',
    subcategories: ['Relatives', 'Close Relatives', 'Friends', 'Neighbour', 'Donation']
  },
  MEDICAL: {
    name: 'Medical',
    subcategories: ['Hospital Bill', 'Medical Bill', 'Lab test', 'Health Insurance', 'Others', 'Travel', 'Term Insurance', 'Pregnancy', 'Food']
  },
  TOUR: {
    name: 'Tour',
    subcategories: ['Travel', 'Stay', 'Food', 'Entry Fee', 'Shopping', 'Tips+Donation', 'Outing', 'Outing Food']
  },
  EMERGENCY: {
    name: 'Emergency',
    subcategories: ['Home', 'Medical', 'Tour', 'Gift', 'Bike']
  },
  HOME: {
    name: 'Home',
    subcategories: ['Electric', 'Land Maintenance', 'Plumbing', 'Construction', 'Utensils', 'Farm & Garden', 'Decoration']
  },
  DK_PROFESSIONAL: {
    name: 'DK Professional',
    subcategories: ['Subscriptions', 'Meetups', 'Shopping']
  },
  NISHA: {
    name: 'Nisha',
    subcategories: ['Investment', 'Mobile', 'Personal Grooming', 'Gift', 'Office', 'Borrow', 'Cash Rtn']
  },
  DK: {
    name: 'DK',
    subcategories: ['Investment', 'Mobile&Internet', 'Personal Grooming', 'Gift', 'Borrow', 'Subscriptions', 'Others', 'Office expense', 'Cash Rtn']
  },
  WFO: {
    name: 'WFO',
    subcategories: ['Travel', 'Food', 'Home', 'Gift', 'Local Travel', 'Internet+ subscriptions', 'Sports', 'Monthly', 'DMart', 'Quick Commerce']
  },
  FOOD_SNACK: {
    name: 'Food & Snack',
    subcategories: ['Food', 'Snacks']
  }
} as const;