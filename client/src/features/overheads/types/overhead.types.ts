export type OverheadStatus = 'paid' | 'unpaid';

export interface OverheadBill {
  id: string;
  userId: string;
  title: string;          // e.g., "Rent", "Gym", "Internet", "Apple Music"
  amount: number;         // e.g., 200, 20
  dueDay: number;         // 1 to 31 (day of month)
  status: OverheadStatus; // 'paid' | 'unpaid'
  iconKey?: string;       // e.g., 'home', 'dumbbell', 'wifi', 'music', 'key', 'flash', 'shield'
  isRecurring: boolean;
  notes?: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOverheadPayload {
  title: string;
  amount: number;
  dueDay: number;
  isRecurring?: boolean;
  notes?: string;
  iconKey?: string;
}

export interface OverheadSummary {
  totalUnpaid: number;
  totalPaid: number;
  totalMonthly: number;
  billsCount: number;
  unpaidCount: number;
  percentagePaid: number;
}
