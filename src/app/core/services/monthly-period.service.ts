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
  getDocs,
  limit
} from '@angular/fire/firestore';
import { Observable, from, map, catchError, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { MonthlyPeriod, MonthlyPeriodData, PeriodSettings, PeriodSettingsData } from '../models/monthly-period.model';

@Injectable({
  providedIn: 'root'
})
export class MonthlyPeriodService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  
  // Firestore collections
  private readonly monthlyPeriodsCollection = collection(this.firestore, 'monthlyPeriods');
  private readonly periodSettingsCollection = collection(this.firestore, 'periodSettings');
  
  // Signals for reactive state
  readonly monthlyPeriods = signal<MonthlyPeriod[]>([]);
  readonly currentPeriod = signal<MonthlyPeriod | null>(null);
  readonly periodSettings = signal<PeriodSettings | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  
  // Computed values
  readonly activePeriod = computed(() => {
    const periods = this.monthlyPeriods();
    return periods.find(period => period.isActive) || null;
  });

  readonly availablePeriods = computed(() => 
    this.monthlyPeriods().sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
  );

  // Get user's period settings
  getUserPeriodSettings(): Observable<PeriodSettings | null> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.error.set('User not authenticated');
      return of(null);
    }

    const q = query(
      this.periodSettingsCollection,
      where('userId', '==', currentUser.id),
      limit(1)
    );
    
    return collectionData(q, { idField: 'id' }).pipe(
      map((settings: any[]) => {
        const setting = settings.length > 0 ? this.convertTimestampsToDate(settings[0]) as PeriodSettings : null;
        this.periodSettings.set(setting);
        return setting;
      }),
      catchError(error => {
        console.error('Error fetching period settings:', error);
        this.error.set('Failed to load period settings: ' + error.message);
        return of(null);
      })
    );
  }

  // Get user's monthly periods
  getUserMonthlyPeriods(): Observable<MonthlyPeriod[]> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.error.set('User not authenticated');
      return of([]);
    }

    const q = query(
      this.monthlyPeriodsCollection,
      where('userId', '==', currentUser.id),
      orderBy('startDate', 'desc')
    );
    
    return collectionData(q, { idField: 'id' }).pipe(
      map((periods: any[]) => {
        const processed = periods.map(period => this.convertTimestampsToDate(period) as MonthlyPeriod);
        this.monthlyPeriods.set(processed);
        
        // Set current active period
        const active = processed.find(p => p.isActive);
        this.currentPeriod.set(active || null);
        
        return processed;
      }),
      catchError(error => {
        console.error('Error fetching monthly periods:', error);
        this.error.set('Failed to load monthly periods: ' + error.message);
        return of([]);
      })
    );
  }

  // Initialize period settings for user
  initializePeriodSettings(customStartDay: number = 1): Observable<string> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to initialize period settings');
    }

    this.loading.set(true);
    this.error.set(null);

    const now = Timestamp.now();
    const settingsData: any = {
      userId: currentUser.id,
      monthStartDay: customStartDay,
      isCustomPeriod: customStartDay !== 1,
      createdAt: now,
      updatedAt: now
    };

    return from(addDoc(this.periodSettingsCollection, settingsData)).pipe(
      map(docRef => {
        console.log('Period settings initialized:', docRef.id);
        this.loading.set(false);
        return docRef.id;
      }),
      switchMap(settingsId => {
        // Create first period based on settings
        return this.createCurrentPeriod().pipe(
          map(() => settingsId)
        );
      }),
      catchError(error => {
        console.error('Error initializing period settings:', error);
        this.loading.set(false);
        this.error.set('Failed to initialize period settings');
        throw error;
      })
    );
  }

  // Update period settings
  updatePeriodSettings(settingsId: string, updates: Partial<PeriodSettingsData>): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    const docRef = doc(this.firestore, 'periodSettings', settingsId);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    return from(updateDoc(docRef, updateData)).pipe(
      map(() => {
        console.log('Period settings updated successfully:', settingsId);
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('Error updating period settings:', error);
        this.loading.set(false);
        this.error.set('Failed to update period settings');
        throw error;
      })
    );
  }

  // Create a new monthly period
  createMonthlyPeriod(data: MonthlyPeriodData): Observable<string> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to create monthly periods');
    }

    this.loading.set(true);
    this.error.set(null);

    const now = Timestamp.now();
    const periodData: any = {
      ...data,
      userId: currentUser.id,
      startDate: Timestamp.fromDate(data.startDate),
      endDate: Timestamp.fromDate(data.endDate),
      createdAt: now,
      updatedAt: now
    };

    return from(addDoc(this.monthlyPeriodsCollection, periodData)).pipe(
      map(docRef => {
        console.log('Monthly period created successfully:', docRef.id);
        this.loading.set(false);
        return docRef.id;
      }),
      catchError(error => {
        console.error('Error creating monthly period:', error);
        this.loading.set(false);
        this.error.set('Failed to create monthly period');
        throw error;
      })
    );
  }

  // Set active period (deactivate others)
  setActivePeriod(periodId: string): Observable<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    this.loading.set(true);
    this.error.set(null);

    // First, deactivate all periods for this user
    const q = query(
      this.monthlyPeriodsCollection,
      where('userId', '==', currentUser.id),
      where('isActive', '==', true)
    );

    return from(getDocs(q)).pipe(
      switchMap(querySnapshot => {
        const batch: Promise<void>[] = [];
        
        // Deactivate all currently active periods
        querySnapshot.docs.forEach(docSnapshot => {
          if (docSnapshot.id !== periodId) {
            const docRef = doc(this.firestore, 'monthlyPeriods', docSnapshot.id);
            batch.push(updateDoc(docRef, { isActive: false, updatedAt: Timestamp.now() }));
          }
        });

        // Activate the selected period
        const selectedDocRef = doc(this.firestore, 'monthlyPeriods', periodId);
        batch.push(updateDoc(selectedDocRef, { isActive: true, updatedAt: Timestamp.now() }));

        return Promise.all(batch);
      }),
      map(() => {
        console.log('Active period updated:', periodId);
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('Error setting active period:', error);
        this.loading.set(false);
        this.error.set('Failed to set active period');
        throw error;
      })
    );
  }

  // Create current period based on settings
  createCurrentPeriod(): Observable<string> {
    return this.getUserPeriodSettings().pipe(
      switchMap(settings => {
        if (!settings) {
          throw new Error('Period settings not found');
        }

        const now = new Date();
        const { startDate, endDate, label } = this.calculatePeriodDates(now, settings.monthStartDay);
        
        const periodData: MonthlyPeriodData = {
          startDate,
          endDate,
          label,
          isActive: true,
          userId: settings.userId
        };

        return this.createMonthlyPeriod(periodData);
      })
    );
  }

  // Calculate period dates based on settings
  private calculatePeriodDates(referenceDate: Date, startDay: number): { startDate: Date, endDate: Date, label: string } {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    
    if (startDay === 1) {
      // Calendar month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0); // Last day of month
      const label = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      return { startDate, endDate, label };
    } else {
      // Custom period
      const today = referenceDate.getDate();
      
      let periodStartDate: Date;
      let periodEndDate: Date;
      
      if (today >= startDay) {
        // Current custom period
        periodStartDate = new Date(year, month, startDay);
        periodEndDate = new Date(year, month + 1, startDay - 1);
      } else {
        // Previous custom period
        periodStartDate = new Date(year, month - 1, startDay);
        periodEndDate = new Date(year, month, startDay - 1);
      }
      
      const label = `${periodStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${periodEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      
      return { 
        startDate: periodStartDate, 
        endDate: periodEndDate, 
        label 
      };
    }
  }

  // Get current active period
  getCurrentPeriod(): Observable<MonthlyPeriod | null> {
    return this.getUserMonthlyPeriods().pipe(
      map(periods => periods.find(p => p.isActive) || null)
    );
  }

  // Check if date falls within a period
  isDateInPeriod(date: Date, period: MonthlyPeriod): boolean {
    return date >= period.startDate && date <= period.endDate;
  }

  // Get period for a specific date
  getPeriodForDate(date: Date): MonthlyPeriod | null {
    const periods = this.monthlyPeriods();
    return periods.find(period => this.isDateInPeriod(date, period)) || null;
  }

  // Generate periods for the next N months
  generateFuturePeriods(monthsAhead: number = 12): Observable<string[]> {
    return this.getUserPeriodSettings().pipe(
      switchMap(settings => {
        if (!settings) {
          throw new Error('Period settings not found');
        }

        const periodPromises: Promise<string>[] = [];
        const now = new Date();
        
        for (let i = 1; i <= monthsAhead; i++) {
          const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
          const { startDate, endDate, label } = this.calculatePeriodDates(futureDate, settings.monthStartDay);
          
          const periodData: MonthlyPeriodData = {
            startDate,
            endDate,
            label,
            isActive: false,
            userId: settings.userId
          };

          periodPromises.push(
            this.createMonthlyPeriod(periodData).toPromise()
              .then(id => id || '')
          );
        }

        return Promise.all(periodPromises);
      }),
      map(ids => ids.filter(id => id))
    );
  }

  // Helper method to convert Firestore timestamps to Date objects
  private convertTimestampsToDate(data: any): any {
    return {
      ...data,
      startDate: data.startDate?.toDate?.() || data.startDate,
      endDate: data.endDate?.toDate?.() || data.endDate,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
    };
  }

  // Clear error state
  clearError(): void {
    this.error.set(null);
  }
}