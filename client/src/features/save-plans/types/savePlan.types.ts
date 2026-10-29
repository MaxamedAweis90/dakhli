export type SavePlanStatus = 'active' | 'completed' | 'cancelled' | 'canceled' | 'deactivated';
export type SavePlanCategory = 'emergency' | 'general' | 'item_funding';
export type SavePlanType = 'targeted' | 'general_life';

export interface SavePlan {
  id: string;
  userId: string;
  title: string;          // e.g., "Gym", "Education", "Emergency", "MacBook"
  name: string;           // Alias for UI compatibility
  category: SavePlanCategory;
  type: SavePlanType;
  targetAmount: number;   // e.g., 1000.00
  currentAmount: number;  // Current accumulated funds
  currentSaved: number;   // Alias for UI compatibility
  percentage: number;     // 0 - 100 progress percentage
  monthlyContribution?: number;
  linkedItemId?: string;
  linkedItemName?: string;
  isPinned: boolean;
  iconKey?: string;       // e.g., 'dumbbell', 'graduation-cap', 'shield', 'car'
  status: SavePlanStatus;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavePlanPayload {
  title: string;
  name?: string;
  category?: SavePlanCategory;
  type?: SavePlanType;
  targetAmount: number;
  initialDeposit?: number;
  currentAmount?: number;
  currentSaved?: number;
  monthlyContribution?: number;
  linkedItemId?: string;
  linkedItemName?: string;
  linkedItemIds?: string[];
  isPinned?: boolean;
  iconKey?: string;
  targetDate?: string;
}

export interface DepositSavePlanPayload {
  amount: number;         // Amount to allocate from Gross Balance into this plan
}

