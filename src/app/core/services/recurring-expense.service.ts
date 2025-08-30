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
  Timestamp 
} from '@angular/fire/firestore';
import { Observable, from, map, catchError, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { ExpenseService } from './expense.service';
import { RecurringExpense } from '../models/expense.model';
import { ExpenseFormData } from '../models/expense.model';

export interface RecurringExpenseData extends Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'lastCreated'> {}

export interface RecurringExpenseTemplate {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  microCategoryId?: string;
  defaultAmount: number;
  paymentMethod: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RecurringExpenseService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  private readonly expenseService = inject(ExpenseService);
  
  // Firestore collections
  private readonly recurringExpensesCollection = collection(this.firestore, 'recurringExpenses');
  
  // Signals for reactive state
  readonly recurringExpenses = signal<RecurringExpense[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  
  // Computed values
  readonly activeRecurringExpenses = computed(() => 
    this.recurringExpenses().filter(expense => expense.isActive)
  );
  
  readonly monthlyRecurringExpenses = computed(() => 
    this.activeRecurringExpenses().filter(expense => expense.frequency === 'monthly')
  );

  readonly weeklyRecurringExpenses = computed(() => 
    this.activeRecurringExpenses().filter(expense => expense.frequency === 'weekly')
  );

  readonly dailyRecurringExpenses = computed(() => 
    this.activeRecurringExpenses().filter(expense => expense.frequency === 'daily')
  );

  // Get recurring expenses for current user
  getUserRecurringExpenses(): Observable<RecurringExpense[]> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.error.set('User not authenticated');
      return of([]);
    }

    const q = query(
      this.recurringExpensesCollection,
      where('userId', '==', currentUser.id),
      orderBy('isActive', 'desc'),
      orderBy('templateName', 'asc')
    );
    
    return collectionData(q, { idField: 'id' }).pipe(
      map((recurringExpenses: any[]) => {
        const processed = recurringExpenses.map(expense => this.convertTimestampsToDate(expense));
        this.recurringExpenses.set(processed);
        return processed;
      }),
      catchError(error => {
        console.error('Error fetching recurring expenses:', error);
        this.error.set('Failed to load recurring expenses: ' + error.message);
        return of([]);
      })
    );
  }

  // Add new recurring expense
  addRecurringExpense(data: RecurringExpenseData): Observable<string> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to add recurring expenses');
    }

    this.loading.set(true);
    this.error.set(null);

    const now = Timestamp.now();
    const recurringExpenseData = {
      ...data,
      userId: currentUser.id,
      createdAt: now,
      updatedAt: now
    };

    return from(addDoc(this.recurringExpensesCollection, recurringExpenseData)).pipe(
      map(docRef => {
        console.log('Recurring expense added successfully:', docRef.id);
        this.loading.set(false);
        return docRef.id;
      }),
      catchError(error => {
        console.error('Error adding recurring expense:', error);
        this.loading.set(false);
        this.error.set('Failed to add recurring expense');
        throw error;
      })
    );
  }

  // Update recurring expense
  updateRecurringExpense(id: string, updates: Partial<RecurringExpenseData>): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    const docRef = doc(this.firestore, 'recurringExpenses', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    return from(updateDoc(docRef, updateData)).pipe(
      map(() => {
        console.log('Recurring expense updated successfully:', id);
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('Error updating recurring expense:', error);
        this.loading.set(false);
        this.error.set('Failed to update recurring expense');
        throw error;
      })
    );
  }

  // Delete recurring expense
  deleteRecurringExpense(id: string): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    const docRef = doc(this.firestore, 'recurringExpenses', id);

    return from(deleteDoc(docRef)).pipe(
      map(() => {
        console.log('Recurring expense deleted successfully:', id);
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('Error deleting recurring expense:', error);
        this.loading.set(false);
        this.error.set('Failed to delete recurring expense');
        throw error;
      })
    );
  }

  // Toggle recurring expense active status
  toggleRecurringExpense(id: string, isActive: boolean): Observable<void> {
    return this.updateRecurringExpense(id, { isActive });
  }

  // Create expense from recurring template
  createExpenseFromTemplate(recurringExpense: RecurringExpense, customAmount?: number, customDate?: Date): Observable<string> {
    const expenseData: ExpenseFormData = {
      date: customDate || new Date(),
      amount: customAmount || recurringExpense.amount,
      description: recurringExpense.description,
      categoryId: recurringExpense.categoryId,
      subcategoryId: recurringExpense.subcategoryId,
      microCategoryId: recurringExpense.microCategoryId,
      paidBy: recurringExpense.paidBy
    };

    return this.expenseService.addExpense(expenseData).pipe(
      switchMap(expenseId => {
        // Update lastCreated timestamp - cast to any to bypass type checking
        return this.updateRecurringExpense(recurringExpense.id, {
          lastCreated: new Date()
        } as any).pipe(
          map(() => expenseId)
        );
      })
    );
  }

  // Process recurring expenses (to be called by a scheduler)
  processRecurringExpenses(): Observable<string[]> {
    return this.getUserRecurringExpenses().pipe(
      switchMap(recurringExpenses => {
        const today = new Date();
        const expensesToCreate: Observable<string>[] = [];

        recurringExpenses
          .filter(expense => expense.isActive && this.shouldCreateExpense(expense, today))
          .forEach(expense => {
            expensesToCreate.push(this.createExpenseFromTemplate(expense));
          });

        if (expensesToCreate.length === 0) {
          return of([]);
        }

        // Execute all expense creations
        return new Observable<string[]>(observer => {
          Promise.all(expensesToCreate.map(obs => obs.toPromise()))
            .then(results => {
              const successfulIds = results.filter(id => id) as string[];
              observer.next(successfulIds);
              observer.complete();
            })
            .catch(error => {
              observer.error(error);
            });
        });
      })
    );
  }

  // Check if a recurring expense should create a new expense today
  private shouldCreateExpense(recurringExpense: RecurringExpense, today: Date): boolean {
    if (!recurringExpense.isActive) {
      return false;
    }

    const lastCreated = recurringExpense.lastCreated;
    if (!lastCreated) {
      return true; // First time creation
    }

    const lastCreatedDate = lastCreated instanceof Date ? lastCreated : (lastCreated as any).toDate();
    const daysDiff = Math.floor((today.getTime() - lastCreatedDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (recurringExpense.frequency) {
      case 'daily':
        return daysDiff >= 1;
      case 'weekly':
        return daysDiff >= 7;
      case 'monthly':
        // Check if it's a new month
        return today.getMonth() !== lastCreatedDate.getMonth() || 
               today.getFullYear() !== lastCreatedDate.getFullYear();
      default:
        return false;
    }
  }

  // Get suggested recurring expenses based on expense history
  getSuggestedRecurringExpenses(): Observable<RecurringExpenseTemplate[]> {
    return this.expenseService.getUserExpenses().pipe(
      map(expenses => {
        // Analyze expense patterns to suggest recurring expenses
        const expensePatterns = new Map<string, {
          description: string;
          categoryId: string;
          subcategoryId: string;
          microCategoryId?: string;
          amounts: number[];
          paymentMethods: string[];
          dates: Date[];
        }>();

        expenses.forEach(expense => {
          const key = `${expense.description}_${expense.categoryId}_${expense.subcategoryId}`;
          if (!expensePatterns.has(key)) {
            expensePatterns.set(key, {
              description: expense.description,
              categoryId: expense.categoryId,
              subcategoryId: expense.subcategoryId,
              microCategoryId: expense.microCategoryId,
              amounts: [],
              paymentMethods: [],
              dates: []
            });
          }

          const pattern = expensePatterns.get(key)!;
          pattern.amounts.push(expense.amount);
          pattern.paymentMethods.push(expense.paidBy);
          pattern.dates.push(expense.date instanceof Date ? expense.date : expense.date.toDate());
        });

        // Filter patterns that appear to be recurring (3+ occurrences)
        const suggestions: RecurringExpenseTemplate[] = [];
        
        expensePatterns.forEach((pattern, key) => {
          if (pattern.amounts.length >= 3) {
            // Check if amounts are similar (within 20% variance)
            const avgAmount = pattern.amounts.reduce((a, b) => a + b, 0) / pattern.amounts.length;
            const variance = pattern.amounts.reduce((acc, amount) => acc + Math.abs(amount - avgAmount), 0) / pattern.amounts.length;
            const variancePercentage = (variance / avgAmount) * 100;

            if (variancePercentage <= 20) {
              // Check if dates suggest regular pattern
              const sortedDates = pattern.dates.sort((a, b) => a.getTime() - b.getTime());
              const intervals: number[] = [];
              
              for (let i = 1; i < sortedDates.length; i++) {
                const days = Math.floor((sortedDates[i].getTime() - sortedDates[i-1].getTime()) / (1000 * 60 * 60 * 24));
                intervals.push(days);
              }

              const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
              
              // Suggest if intervals are consistent
              if (avgInterval >= 25 && avgInterval <= 35) { // Monthly-ish
                suggestions.push({
                  id: key,
                  name: `Auto: ${pattern.description}`,
                  description: pattern.description,
                  categoryId: pattern.categoryId,
                  subcategoryId: pattern.subcategoryId,
                  microCategoryId: pattern.microCategoryId,
                  defaultAmount: Math.round(avgAmount),
                  paymentMethod: this.getMostFrequentPaymentMethod(pattern.paymentMethods),
                  isActive: false
                });
              }
            }
          }
        });

        return suggestions.slice(0, 5); // Return top 5 suggestions
      }),
      catchError(error => {
        console.error('Error getting recurring expense suggestions:', error);
        return of([]);
      })
    );
  }

  // Create recurring expense from suggestion
  createFromSuggestion(suggestion: RecurringExpenseTemplate): Observable<string> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to create recurring expenses');
    }

    const data: RecurringExpenseData = {
      templateName: suggestion.name,
      amount: suggestion.defaultAmount,
      description: suggestion.description,
      categoryId: suggestion.categoryId,
      subcategoryId: suggestion.subcategoryId,
      microCategoryId: suggestion.microCategoryId,
      paidBy: suggestion.paymentMethod as any,
      userId: currentUser.id,
      frequency: 'monthly', // Default to monthly
      isActive: true
    };

    return this.addRecurringExpense(data);
  }

  // Get predefined recurring expense templates
  getPredefinedTemplates(): RecurringExpenseTemplate[] {
    return [
      {
        id: 'milk',
        name: 'Daily Milk',
        description: 'Daily milk purchase',
        categoryId: 'monthly',
        subcategoryId: 'milk',
        microCategoryId: 'milk-recurring',
        defaultAmount: 25,
        paymentMethod: 'NC',
        isActive: false
      },
      {
        id: 'electricity',
        name: 'Electricity Bill',
        description: 'Monthly electricity bill',
        categoryId: 'monthly',
        subcategoryId: 'electricity',
        defaultAmount: 2000,
        paymentMethod: 'DD',
        isActive: false
      },
      {
        id: 'gas',
        name: 'Cooking Gas',
        description: 'LPG gas cylinder',
        categoryId: 'monthly',
        subcategoryId: 'gas',
        microCategoryId: 'gas-recurring',
        defaultAmount: 900,
        paymentMethod: 'DD',
        isActive: false
      },
      {
        id: 'grocery',
        name: 'Weekly Grocery',
        description: 'Weekly grocery shopping',
        categoryId: 'monthly',
        subcategoryId: 'grocery',
        defaultAmount: 1500,
        paymentMethod: 'NC',
        isActive: false
      },
      {
        id: 'petrol',
        name: 'Petrol Fill-up',
        description: 'Vehicle petrol',
        categoryId: 'monthly',
        subcategoryId: 'petrol',
        defaultAmount: 2000,
        paymentMethod: 'DD',
        isActive: false
      }
    ];
  }

  // Helper methods
  private getMostFrequentPaymentMethod(methods: string[]): string {
    const frequency = new Map<string, number>();
    methods.forEach(method => {
      frequency.set(method, (frequency.get(method) || 0) + 1);
    });

    let mostFrequent = 'DC';
    let maxCount = 0;
    frequency.forEach((count, method) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = method;
      }
    });

    return mostFrequent;
  }

  private convertTimestampsToDate(expense: any): RecurringExpense {
    return {
      ...expense,
      lastCreated: expense.lastCreated?.toDate?.() || expense.lastCreated,
      createdAt: expense.createdAt?.toDate?.() || expense.createdAt,
      updatedAt: expense.updatedAt?.toDate?.() || expense.updatedAt
    };
  }

  // Clear error state
  clearError(): void {
    this.error.set(null);
  }

  // Manual trigger for recurring expenses (for testing)
  triggerRecurringExpenses(): Observable<string[]> {
    console.log('Manually triggering recurring expenses...');
    return this.processRecurringExpenses().pipe(
      map(createdIds => {
        console.log(`Created ${createdIds.length} recurring expenses:`, createdIds);
        return createdIds;
      })
    );
  }
}