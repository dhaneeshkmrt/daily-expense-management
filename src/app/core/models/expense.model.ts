import { PaymentMethodCode } from './user.model';

export interface Expense {
  id: string;
  date: Date;
  amount: number;
  description: string;
  notes?: string;
  categoryId: string;
  subcategoryId: string;
  microCategoryId?: string;
  paidBy: PaymentMethodCode;
  userId: string;
  monthPeriod: string; // 'YYYY-MM' format for custom periods
  isRecurring: boolean;
  recurringId?: string; // Links to recurring expense template
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringExpense {
  id: string;
  templateName: string;
  amount: number;
  description: string;
  categoryId: string;
  subcategoryId: string;
  microCategoryId?: string;
  paidBy: PaymentMethodCode;
  userId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  lastCreated?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseFilter {
  dateFrom?: Date;
  dateTo?: Date;
  categoryIds?: string[];
  subcategoryIds?: string[];
  microCategoryIds?: string[];
  paidBy?: PaymentMethodCode[];
  userIds?: string[];
  amountMin?: number;
  amountMax?: number;
  description?: string;
  monthPeriod?: string;
}

export interface ExpenseSummary {
  totalAmount: number;
  expenseCount: number;
  categoryBreakdown: CategoryExpenseSummary[];
  paymentMethodBreakdown: PaymentMethodExpenseSummary[];
  userBreakdown: UserExpenseSummary[];
}

export interface CategoryExpenseSummary {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  expenseCount: number;
  percentage: number;
}

export interface PaymentMethodExpenseSummary {
  paymentMethod: PaymentMethodCode;
  totalAmount: number;
  expenseCount: number;
  percentage: number;
}

export interface UserExpenseSummary {
  userId: string;
  userName: string;
  totalAmount: number;
  expenseCount: number;
  percentage: number;
}