import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, map, combineLatest, switchMap } from 'rxjs';
import { ExpenseService } from './expense.service';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { AuthService } from './auth.service';
import { CsvService } from './csv.service';
import { Expense } from '../models/expense.model';
import { Budget } from '../models/budget.model';
import { Category } from '../models/category.model';
import { User, PaymentMethodCode } from '../models/user.model';

export interface MonthlyReconciliation {
  monthPeriod: string;
  totalExpenses: number;
  userBreakdown: UserSpendingBreakdown[];
  paymentMethodBreakdown: PaymentMethodBreakdown[];
  categoryBreakdown: CategoryBreakdown[];
  budgetComparison: BudgetComparison;
  settlementSummary: SettlementSummary;
  balanceSheet: BalanceSheetEntry[];
  generatedAt: Date;
}

export interface UserSpendingBreakdown {
  userId: string;
  userName: string;
  totalSpent: number;
  expenseCount: number;
  paymentMethods: {
    cash: number;
    digital: number;
  };
  categories: { categoryId: string; categoryName: string; amount: number; }[];
}

export interface PaymentMethodBreakdown {
  code: PaymentMethodCode;
  label: string;
  totalAmount: number;
  expenseCount: number;
  percentage: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  budgetAmount: number;
  variance: number;
  utilizationPercentage: number;
  expenseCount: number;
}

export interface BudgetComparison {
  totalBudget: number;
  totalSpent: number;
  totalVariance: number;
  overBudgetCategories: string[];
  underBudgetAmount: number;
}

export interface SettlementSummary {
  dhaneeshOwes: number;
  nishaOwes: number;
  netSettlement: number; // Positive means Dhaneesh owes Nisha, negative means Nisha owes Dhaneesh
  settlementNote: string;
}

export interface BalanceSheetEntry {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  status: 'over' | 'under' | 'on_track';
}

export interface ReconciliationSettings {
  customMonthStartDate: number; // Day of month (1-31)
  customMonthEndDate: number;   // Day of month (1-31)  
  autoSettlementEnabled: boolean;
  settlementDay: number; // Day of month for settlement
  dhaneeshAllocation: number; // Percentage of total budget allocated to Dhaneesh
  nishaAllocation: number;     // Percentage allocated to Nisha
  sharedExpenseRatio: number;  // Percentage of shared expenses
}

@Injectable({
  providedIn: 'root'
})
export class ReconciliationService {
  private readonly expenseService = inject(ExpenseService);
  private readonly budgetService = inject(BudgetService);
  private readonly categoryService = inject(CategoryService);
  private readonly authService = inject(AuthService);
  private readonly csvService = inject(CsvService);

  // Signals for reactive state
  readonly monthlyReconciliation = signal<MonthlyReconciliation | null>(null);
  readonly reconciliationSettings = signal<ReconciliationSettings | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Generate monthly reconciliation report
  generateMonthlyReconciliation(monthPeriod: string): Observable<MonthlyReconciliation> {
    this.loading.set(true);
    this.error.set(null);

    return combineLatest([
      this.expenseService.getExpensesByMonth(monthPeriod),
      this.budgetService.getUserBudgets(monthPeriod),
      this.categoryService.getUserCategories()
    ]).pipe(
      map(([expenses, budgets, categories]) => {
        const reconciliation = this.calculateReconciliation(expenses, budgets, categories, monthPeriod);
        this.monthlyReconciliation.set(reconciliation);
        this.loading.set(false);
        return reconciliation;
      })
    );
  }

  private calculateReconciliation(
    expenses: Expense[], 
    budgets: Budget[], 
    categories: Category[], 
    monthPeriod: string
  ): MonthlyReconciliation {
    
    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate user spending breakdown
    const userBreakdown = this.calculateUserBreakdown(expenses, categories);

    // Calculate payment method breakdown  
    const paymentMethodBreakdown = this.calculatePaymentMethodBreakdown(expenses);

    // Calculate category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(expenses, budgets, categories);

    // Calculate budget comparison
    const budgetComparison = this.calculateBudgetComparison(budgets, expenses);

    // Calculate settlement summary
    const settlementSummary = this.calculateSettlement(userBreakdown, budgetComparison);

    // Generate balance sheet
    const balanceSheet = this.generateBalanceSheet(categoryBreakdown);

    return {
      monthPeriod,
      totalExpenses,
      userBreakdown,
      paymentMethodBreakdown,
      categoryBreakdown,
      budgetComparison,
      settlementSummary,
      balanceSheet,
      generatedAt: new Date()
    };
  }

  private calculateUserBreakdown(expenses: Expense[], categories: Category[]): UserSpendingBreakdown[] {
    // Group expenses by user based on payment method
    const dhaneeshExpenses = expenses.filter(exp => ['DC', 'DD'].includes(exp.paidBy));
    const nishaExpenses = expenses.filter(exp => ['NC', 'ND'].includes(exp.paidBy));

    const createUserBreakdown = (userExpenses: Expense[], userName: string, userId: string): UserSpendingBreakdown => {
      const totalSpent = userExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const expenseCount = userExpenses.length;

      const cashExpenses = userExpenses.filter(exp => exp.paidBy.endsWith('C'));
      const digitalExpenses = userExpenses.filter(exp => exp.paidBy.endsWith('D'));

      const paymentMethods = {
        cash: cashExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        digital: digitalExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      };

      // Group by category
      const categoryMap = new Map<string, number>();
      userExpenses.forEach(exp => {
        const current = categoryMap.get(exp.categoryId) || 0;
        categoryMap.set(exp.categoryId, current + exp.amount);
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([categoryId, amount]) => {
        const category = categories.find(cat => cat.id === categoryId);
        return {
          categoryId,
          categoryName: category?.name || 'Unknown',
          amount
        };
      });

      return {
        userId,
        userName,
        totalSpent,
        expenseCount,
        paymentMethods,
        categories: categoryBreakdown
      };
    };

    return [
      createUserBreakdown(dhaneeshExpenses, 'Dhaneesh', 'dhaneesh'),
      createUserBreakdown(nishaExpenses, 'Nisha', 'nisha')
    ];
  }

  private calculatePaymentMethodBreakdown(expenses: Expense[]): PaymentMethodBreakdown[] {
    const methodMap = new Map<PaymentMethodCode, { amount: number; count: number; }>();

    expenses.forEach(expense => {
      const current = methodMap.get(expense.paidBy) || { amount: 0, count: 0 };
      methodMap.set(expense.paidBy, {
        amount: current.amount + expense.amount,
        count: current.count + 1
      });
    });

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const methodLabels: Record<PaymentMethodCode, string> = {
      'DC': 'Dhaneesh Cash',
      'DD': 'Dhaneesh Digital',
      'NC': 'Nisha Cash',
      'ND': 'Nisha Digital'
    };

    return Array.from(methodMap.entries()).map(([code, data]) => ({
      code,
      label: methodLabels[code],
      totalAmount: data.amount,
      expenseCount: data.count,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
    }));
  }

  private calculateCategoryBreakdown(expenses: Expense[], budgets: Budget[], categories: Category[]): CategoryBreakdown[] {
    // Group expenses by category
    const categoryMap = new Map<string, { amount: number; count: number; }>();

    expenses.forEach(expense => {
      const current = categoryMap.get(expense.categoryId) || { amount: 0, count: 0 };
      categoryMap.set(expense.categoryId, {
        amount: current.amount + expense.amount,
        count: current.count + 1
      });
    });

    return Array.from(categoryMap.entries()).map(([categoryId, data]) => {
      const category = categories.find(cat => cat.id === categoryId);
      const budget = budgets.find(bud => bud.categoryId === categoryId);
      const budgetAmount = budget?.budgetAmount || 0;
      const variance = data.amount - budgetAmount;
      const utilizationPercentage = budgetAmount > 0 ? (data.amount / budgetAmount) * 100 : 0;

      return {
        categoryId,
        categoryName: category?.name || 'Unknown',
        totalAmount: data.amount,
        budgetAmount,
        variance,
        utilizationPercentage,
        expenseCount: data.count
      };
    });
  }

  private calculateBudgetComparison(budgets: Budget[], expenses: Expense[]): BudgetComparison {
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.budgetAmount, 0);
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalVariance = totalSpent - totalBudget;
    
    const overBudgetCategories = budgets
      .filter(budget => budget.isOverBudget)
      .map(budget => budget.categoryId);
    
    const underBudgetAmount = budgets
      .filter(budget => !budget.isOverBudget)
      .reduce((sum, budget) => sum + budget.remainingAmount, 0);

    return {
      totalBudget,
      totalSpent,
      totalVariance,
      overBudgetCategories,
      underBudgetAmount
    };
  }

  private calculateSettlement(userBreakdown: UserSpendingBreakdown[], budgetComparison: BudgetComparison): SettlementSummary {
    const dhaneeshSpending = userBreakdown.find(user => user.userName === 'Dhaneesh')?.totalSpent || 0;
    const nishaSpending = userBreakdown.find(user => user.userName === 'Nisha')?.totalSpent || 0;
    
    // Simple 50-50 split calculation (can be made configurable)
    const totalSpent = dhaneeshSpending + nishaSpending;
    const expectedSharePerPerson = totalSpent / 2;
    
    const dhaneeshOwes = dhaneeshSpending > expectedSharePerPerson ? 0 : expectedSharePerPerson - dhaneeshSpending;
    const nishaOwes = nishaSpending > expectedSharePerPerson ? 0 : expectedSharePerPerson - nishaSpending;
    
    const netSettlement = dhaneeshSpending - expectedSharePerPerson;
    
    let settlementNote = '';
    if (Math.abs(netSettlement) < 1) {
      settlementNote = 'Expenses are evenly split. No settlement needed.';
    } else if (netSettlement > 0) {
      settlementNote = `Dhaneesh spent ₹${Math.abs(netSettlement).toFixed(2)} more. Nisha owes Dhaneesh.`;
    } else {
      settlementNote = `Nisha spent ₹${Math.abs(netSettlement).toFixed(2)} more. Dhaneesh owes Nisha.`;
    }

    return {
      dhaneeshOwes,
      nishaOwes,
      netSettlement,
      settlementNote
    };
  }

  private generateBalanceSheet(categoryBreakdown: CategoryBreakdown[]): BalanceSheetEntry[] {
    return categoryBreakdown.map(category => ({
      category: category.categoryName,
      budgeted: category.budgetAmount,
      actual: category.totalAmount,
      variance: category.variance,
      variancePercentage: category.budgetAmount > 0 
        ? (category.variance / category.budgetAmount) * 100 
        : 0,
      status: category.variance > 0 
        ? 'over' 
        : category.variance < -50 
        ? 'under' 
        : 'on_track'
    }));
  }

  // Export reconciliation report to CSV
  exportReconciliationReport(reconciliation: MonthlyReconciliation): Observable<string> {
    const csvRows: string[][] = [];
    
    // Header
    csvRows.push([
      `Monthly Reconciliation Report - ${reconciliation.monthPeriod}`,
      '',
      '',
      `Generated: ${reconciliation.generatedAt.toLocaleDateString()}`
    ]);
    csvRows.push([]);

    // Summary
    csvRows.push(['SUMMARY']);
    csvRows.push(['Total Expenses', `₹${reconciliation.totalExpenses.toFixed(2)}`]);
    csvRows.push(['Budget vs Actual', `₹${reconciliation.budgetComparison.totalVariance.toFixed(2)}`]);
    csvRows.push(['Net Settlement', reconciliation.settlementSummary.settlementNote]);
    csvRows.push([]);

    // User Breakdown
    csvRows.push(['USER SPENDING BREAKDOWN']);
    csvRows.push(['User', 'Total Spent', 'Expense Count', 'Cash', 'Digital']);
    reconciliation.userBreakdown.forEach(user => {
      csvRows.push([
        user.userName,
        `₹${user.totalSpent.toFixed(2)}`,
        user.expenseCount.toString(),
        `₹${user.paymentMethods.cash.toFixed(2)}`,
        `₹${user.paymentMethods.digital.toFixed(2)}`
      ]);
    });
    csvRows.push([]);

    // Category Balance Sheet
    csvRows.push(['CATEGORY BALANCE SHEET']);
    csvRows.push(['Category', 'Budgeted', 'Actual', 'Variance', 'Variance %', 'Status']);
    reconciliation.balanceSheet.forEach(entry => {
      csvRows.push([
        entry.category,
        `₹${entry.budgeted.toFixed(2)}`,
        `₹${entry.actual.toFixed(2)}`,
        `₹${entry.variance.toFixed(2)}`,
        `${entry.variancePercentage.toFixed(1)}%`,
        entry.status.replace('_', ' ').toUpperCase()
      ]);
    });

    const csvContent = csvRows.map(row => 
      row.map(cell => cell.includes(',') ? `"${cell}"` : cell).join(',')
    ).join('\n');

    return of(csvContent);
  }

  // Download reconciliation report
  downloadReconciliationReport(monthPeriod: string): Observable<void> {
    return this.generateMonthlyReconciliation(monthPeriod).pipe(
      switchMap(reconciliation => this.exportReconciliationReport(reconciliation)),
      map(csvContent => {
        const filename = `reconciliation_report_${monthPeriod}_${new Date().toISOString().slice(0, 10)}.csv`;
        this.csvService.downloadCSV(csvContent, filename);
      })
    );
  }

  // Get current month period
  getCurrentMonthPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Clear error state
  clearError(): void {
    this.error.set(null);
  }
}