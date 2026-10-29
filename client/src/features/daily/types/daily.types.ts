export type DailyStatus = 'under_budget' | 'on_budget' | 'over_budget';

export interface DailyRecord {
  id: string;
  userId: string;
  date: string;          // ISO string or 'YYYY-MM-DD'
  cap: number;           // Planned spending cap for the day (e.g., $45.00)
  spent: number;         // Actual amount spent
  savedDelta: number;    // Calculated: cap - spent (positive = saved, negative = deficit)
  status: DailyStatus;   // 'under_budget' | 'on_budget' | 'over_budget'
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckOffPayload {
  date: string;          // Default to today 'YYYY-MM-DD'
  cap: number;
  spent: number;
  note?: string;
}

export interface DailySummary {
  todayRecord: DailyRecord | null;
  currentStreak: number;
  monthlySavedFromDaily: number;
  recentLogs: DailyRecord[];
}
