import { Schema, model, Document, Types } from 'mongoose';

export type SavePlanCategory = 'emergency' | 'general' | 'item_funding';
export type SavePlanStatus =
  | 'active'
  | 'completed'
  | 'canceled'
  | 'cancelled'
  | 'deactivated'
  | 'paused'
  | 'ACTIVE'
  | 'PAUSED';
export type SavePlanType = 'targeted' | 'general_life' | 'system_baseline';
export type ReserveSourceBalance = 'BASELINE_INCOME' | 'LIQUID_BALANCE';

export interface ISavePlan extends Document {
  userId: Types.ObjectId;
  title: string;
  category: SavePlanCategory;
  type?: SavePlanType;
  targetAmount: number;
  currentSaved: number;
  monthlyContribution?: number;
  iconKey?: string;
  targetDate?: string;
  isPinned?: boolean;
  linkedItemId?: string;
  linkedItemName?: string;
  status: SavePlanStatus;
  completedAt?: Date | null;
  // Cumulative Baseline Reserve specific fields:
  isSystemDefault?: boolean;
  isRemovable?: boolean;
  monthlyDeduction?: number;
  targetCycleWindow?: string | number | null;
  sourceBalance?: ReserveSourceBalance;
  cumulativeTotal?: number;
  createdAt: Date;
  updatedAt: Date;
}

const savePlanSchema = new Schema<ISavePlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'general',
      enum: {
        values: ['emergency', 'general', 'item_funding'],
        message: '{VALUE} is not a valid save plan category',
      },
    },
    type: {
      type: String,
      default: 'targeted',
      enum: ['targeted', 'general_life', 'system_baseline'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be at least 1 cent'],
    },
    currentSaved: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Current saved cannot be negative'],
    },
    monthlyContribution: {
      type: Number,
      default: undefined,
    },
    iconKey: {
      type: String,
      default: undefined,
    },
    targetDate: {
      type: String,
      default: undefined,
    },
    isPinned: {
      type: Boolean,
      default: true,
    },
    linkedItemId: {
      type: String,
      default: undefined,
    },
    linkedItemName: {
      type: String,
      default: undefined,
    },
    status: {
      type: String,
      required: true,
      default: 'active',
      enum: {
        values: [
          'active',
          'completed',
          'canceled',
          'cancelled',
          'deactivated',
          'paused',
          'ACTIVE',
          'PAUSED',
        ],
        message: '{VALUE} is not a valid save plan status',
      },
    },
    completedAt: {
      type: Date,
      default: null,
    },
    isSystemDefault: {
      type: Boolean,
      default: false,
    },
    isRemovable: {
      type: Boolean,
      default: true,
    },
    monthlyDeduction: {
      type: Number,
      default: 0,
    },
    targetCycleWindow: {
      type: Schema.Types.Mixed,
      default: 'PERPETUAL',
    },
    sourceBalance: {
      type: String,
      enum: ['BASELINE_INCOME', 'LIQUID_BALANCE'],
      default: 'BASELINE_INCOME',
    },
    cumulativeTotal: {
      type: Number,
      default: 0,
      min: [0, 'Cumulative total cannot be negative'],
    },
  },
  {
    collection: 'save_plans',
    timestamps: true,
  }
);

savePlanSchema.index({ userId: 1, status: 1 });

export const SavePlan = model<ISavePlan>('SavePlan', savePlanSchema);
