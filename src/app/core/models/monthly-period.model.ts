export interface MonthlyPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  label: string; // e.g., "Nov 2024", "Dec 1-31, 2024"
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyPeriodData extends Omit<MonthlyPeriod, 'id' | 'createdAt' | 'updatedAt'> {}

export interface PeriodSettings {
  id: string;
  userId: string;
  monthStartDay: number; // 1-28, default 1 for calendar month
  isCustomPeriod: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PeriodSettingsData extends Omit<PeriodSettings, 'id' | 'createdAt' | 'updatedAt'> {}