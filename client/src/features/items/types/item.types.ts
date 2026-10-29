export type ItemTier = 'essentials' | 'future_needs' | 'wants';
export type DisplayItemTier = 'Essentials' | 'Future Needs' | 'Wants';
export type ItemStatus = 'planned' | 'bought' | 'cancelled' | 'unbought' | 'removed';

export interface RegistryItem {
  id: string;
  userId: string;
  title: string;          // e.g., "Protein Powder", "MacBook Pro", "Basketball"
  name: string;           // UI alias for title
  targetPrice: number;    // e.g., 45.00, 1999.00
  price: number;          // UI alias for targetPrice
  tier: ItemTier;         // 'essentials' | 'future_needs' | 'wants'
  displayTier: DisplayItemTier; // 'Essentials' | 'Future Needs' | 'Wants'
  status: ItemStatus;     // 'planned' | 'bought' | 'cancelled'
  imageUrl: string;       // Image URL or placeholder icon identifier
  iconKey?: string;       // e.g., 'bottle', 'laptop', 'activity', 'tag'
  notes?: string;
  tag?: string;
  inSavePlan?: boolean;
  savePlanId?: string | null;
  targetProgress?: number;
  savedAmount?: number;
  boughtDate?: string;
  boughtAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemPayload {
  title: string;
  name?: string;
  targetPrice: number;
  price?: number;
  tier: ItemTier | DisplayItemTier;
  imageUrl?: string;
  iconKey?: string;
  notes?: string;
  tag?: string;
  targetProgress?: number;
}

export interface UpdateItemPayload extends Partial<CreateItemPayload> {
  status?: ItemStatus;
}

