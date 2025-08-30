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
import { Observable, from, map, catchError, of } from 'rxjs';
import { AuthService } from './auth.service';
import { 
  Category, 
  Subcategory, 
  MicroCategory, 
  CategoryHierarchy, 
  CategoryStats,
  PREDEFINED_CATEGORIES 
} from '../models/category.model';

export interface CategoryData extends Omit<Category, 'id' | 'createdAt' | 'updatedAt'> {
  userId: string;
}

export interface CategoryFormData extends Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'subcategories'> {
  subcategories?: Omit<Subcategory, 'id' | 'createdAt' | 'updatedAt' | 'categoryId' | 'microCategories'>[];
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  
  // Firestore collections
  private readonly categoriesCollection = collection(this.firestore, 'categories');
  private readonly subcategoriesCollection = collection(this.firestore, 'subcategories');
  private readonly microCategoriesCollection = collection(this.firestore, 'microCategories');
  
  // Signals for reactive state
  readonly categories = signal<Category[]>([]);
  readonly subcategories = signal<Subcategory[]>([]);
  readonly microCategories = signal<MicroCategory[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  
  // Computed values
  readonly activeCategories = computed(() => 
    this.categories().filter(cat => cat.isActive)
  );
  
  readonly categoriesCount = computed(() => this.categories().length);
  
  readonly categoriesWithSubcategories = computed(() => {
    const cats = this.categories();
    const subs = this.subcategories();
    const micros = this.microCategories();
    
    return cats.map(category => ({
      ...category,
      subcategories: subs
        .filter(sub => sub.categoryId === category.id)
        .map(subcategory => ({
          ...subcategory,
          microCategories: micros.filter(micro => micro.subcategoryId === subcategory.id)
        }))
    }));
  });

  // Get categories for current user with real-time updates
  getUserCategories(): Observable<Category[]> {
    const currentUser = this.authService.currentUser();
    console.log('getUserCategories - Current user:', currentUser);
    
    if (!currentUser) {
      console.log('getUserCategories - No current user, returning empty array');
      this.error.set('User not authenticated');
      return of([]);
    }

    const q = query(
      this.categoriesCollection,
      where('userId', '==', currentUser.id),
      orderBy('order', 'asc'),
      orderBy('name', 'asc')
    );
    
    console.log('getUserCategories - Executing Firestore query for user:', currentUser.id);
    console.log('getUserCategories - Collection path:', this.categoriesCollection.path);
    
    return collectionData(q, { idField: 'id' }).pipe(
      map((categories: any[]) => {
        console.log('getUserCategories - Received categories from Firestore:', categories.length);
        console.log('getUserCategories - Categories data:', categories);
        const processedCategories = categories.map(category => this.convertTimestampsToDate(category));
        this.categories.set(processedCategories);
        return processedCategories;
      }),
      catchError(error => {
        console.error('getUserCategories - Error fetching categories:', error);
        console.error('getUserCategories - Error details:', {
          code: error.code,
          message: error.message,
          userId: currentUser.id
        });
        this.error.set('Failed to load categories: ' + error.message);
        return of([]);
      })
    );
  }

  // Get subcategories for a specific category
  getCategorySubcategories(categoryId: string): Observable<Subcategory[]> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return of([]);

    const q = query(
      this.subcategoriesCollection,
      where('categoryId', '==', categoryId),
      orderBy('order', 'asc'),
      orderBy('name', 'asc')
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map((subcategories: any[]) => subcategories.map(sub => this.convertTimestampsToDate(sub))),
      catchError(error => {
        console.error('Error fetching subcategories:', error);
        return of([]);
      })
    );
  }

  // Get micro categories for a specific subcategory
  getSubcategoryMicroCategories(subcategoryId: string): Observable<MicroCategory[]> {
    const q = query(
      this.microCategoriesCollection,
      where('subcategoryId', '==', subcategoryId),
      orderBy('order', 'asc'),
      orderBy('name', 'asc')
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map((microCategories: any[]) => microCategories.map(micro => this.convertTimestampsToDate(micro))),
      catchError(error => {
        console.error('Error fetching micro categories:', error);
        return of([]);
      })
    );
  }

  // Add new category
  addCategory(categoryData: CategoryFormData): Observable<string> {
    const currentUser = this.authService.currentUser();
    console.log('addCategory - Current user:', currentUser);
    
    if (!currentUser) {
      console.error('addCategory - No user authenticated');
      throw new Error('User must be authenticated to add categories');
    }

    this.loading.set(true);
    this.error.set(null);

    const now = Timestamp.now();
    const data: CategoryData = {
      ...categoryData,
      userId: currentUser.id,
      subcategories: []
    };

    console.log('addCategory - Data to save:', data);
    console.log('addCategory - Firestore collection path:', this.categoriesCollection.path);

    return from(addDoc(this.categoriesCollection, {
      ...data,
      createdAt: now,
      updatedAt: now
    })).pipe(
      map(docRef => {
        console.log('Category added successfully with ID:', docRef.id);
        console.log('Document path:', docRef.path);
        this.loading.set(false);
        return docRef.id;
      }),
      catchError(error => {
        console.error('Error adding category:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          userId: currentUser.id
        });
        this.loading.set(false);
        this.error.set('Failed to add category');
        throw error;
      })
    );
  }

  // Add subcategory to a category
  addSubcategory(subcategoryData: Omit<Subcategory, 'id' | 'createdAt' | 'updatedAt' | 'microCategories'>): Observable<string> {
    this.loading.set(true);
    this.error.set(null);

    const now = Timestamp.now();
    const data = {
      ...subcategoryData,
      microCategories: [],
      createdAt: now,
      updatedAt: now
    };

    return from(addDoc(this.subcategoriesCollection, data)).pipe(
      map(docRef => {
        console.log('Subcategory added successfully:', docRef.id);
        this.loading.set(false);
        return docRef.id;
      }),
      catchError(error => {
        console.error('Error adding subcategory:', error);
        this.loading.set(false);
        this.error.set('Failed to add subcategory');
        throw error;
      })
    );
  }

  // Add micro category to a subcategory
  addMicroCategory(microCategoryData: Omit<MicroCategory, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    this.loading.set(true);
    this.error.set(null);

    const now = Timestamp.now();
    const data = {
      ...microCategoryData,
      createdAt: now,
      updatedAt: now
    };

    return from(addDoc(this.microCategoriesCollection, data)).pipe(
      map(docRef => {
        console.log('Micro category added successfully:', docRef.id);
        this.loading.set(false);
        return docRef.id;
      }),
      catchError(error => {
        console.error('Error adding micro category:', error);
        this.loading.set(false);
        this.error.set('Failed to add micro category');
        throw error;
      })
    );
  }

  // Update existing category
  updateCategory(id: string, updates: Partial<CategoryFormData>): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    const docRef = doc(this.firestore, 'categories', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    return from(updateDoc(docRef, updateData)).pipe(
      map(() => {
        console.log('Category updated successfully:', id);
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('Error updating category:', error);
        this.loading.set(false);
        this.error.set('Failed to update category');
        throw error;
      })
    );
  }

  // Update subcategory
  updateSubcategory(id: string, updates: Partial<Omit<Subcategory, 'id' | 'createdAt' | 'updatedAt'>>): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    const docRef = doc(this.firestore, 'subcategories', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    return from(updateDoc(docRef, updateData)).pipe(
      map(() => {
        console.log('Subcategory updated successfully:', id);
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('Error updating subcategory:', error);
        this.loading.set(false);
        this.error.set('Failed to update subcategory');
        throw error;
      })
    );
  }

  // Delete category
  deleteCategory(id: string): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    const docRef = doc(this.firestore, 'categories', id);

    return from(deleteDoc(docRef)).pipe(
      map(() => {
        console.log('Category deleted successfully:', id);
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('Error deleting category:', error);
        this.loading.set(false);
        this.error.set('Failed to delete category');
        throw error;
      })
    );
  }

  // Delete subcategory
  deleteSubcategory(id: string): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    const docRef = doc(this.firestore, 'subcategories', id);

    return from(deleteDoc(docRef)).pipe(
      map(() => {
        console.log('Subcategory deleted successfully:', id);
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('Error deleting subcategory:', error);
        this.loading.set(false);
        this.error.set('Failed to delete subcategory');
        throw error;
      })
    );
  }

  // Delete micro category
  deleteMicroCategory(id: string): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    const docRef = doc(this.firestore, 'microCategories', id);

    return from(deleteDoc(docRef)).pipe(
      map(() => {
        console.log('Micro category deleted successfully:', id);
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('Error deleting micro category:', error);
        this.loading.set(false);
        this.error.set('Failed to delete micro category');
        throw error;
      })
    );
  }

  // Initialize predefined categories for a new user
  initializePredefinedCategories(): Observable<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return of();
    }

    this.loading.set(true);
    const promises: Promise<any>[] = [];

    Object.entries(PREDEFINED_CATEGORIES).forEach(([key, predefined], index) => {
      const categoryData: CategoryData = {
        name: predefined.name,
        description: `Predefined ${predefined.name} category`,
        icon: this.getCategoryIcon(predefined.name),
        color: this.getCategoryColor(index),
        order: index,
        isActive: true,
        userId: currentUser.id,
        subcategories: []
      };

      const categoryPromise = addDoc(this.categoriesCollection, {
        ...categoryData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }).then(categoryRef => {
        // Add subcategories
        const subcategoryPromises = predefined.subcategories.map((subName, subIndex) => {
          return addDoc(this.subcategoriesCollection, {
            name: subName,
            description: `${subName} subcategory`,
            categoryId: categoryRef.id,
            order: subIndex,
            isActive: true,
            microCategories: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        });
        return Promise.all(subcategoryPromises);
      });

      promises.push(categoryPromise);
    });

    return from(Promise.all(promises)).pipe(
      map(() => {
        console.log('Predefined categories initialized successfully');
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('Error initializing predefined categories:', error);
        this.loading.set(false);
        this.error.set('Failed to initialize categories');
        throw error;
      })
    );
  }

  // Get category statistics
  getCategoryStats(): Observable<CategoryStats[]> {
    // This would require integration with expense service to get actual stats
    // For now, return empty array
    return of([]);
  }

  // Utility methods
  private convertTimestampsToDate(item: any): any {
    return {
      ...item,
      createdAt: item.createdAt?.toDate?.() || item.createdAt,
      updatedAt: item.updatedAt?.toDate?.() || item.updatedAt
    };
  }

  private getCategoryIcon(categoryName: string): string {
    const iconMap: Record<string, string> = {
      'Income': '💰',
      'Monthly': '📅',
      'Fruits': '🍎',
      'Gift': '🎁',
      'Medical': '🏥',
      'Tour': '✈️',
      'Emergency': '🚨',
      'Home': '🏠',
      'DK Professional': '💼',
      'Nisha': '👩',
      'DK': '👨',
      'WFO': '🏢',
      'Food & Snack': '🍕'
    };
    return iconMap[categoryName] || '📂';
  }

  private getCategoryColor(index: number): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1',
      '#14B8A6', '#F43F5E', '#22D3EE', '#A855F7', '#059669'
    ];
    return colors[index % colors.length];
  }

  // Clear error state
  clearError(): void {
    this.error.set(null);
  }

  // Get category hierarchy for expense selection
  getCategoryHierarchy(): CategoryHierarchy[] {
    const categoriesWithSubs = this.categoriesWithSubcategories();
    const hierarchy: CategoryHierarchy[] = [];

    categoriesWithSubs.forEach(category => {
      category.subcategories.forEach(subcategory => {
        if (subcategory.microCategories && subcategory.microCategories.length > 0) {
          subcategory.microCategories.forEach(microCategory => {
            hierarchy.push({
              category,
              subcategory,
              microCategory
            });
          });
        } else {
          hierarchy.push({
            category,
            subcategory
          });
        }
      });
    });

    return hierarchy;
  }
}