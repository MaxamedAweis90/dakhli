import { Schema, model, Document, Types } from 'mongoose';

export interface IOverheadMonthlyRecord extends Document {
  overheadItemId: Types.ObjectId;
  userId: Types.ObjectId;
  monthKey: string;
  billedAmount: number;
  isPaid: boolean;
  paidAt?: Date | null;
  createdAt: Date;
}

const overheadMonthlyRecordSchema = new Schema<IOverheadMonthlyRecord>(
  {
    overheadItemId: {
      type: Schema.Types.ObjectId,
      ref: 'OverheadItem',
      required: [true, 'Overhead item ID is required'],
      index: true,
    },
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
    billedAmount: {
      type: Number,
      required: [true, 'Billed amount is required'],
      min: [0, 'Billed amount must be non-negative'],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: 'overhead_monthly_records',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

overheadMonthlyRecordSchema.index({ overheadItemId: 1, monthKey: 1 }, { unique: true });
overheadMonthlyRecordSchema.index({ userId: 1, monthKey: 1 });

export const OverheadMonthlyRecord = model<IOverheadMonthlyRecord>(
  'OverheadMonthlyRecord',
  overheadMonthlyRecordSchema
);
