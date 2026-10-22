import { Schema, model, Document, Types } from 'mongoose';

export interface IIncomeAdjustment extends Document {
  userId: Types.ObjectId;
  monthKey: string;
  bonusAmount: number;
  notes?: string;
  receivedAt: Date;
}

const incomeAdjustmentSchema = new Schema<IIncomeAdjustment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    monthKey: {
      type: String,
      required: [true, 'Month key is required'],
      match: [/^\d{4}-\d{2}$/, 'Month key must match format YYYY-MM'],
      trim: true,
    },
    bonusAmount: {
      type: Number,
      required: [true, 'Bonus amount is required'],
      min: [0, 'Bonus amount must be non-negative'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'income_adjustments',
    timestamps: false,
  }
);

incomeAdjustmentSchema.index({ userId: 1, monthKey: 1 });

export const IncomeAdjustment = model<IIncomeAdjustment>(
  'IncomeAdjustment',
  incomeAdjustmentSchema
);
