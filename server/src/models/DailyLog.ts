import { Schema, model, Document, Types } from 'mongoose';

export type DailyLogStatus = 'on_budget' | 'under_budget' | 'over_budget';

export interface IDailyLog extends Document {
  userId: Types.ObjectId;
  date: string;
  monthKey: string;
  plannedCap: number;
  actualSpend: number;
  variance: number;
  status: DailyLogStatus;
  notes?: string;
  createdAt: Date;
}

const dailyLogSchema = new Schema<IDailyLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must match format YYYY-MM-DD'],
      trim: true,
    },
    monthKey: {
      type: String,
      required: [true, 'Month key is required'],
      match: [/^\d{4}-\d{2}$/, 'Month key must match format YYYY-MM'],
      trim: true,
    },
    plannedCap: {
      type: Number,
      required: [true, 'Planned cap is required'],
      min: [0, 'Planned cap must be non-negative'],
    },
    actualSpend: {
      type: Number,
      required: [true, 'Actual spend is required'],
      min: [0, 'Actual spend must be non-negative'],
    },
    variance: {
      type: Number,
      required: [true, 'Variance is required'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['on_budget', 'under_budget', 'over_budget'],
        message: '{VALUE} is not a valid daily log status',
      },
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    collection: 'daily_logs',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyLogSchema.index({ userId: 1, monthKey: 1 });

export const DailyLog = model<IDailyLog>('DailyLog', dailyLogSchema);
