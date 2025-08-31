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
  Timestamp,
  QueryConstraint 
} from '@angular/fire/firestore';
import { Observable, from, map, catchError, of, combineLatest, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { CategoryService } from './category.service';
import { ExpenseService } from './expense.service';
import { 
  Budget, 
  BudgetTransfer, 
  CategoryAccount, 
  MonthlyBudgetSummary, 
  BudgetAlert,
  BudgetSettings 
} from '../models/budget.model';

export interface BudgetData extends Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> {
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  private readonly categoryService = inject(CategoryService);
  private readonly expenseService = inject(ExpenseService);
  
  // Firestore collections
  private readonly budgetsCollection = collection(this.firestore, 'budgets');
  private readonly budgetTransfersCollection = collection(this.firestore, 'budgetTransfers');
  private readonly categoryAccountsCollection = collection(this.firestore, 'categoryAccounts');
  private readonly budgetSettingsCollection = collection(this.firestore, 'budgetSettings');
  
  // Signals for reactive state
  readonly budgets = signal<Budget[]>([]);
  readonly monthlyBudgetSummary = signal<MonthlyBudgetSummary | null>(null);
  readonly budgetAlerts = signal<BudgetAlert[]>([]);
  readonly budgetSettings = signal<BudgetSettings | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  
  // Computed values
  readonly totalBudget = computed(() => 
    this.budgets().reduce((sum, budget) => sum + budget.budgetAmount, 0)
  );
  
  readonly totalSpent = computed(() => 
    this.budgets().reduce((sum, budget) => sum + budget.spentAmount, 0)
  );
  
  readonly totalRemaining = computed(() => 
    this.budgets().reduce((sum, budget) => sum + budget.remainingAmount, 0)
  );

  readonly overBudgetCategories = computed(() => 
    this.budgets().filter(budget => budget.isOverBudget)
  );

  readonly budgetUtilizationPercentage = computed(() => {
    const total = this.totalBudget();
    const spent = this.totalSpent();
    return total > 0 ? (spent / total) * 100 : 0;
  });

  // Get budgets for current user and month
  getUserBudgets(monthPeriod?: string): Observable<Budget[]> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.error.set('User not authenticated');
      return of([]);
    }

    const constraints: QueryConstraint[] = [
      where('userId', '==', currentUser.id),
      orderBy('categoryId', 'asc')
    ];

    if (monthPeriod) {
      constraints.push(where('monthPeriod', '==', monthPeriod));
    }

    const q = query(this.budgetsCollection, ...constraints);
    
    return collectionData(q, { idField: 'id' }).pipe(
      map((budgets: any[]) => {
        const processedBudgets = budgets.map(budget => this.convertTimestampsToDate(budget));
        this.budgets.set(processedBudgets);
        return processedBudgets;
      }),
      catchError(error => {
        console.error('Error fetching budgets:', error);
        this.error.set('Failed to load budgets: ' + error.message);
        return of([]);
      })
    );
  }

  // Create or update budget for a category
  setBudget(categoryId: string, amount: number, monthPeriod: string): Observable<string> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to set budgets');
    }

    this.loading.set(true);
    this.error.set(null);

    // Check if budget already exists
    return this.getBudgetByCategory(categoryId, monthPeriod).pipe(
      switchMap(existingBudget => {
        if (existingBudget) {
          // Update existing budget
          return this.updateBudget(existingBudget.id, { budgetAmount: amount }).pipe(
            map(() => existingBudget.id)
          );
        } else {
          // Create new budget
          const now = Timestamp.now();
          const budgetData: BudgetData = {
            categoryId,
            monthPeriod,
            budgetAmount: amount,
            spentAmount: 0,
            remainingAmount: amount,
            accountBalance: 0,
            isOverBudget: false,
            overBudgetAmount: 0,
            userId: currentUser.id
          };

          return from(addDoc(this.budgetsCollection, {
            ...budgetData,
            createdAt: now,
            updatedAt: now
          })).pipe(
            map(docRef => {
              console.log('Budget created successfully:', docRef.id);
              this.loading.set(false);
              return docRef.id;
            })
          );
        }
      }),
      catchError(error => {
        console.error('Error setting budget:', error);
        this.loading.set(false);
        this.error.set('Failed to set budget');
        throw error;
      })
    );
  }

  // Update existing budget
  updateBudget(id: string, updates: Partial<BudgetData>): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    const docRef = doc(this.firestore, 'budgets', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    return from(updateDoc(docRef, updateData)).pipe(
      map(() => {
        console.log('Budget updated successfully:', id);
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('Error updating budget:', error);
        this.loading.set(false);
        this.error.set('Failed to update budget');
        throw error;
      })
    );
  }

  // Get budget for specific category and month
  getBudgetByCategory(categoryId: string, monthPeriod: string): Observable<Budget | null> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return of(null);

    const q = query(
      this.budgetsCollection,
      where('userId', '==', currentUser.id),
      where('categoryId', '==', categoryId),
      where('monthPeriod', '==', monthPeriod)
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map((budgets: any[]) => {
        if (budgets.length > 0) {
          return this.convertTimestampsToDate(budgets[0]);
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching budget by category:', error);
        return of(null);
      })
    );
  }

  // Update budget spent amounts based on expenses
  updateBudgetSpending(monthPeriod: string): Observable<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return of(undefined);

    // Get expenses for the month and update budgets accordingly
    return combineLatest([
      this.getUserBudgets(monthPeriod),
      this.expenseService.getExpensesByMonth(monthPeriod)
    ]).pipe(
      switchMap(([budgets, expenses]) => {
        const updatePromises = budgets.map(budget => {
          // Calculate spent amount for this category
          const categoryExpenses = expenses.filter(exp => exp.categoryId === budget.categoryId);
          const spentAmount = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          const remainingAmount = budget.budgetAmount - spentAmount;
          const isOverBudget = spentAmount > budget.budgetAmount;
          const overBudgetAmount = isOverBudget ? spentAmount - budget.budgetAmount : 0;

          return this.updateBudget(budget.id, {
            spentAmount,
            remainingAmount,
            isOverBudget,
            overBudgetAmount
          }).toPromise();
        });

        return from(Promise.all(updatePromises));
      }),
      map(() => {
        console.log('Budget spending updated successfully');
      }),
      catchError(error => {
        console.error('Error updating budget spending:', error);
        return of(undefined);
      })
    );
  }

  // Transfer budget between categories
  transferBudget(fromCategoryId: string, toCategoryId: string, amount: number, reason: string, monthPeriod: string): Observable<string> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to transfer budget');
    }

    this.loading.set(true);
    this.error.set(null);

    const now = Timestamp.now();
    const transferData: Omit<BudgetTransfer, 'id'> = {
      fromCategoryId,
      toCategoryId,
      amount,
      reason,
      monthPeriod,
      transferType: 'budget_to_budget',
      approvedBy: currentUser.id,
      createdAt: now.toDate()
    };

    return from(addDoc(this.budgetTransfersCollection, {
      ...transferData,
      createdAt: now
    })).pipe(
      switchMap(docRef => {
        // Update the budgets
        return combineLatest([
          this.getBudgetByCategory(fromCategoryId, monthPeriod),
          this.getBudgetByCategory(toCategoryId, monthPeriod)
        ]).pipe(
          switchMap(([fromBudget, toBudget]) => {
            const updates: Promise<void>[] = [];

            if (fromBudget) {
              updates.push(
                this.updateBudget(fromBudget.id, {
                  budgetAmount: fromBudget.budgetAmount - amount,
                  remainingAmount: fromBudget.remainingAmount - amount
                }).toPromise()
              );
            }

            if (toBudget) {
              updates.push(
                this.updateBudget(toBudget.id, {
                  budgetAmount: toBudget.budgetAmount + amount,
                  remainingAmount: toBudget.remainingAmount + amount
                }).toPromise()
              );
            }

            return from(Promise.all(updates)).pipe(
              map(() => {
                console.log('Budget transfer completed successfully:', docRef.id);
                this.loading.set(false);
                return docRef.id;
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Error transferring budget:', error);
        this.loading.set(false);
        this.error.set('Failed to transfer budget');
        throw error;
      })
    );
  }

  // Get monthly budget summary
  getMonthlyBudgetSummary(monthPeriod: string): Observable<MonthlyBudgetSummary> {
    return this.getUserBudgets(monthPeriod).pipe(
      map(budgets => {
        const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
        const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
        const totalRemaining = budgets.reduce((sum, b) => sum + b.remainingAmount, 0);
        const totalOverBudget = budgets.reduce((sum, b) => sum + b.overBudgetAmount, 0);
        const categoriesOverBudget = budgets.filter(b => b.isOverBudget).length;
        const budgetUtilizationPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

        const summary: MonthlyBudgetSummary = {
          monthPeriod,
          totalBudget,
          totalSpent,
          totalRemaining,
          totalOverBudget,
          categoriesOverBudget,
          budgetUtilizationPercentage,
          categoryBudgets: budgets
        };

        this.monthlyBudgetSummary.set(summary);
        return summary;
      }),
      catchError(error => {
        console.error('Error getting monthly budget summary:', error);
        return of({
          monthPeriod,
          totalBudget: 0,
          totalSpent: 0,
          totalRemaining: 0,
          totalOverBudget: 0,
          categoriesOverBudget: 0,
          budgetUtilizationPercentage: 0,
          categoryBudgets: []
        });
      })
    );
  }

  // Generate budget alerts
  generateBudgetAlerts(monthPeriod: string): Observable<BudgetAlert[]> {
    return combineLatest([
      this.getUserBudgets(monthPeriod),
      this.categoryService.getUserCategories(),
      this.getBudgetSettings()
    ]).pipe(
      map(([budgets, categories, settings]) => {
        const alerts: BudgetAlert[] = [];
        const warningThreshold = settings?.warningThreshold || 80;
        const dangerThreshold = settings?.dangerThreshold || 95;

        budgets.forEach(budget => {
          const category = categories.find(c => c.id === budget.categoryId);
          const utilizationPercentage = budget.budgetAmount > 0 
            ? (budget.spentAmount / budget.budgetAmount) * 100 
            : 0;

          if (budget.isOverBudget) {
            alerts.push({
              id: `alert-${budget.id}`,
              type: 'danger',
              categoryId: budget.categoryId,
              categoryName: category?.name || 'Unknown Category',
              message: `Over budget by ₹${budget.overBudgetAmount.toFixed(2)}`,
              threshold: 100,
              currentAmount: budget.spentAmount,
              budgetAmount: budget.budgetAmount,
              isActive: true,
              createdAt: new Date()
            });
          } else if (utilizationPercentage >= dangerThreshold) {
            alerts.push({
              id: `alert-${budget.id}`,
              type: 'danger',
              categoryId: budget.categoryId,
              categoryName: category?.name || 'Unknown Category',
              message: `${utilizationPercentage.toFixed(1)}% of budget used`,
              threshold: dangerThreshold,
              currentAmount: budget.spentAmount,
              budgetAmount: budget.budgetAmount,
              isActive: true,
              createdAt: new Date()
            });
          } else if (utilizationPercentage >= warningThreshold) {
            alerts.push({
              id: `alert-${budget.id}`,
              type: 'warning',
              categoryId: budget.categoryId,
              categoryName: category?.name || 'Unknown Category',
              message: `${utilizationPercentage.toFixed(1)}% of budget used`,
              threshold: warningThreshold,
              currentAmount: budget.spentAmount,
              budgetAmount: budget.budgetAmount,
              isActive: true,
              createdAt: new Date()
            });
          }
        });

        this.budgetAlerts.set(alerts);
        return alerts;
      }),
      catchError(error => {
        console.error('Error generating budget alerts:', error);
        return of([]);
      })
    );
  }

  // Get budget settings
  getBudgetSettings(): Observable<BudgetSettings | null> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return of(null);

    const q = query(
      this.budgetSettingsCollection,
      where('userId', '==', currentUser.id)
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map((settings: any[]) => {
        if (settings.length > 0) {
          const budgetSettings = settings[0] as BudgetSettings;
          this.budgetSettings.set(budgetSettings);
          return budgetSettings;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching budget settings:', error);
        return of(null);
      })
    );
  }

  // Update budget settings
  updateBudgetSettings(settings: Partial<BudgetSettings>): Observable<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to update budget settings');
    }

    this.loading.set(true);
    this.error.set(null);

    return this.getBudgetSettings().pipe(
      switchMap(existingSettings => {
        if (existingSettings) {
          // Update existing settings
          const q = query(
            this.budgetSettingsCollection,
            where('userId', '==', currentUser.id)
          );
          return collectionData(q, { idField: 'id' }).pipe(
            switchMap((docs: any[]) => {
              if (docs.length > 0) {
                const docRef = doc(this.firestore, 'budgetSettings', docs[0].id);
                return from(updateDoc(docRef, settings));
              }
              throw new Error('Settings document not found');
            })
          );
        } else {
          // Create new settings
          const defaultSettings: BudgetSettings = {
            warningThreshold: 80,
            dangerThreshold: 95,
            autoTransferUnusedBudget: false,
            allowOverBudgetSpending: true,
            enableBudgetAlerts: true,
            customMonthStartDate: 1,
            customMonthEndDate: 31,
            ...settings
          };
          
          return from(addDoc(this.budgetSettingsCollection, {
            ...defaultSettings,
            userId: currentUser.id
          })).pipe(map(() => undefined));
        }
      }),
      map(() => {
        console.log('Budget settings updated successfully');
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('Error updating budget settings:', error);
        this.loading.set(false);
        this.error.set('Failed to update budget settings');
        throw error;
      })
    );
  }

  // Utility methods
  private convertTimestampsToDate(budget: any): Budget {
    return {
      ...budget,
      createdAt: budget.createdAt?.toDate?.() || budget.createdAt,
      updatedAt: budget.updatedAt?.toDate?.() || budget.updatedAt
    };
  }

  // Get current month period
  getCurrentMonthPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Create new budget
  createBudget(budgetData: BudgetData): Observable<string> {
    this.loading.set(true);
    this.error.set(null);

    const now = Timestamp.now();
    
    return from(addDoc(this.budgetsCollection, {
      ...budgetData,
      createdAt: now,
      updatedAt: now
    })).pipe(
      map(docRef => {
        console.log('Budget created successfully:', docRef.id);
        this.loading.set(false);
        return docRef.id;
      }),
      catchError(error => {
        console.error('Error creating budget:', error);
        this.loading.set(false);
        this.error.set('Failed to create budget');
        throw error;
      })
    );
  }

  // Set budget for a specific category
  setBudgetForCategory(categoryId: string, amount: number): Observable<string> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to set category budgets');
    }

    this.loading.set(true);
    this.error.set(null);

    const currentPeriod = this.getCurrentMonthPeriod();
    
    // Check if budget already exists for this category and period
    const existingBudgets = this.budgets().filter(
      budget => budget.categoryId === categoryId && budget.monthPeriod === currentPeriod
    );

    if (existingBudgets.length > 0) {
      // Update existing budget
      const existingBudget = existingBudgets[0];
      return this.updateBudget(existingBudget.id, { budgetAmount: amount }).pipe(
        map(() => existingBudget.id)
      );
    } else {
      // Create new budget
      const budgetData: BudgetData = {
        categoryId,
        monthPeriod: currentPeriod,
        budgetAmount: amount,
        spentAmount: 0,
        remainingAmount: amount,
        accountBalance: 0,
        isOverBudget: false,
        overBudgetAmount: 0,
        userId: currentUser.id
      };

      return this.createBudget(budgetData);
    }
  }

  // Clear error state
  clearError(): void {
    this.error.set(null);
  }
}