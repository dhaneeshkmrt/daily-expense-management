import { Injectable, inject, signal, computed } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  QueryConstraint 
} from '@angular/fire/firestore';
import { Observable, from, map, catchError, of } from 'rxjs';
import { AuthService } from './auth.service';
import { Expense, ExpenseData, ExpenseFormData, ExpenseFilter } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  
  // Firestore collections
  private readonly expensesCollection = collection(this.firestore, 'expenses');
  
  // Signals for reactive state
  readonly expenses = signal<Expense[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  
  // Computed values
  readonly totalExpenses = computed(() => 
    this.expenses().reduce((sum, expense) => sum + expense.amount, 0)
  );
  
  readonly expenseCount = computed(() => this.expenses().length);
  
  readonly currentMonthExpenses = computed(() => {
    const currentMonth = this.getCurrentMonthPeriod();
    return this.expenses().filter(expense => expense.monthPeriod === currentMonth);
  });

  // Get expenses for current user with real-time updates
  getUserExpenses(filters?: ExpenseFilter): Observable<Expense[]> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return of([]);
    }

    const constraints: QueryConstraint[] = [
      where('userId', '==', currentUser.id),
      orderBy('date', 'desc')
    ];

    // Apply filters
    if (filters) {
      if (filters.categoryIds?.length) {
        constraints.push(where('categoryId', 'in', filters.categoryIds));
      }
      if (filters.monthPeriod) {
        constraints.push(where('monthPeriod', '==', filters.monthPeriod));
      }
      if (filters.paidBy?.length) {
        constraints.push(where('paidBy', 'in', filters.paidBy));
      }
    }

    const q = query(this.expensesCollection, ...constraints);
    
    return collectionData(q, { idField: 'id' }).pipe(
      map((expenses: any[]) => expenses.map(expense => this.convertTimestampsToDate(expense))),
      catchError(error => {
        console.error('Error fetching expenses:', error);
        this.error.set('Failed to load expenses');
        return of([]);
      })
    );
  }

  // Add new expense
  addExpense(expenseData: ExpenseFormData): Observable<string> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to add expenses');
    }

    this.loading.set(true);
    this.error.set(null);

    const now = Timestamp.now();
    const data: ExpenseData = {
      ...expenseData,
      date: Timestamp.fromDate(expenseData.date),
      userId: currentUser.id,
      monthPeriod: this.getMonthPeriod(expenseData.date),
      isRecurring: false,
      createdAt: now,
      updatedAt: now
    };

    return from(addDoc(this.expensesCollection, data)).pipe(
      map(docRef => {
        console.log('Expense added successfully:', docRef.id);
        this.loading.set(false);
        return docRef.id;
      }),
      catchError(error => {
        console.error('Error adding expense:', error);
        this.loading.set(false);
        this.error.set('Failed to add expense');
        throw error;
      })
    );
  }

  // Update existing expense
  updateExpense(id: string, updates: Partial<ExpenseFormData>): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    const docRef = doc(this.firestore, 'expenses', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date);
      updateData.monthPeriod = this.getMonthPeriod(updates.date);
    }

    return from(updateDoc(docRef, updateData)).pipe(
      map(() => {
        console.log('Expense updated successfully:', id);
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('Error updating expense:', error);
        this.loading.set(false);
        this.error.set('Failed to update expense');
        throw error;
      })
    );
  }

  // Delete expense
  deleteExpense(id: string): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    const docRef = doc(this.firestore, 'expenses', id);

    return from(deleteDoc(docRef)).pipe(
      map(() => {
        console.log('Expense deleted successfully:', id);
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('Error deleting expense:', error);
        this.loading.set(false);
        this.error.set('Failed to delete expense');
        throw error;
      })
    );
  }

  // Get expenses for a specific month period
  getExpensesByMonth(monthPeriod: string): Observable<Expense[]> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return of([]);
    }

    const q = query(
      this.expensesCollection,
      where('userId', '==', currentUser.id),
      where('monthPeriod', '==', monthPeriod),
      orderBy('date', 'desc')
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map((expenses: any[]) => expenses.map(expense => this.convertTimestampsToDate(expense))),
      catchError(error => {
        console.error('Error fetching monthly expenses:', error);
        return of([]);
      })
    );
  }

  // Get recent expenses (last 10)
  getRecentExpenses(limitCount: number = 10): Observable<Expense[]> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return of([]);
    }

    const q = query(
      this.expensesCollection,
      where('userId', '==', currentUser.id),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map((expenses: any[]) => expenses.map(expense => this.convertTimestampsToDate(expense))),
      catchError(error => {
        console.error('Error fetching recent expenses:', error);
        return of([]);
      })
    );
  }

  // Utility methods
  private convertTimestampsToDate(expense: any): Expense {
    return {
      ...expense,
      date: expense.date?.toDate?.() || expense.date,
      createdAt: expense.createdAt?.toDate?.() || expense.createdAt,
      updatedAt: expense.updatedAt?.toDate?.() || expense.updatedAt
    };
  }

  private getMonthPeriod(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private getCurrentMonthPeriod(): string {
    return this.getMonthPeriod(new Date());
  }

  // Clear error state
  clearError(): void {
    this.error.set(null);
  }

  // Get expense statistics
  getExpenseStats(monthPeriod?: string): Observable<{
    total: number;
    count: number;
    average: number;
    byCategory: Record<string, number>;
    byPaymentMethod: Record<string, number>;
  }> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return of({
        total: 0,
        count: 0,
        average: 0,
        byCategory: {},
        byPaymentMethod: {}
      });
    }

    const constraints: QueryConstraint[] = [
      where('userId', '==', currentUser.id)
    ];

    if (monthPeriod) {
      constraints.push(where('monthPeriod', '==', monthPeriod));
    }

    const q = query(this.expensesCollection, ...constraints);

    return collectionData(q).pipe(
      map((expenses: any[]) => {
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const count = expenses.length;
        const average = count > 0 ? total / count : 0;

        const byCategory: Record<string, number> = {};
        const byPaymentMethod: Record<string, number> = {};

        expenses.forEach(exp => {
          byCategory[exp.categoryId] = (byCategory[exp.categoryId] || 0) + exp.amount;
          byPaymentMethod[exp.paidBy] = (byPaymentMethod[exp.paidBy] || 0) + exp.amount;
        });

        return {
          total,
          count,
          average,
          byCategory,
          byPaymentMethod
        };
      }),
      catchError(error => {
        console.error('Error fetching expense stats:', error);
        return of({
          total: 0,
          count: 0,
          average: 0,
          byCategory: {},
          byPaymentMethod: {}
        });
      })
    );
  }
}