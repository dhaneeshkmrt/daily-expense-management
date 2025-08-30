import { Injectable, inject } from '@angular/core';
import { Observable, of, map, switchMap, combineLatest } from 'rxjs';
import { ExpenseService } from './expense.service';
import { CategoryService } from './category.service';
import { AuthService } from './auth.service';
import { BudgetService } from './budget.service';
import { Expense } from '../models/expense.model';
import { Category, Subcategory, MicroCategory } from '../models/category.model';
import { Budget } from '../models/budget.model';

export interface CSVExportOptions {
  format: 'standard' | 'detailed' | 'budget_report';
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  monthPeriod?: string;
  categoryIds?: string[];
  includeNotes?: boolean;
  currency?: string;
}

export interface CSVRow {
  [key: string]: string | number | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class CsvService {
  private readonly expenseService = inject(ExpenseService);
  private readonly categoryService = inject(CategoryService);
  private readonly authService = inject(AuthService);
  private readonly budgetService = inject(BudgetService);

  // Export expenses to CSV format matching the user's existing format
  exportExpenses(options: CSVExportOptions): Observable<string> {
    return this.getExportData(options).pipe(
      map(data => {
        switch (options.format) {
          case 'detailed':
            return this.generateDetailedCSV(data.expenses, data.categories);
          case 'budget_report':
            return this.generateBudgetReportCSV(data.budgets, data.categories);
          default:
            return this.generateStandardCSV(data.expenses, data.categories);
        }
      })
    );
  }

  // Import expenses from CSV
  importExpenses(csvContent: string): Observable<string[]> {
    const expenses = this.parseCSV(csvContent);
    const importPromises = expenses.map(expense => 
      this.expenseService.addExpense(expense).toPromise()
    );

    return new Observable(observer => {
      Promise.all(importPromises)
        .then(results => {
          observer.next(results.filter(id => id) as string[]);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  // Download CSV file
  downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private getExportData(options: CSVExportOptions): Observable<{
    expenses: Expense[];
    categories: Category[];
    budgets: Budget[];
  }> {
    const expensesQuery = options.monthPeriod
      ? this.expenseService.getExpensesByMonth(options.monthPeriod)
      : this.expenseService.getUserExpenses();

    const budgetsQuery = options.monthPeriod
      ? this.budgetService.getUserBudgets(options.monthPeriod)
      : this.budgetService.getUserBudgets();

    return combineLatest([
      expensesQuery,
      this.categoryService.getUserCategories(),
      budgetsQuery
    ]).pipe(
      map(([expenses, categories, budgets]) => {
        // Filter by date range if specified
        let filteredExpenses = expenses;
        if (options.dateRange) {
          filteredExpenses = expenses.filter(expense => {
            const expenseDate = expense.date instanceof Date ? expense.date : expense.date.toDate();
            return expenseDate >= options.dateRange!.startDate && expenseDate <= options.dateRange!.endDate;
          });
        }

        // Filter by categories if specified
        if (options.categoryIds && options.categoryIds.length > 0) {
          filteredExpenses = filteredExpenses.filter(expense =>
            options.categoryIds!.includes(expense.categoryId)
          );
        }

        return {
          expenses: filteredExpenses,
          categories,
          budgets
        };
      })
    );
  }

  // Generate standard CSV format (matching user's existing format)
  private generateStandardCSV(expenses: Expense[], categories: Category[]): string {
    const headers = ['Date', 'Cate', 'sub', 'Amount', 'Paid by', 'Desc', 'Notes'];
    const rows: string[][] = [headers];

    expenses.forEach(expense => {
      const category = this.findCategory(expense.categoryId, categories);
      const subcategory = this.findSubcategory(expense.subcategoryId, categories);
      const expenseDate = expense.date instanceof Date ? expense.date : expense.date.toDate();

      const row = [
        this.formatDate(expenseDate),
        category?.name || 'Unknown',
        subcategory?.name || 'Unknown',
        `₹${expense.amount.toFixed(2)}`,
        expense.paidBy.toLowerCase(),
        expense.description,
        expense.notes || ''
      ];
      rows.push(row);
    });

    return this.arrayToCSV(rows);
  }

  // Generate detailed CSV format with all fields
  private generateDetailedCSV(expenses: Expense[], categories: Category[]): string {
    const headers = [
      'Date',
      'Category',
      'Subcategory', 
      'Micro Category',
      'Amount',
      'Payment Method',
      'Description',
      'Notes',
      'Month Period',
      'Is Recurring',
      'Created At',
      'User'
    ];
    const rows: string[][] = [headers];

    const currentUser = this.authService.currentUser();

    expenses.forEach(expense => {
      const category = this.findCategory(expense.categoryId, categories);
      const subcategory = this.findSubcategory(expense.subcategoryId, categories);
      const microCategory = expense.microCategoryId 
        ? this.findMicroCategory(expense.microCategoryId, categories)
        : null;
      const expenseDate = expense.date instanceof Date ? expense.date : expense.date.toDate();
      const createdAt = expense.createdAt instanceof Date ? expense.createdAt : expense.createdAt.toDate();

      const row = [
        this.formatDate(expenseDate),
        category?.name || 'Unknown',
        subcategory?.name || 'Unknown',
        microCategory?.name || '',
        expense.amount.toString(),
        this.formatPaymentMethod(expense.paidBy),
        expense.description,
        expense.notes || '',
        expense.monthPeriod,
        expense.isRecurring ? 'Yes' : 'No',
        this.formatDateTime(createdAt),
        currentUser?.name || 'Unknown'
      ];
      rows.push(row);
    });

    return this.arrayToCSV(rows);
  }

  // Generate budget report CSV
  private generateBudgetReportCSV(budgets: Budget[], categories: Category[]): string {
    const headers = [
      'Category',
      'Budget Amount',
      'Spent Amount',
      'Remaining Amount',
      'Over Budget Amount',
      'Utilization %',
      'Status',
      'Month Period'
    ];
    const rows: string[][] = [headers];

    budgets.forEach(budget => {
      const category = this.findCategory(budget.categoryId, categories);
      const utilization = budget.budgetAmount > 0 
        ? ((budget.spentAmount / budget.budgetAmount) * 100).toFixed(1)
        : '0.0';
      
      const status = budget.isOverBudget 
        ? 'Over Budget'
        : budget.spentAmount / budget.budgetAmount > 0.8
        ? 'Warning'
        : 'On Track';

      const row = [
        category?.name || 'Unknown',
        budget.budgetAmount.toString(),
        budget.spentAmount.toString(),
        budget.remainingAmount.toString(),
        budget.overBudgetAmount.toString(),
        utilization,
        status,
        budget.monthPeriod
      ];
      rows.push(row);
    });

    return this.arrayToCSV(rows);
  }

  // Parse CSV content to expense objects
  private parseCSV(csvContent: string): any[] {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const expenses: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);
      if (values.length !== headers.length) continue;

      const expense: any = {};
      headers.forEach((header, index) => {
        expense[header] = values[index];
      });

      // Convert to proper format for expense creation
      const formattedExpense = this.formatImportedExpense(expense);
      if (formattedExpense) {
        expenses.push(formattedExpense);
      }
    }

    return expenses;
  }

  // Parse a single CSV line considering quoted values
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    values.push(currentValue.trim());
    return values;
  }

  // Format imported expense data
  private formatImportedExpense(rawExpense: any): any {
    try {
      // This would need to be adapted based on the actual CSV format
      // For now, assuming standard format: Date, Cate, sub, Amount, Paid by, Desc, Notes
      return {
        date: this.parseDate(rawExpense['Date'] || rawExpense['date']),
        amount: this.parseAmount(rawExpense['Amount'] || rawExpense['amount']),
        description: rawExpense['Desc'] || rawExpense['description'] || rawExpense['Description'],
        notes: rawExpense['Notes'] || rawExpense['notes'],
        categoryId: '', // Would need to be resolved from category name
        subcategoryId: '', // Would need to be resolved from subcategory name
        paidBy: this.parsePaymentMethod(rawExpense['Paid by'] || rawExpense['paidBy'] || rawExpense['Payment Method'])
      };
    } catch (error) {
      console.error('Error formatting imported expense:', error);
      return null;
    }
  }

  // Helper methods
  private findCategory(categoryId: string, categories: Category[]): Category | undefined {
    return categories.find(cat => cat.id === categoryId);
  }

  private findSubcategory(subcategoryId: string, categories: Category[]): Subcategory | undefined {
    for (const category of categories) {
      const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
      if (subcategory) return subcategory;
    }
    return undefined;
  }

  private findMicroCategory(microCategoryId: string, categories: Category[]): MicroCategory | undefined {
    for (const category of categories) {
      for (const subcategory of category.subcategories) {
        const microCategory = subcategory.microCategories.find(micro => micro.id === microCategoryId);
        if (microCategory) return microCategory;
      }
    }
    return undefined;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    });
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatPaymentMethod(paidBy: string): string {
    const methodMap: Record<string, string> = {
      'DC': 'Dhaneesh Cash',
      'DD': 'Dhaneesh Digital',
      'NC': 'Nisha Cash',
      'ND': 'Nisha Digital'
    };
    return methodMap[paidBy.toUpperCase()] || paidBy;
  }

  private parseDate(dateString: string): Date {
    // Handle various date formats
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  private parseAmount(amountString: string): number {
    // Remove currency symbols and parse
    const cleanAmount = amountString.replace(/[₹,\s]/g, '');
    return parseFloat(cleanAmount) || 0;
  }

  private parsePaymentMethod(methodString: string): string {
    const normalized = methodString.toLowerCase().trim();
    const methodMap: Record<string, string> = {
      'dhaneesh cash': 'DC',
      'dhaneesh digital': 'DD',
      'nisha cash': 'NC',
      'nisha digital': 'ND',
      'dc': 'DC',
      'dd': 'DD',
      'nc': 'NC',
      'nd': 'ND'
    };
    return methodMap[normalized] || 'DC';
  }

  private arrayToCSV(rows: string[][]): string {
    return rows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma or quote
        const escaped = cell.toString().replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
          ? `"${escaped}"`
          : escaped;
      }).join(',')
    ).join('\n');
  }

  // Generate filename based on export options
  generateFilename(options: CSVExportOptions): string {
    const currentUser = this.authService.currentUser();
    const userName = currentUser?.name.replace(/[^a-z0-9]/gi, '_') || 'expenses';
    const timestamp = new Date().toISOString().slice(0, 10);
    
    let suffix = '';
    if (options.monthPeriod) {
      suffix = `_${options.monthPeriod}`;
    } else if (options.dateRange) {
      const startDate = options.dateRange.startDate.toISOString().slice(0, 10);
      const endDate = options.dateRange.endDate.toISOString().slice(0, 10);
      suffix = `_${startDate}_to_${endDate}`;
    }

    const formatSuffix = options.format !== 'standard' ? `_${options.format}` : '';
    
    return `${userName}_expenses${suffix}${formatSuffix}_${timestamp}.csv`;
  }
}