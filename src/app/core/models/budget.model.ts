export interface Budget {
  id: string;
  categoryId: string;
  monthPeriod: string; // 'YYYY-MM' format
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  accountBalance: number; // Category account balance
  isOverBudget: boolean;
  overBudgetAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetTransfer {
  id: string;
  fromCategoryId: string;
  toCategoryId: string;
  amount: number;
  reason: string;
  monthPeriod: string;
  transferType: 'budget_to_budget' | 'account_to_budget' | 'budget_to_account';
  approvedBy: string; // userId
  createdAt: Date;
}

export interface CategoryAccount {
  id: string;
  categoryId: string;
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  lastTransactionDate?: Date;
  transactions: CategoryAccountTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryAccountTransaction {
  id: string;
  categoryAccountId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  monthPeriod: string;
  relatedBudgetId?: string;
  createdAt: Date;
}

export interface MonthlyBudgetSummary {
  monthPeriod: string;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  totalOverBudget: number;
  categoriesOverBudget: number;
  budgetUtilizationPercentage: number;
  categoryBudgets: Budget[];
}

export interface BudgetAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  categoryId: string;
  categoryName: string;
  message: string;
  threshold: number;
  currentAmount: number;
  budgetAmount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface BudgetSettings {
  warningThreshold: number; // Percentage (e.g., 80 for 80%)
  dangerThreshold: number; // Percentage (e.g., 95 for 95%)
  autoTransferUnusedBudget: boolean;
  allowOverBudgetSpending: boolean;
  enableBudgetAlerts: boolean;
  customMonthStartDate: number; // Day of month (1-31)
  customMonthEndDate: number; // Day of month (1-31)
}