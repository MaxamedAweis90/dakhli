import { Schema, model, Document, Types } from 'mongoose';

export interface IBalance extends Document {
  userId: Types.ObjectId;
  grossBalance: number;
  baseMonthlyIncome: number;
  paydayAnchor: number;
  currency: string;
  overheadAutoGenerate: boolean;
  defaultDailyCap: number;
  warningThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const balanceSchema = new Schema<IBalance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    grossBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    baseMonthlyIncome: {
      type: Number,
      required: true,
      default: 0,
    },
    paydayAnchor: {
      type: Number,
      required: [true, 'Payday anchor is required'],
      min: [1, 'Payday anchor must be between 1 and 31'],
      max: [31, 'Payday anchor must be between 1 and 31'],
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      trim: true,
    },
    overheadAutoGenerate: {
      type: Boolean,
      default: true,
    },
    defaultDailyCap: {
      type: Number,
      default: 30,
      min: [0, 'Default daily cap cannot be negative'],
    },
    warningThreshold: {
      type: Number,
      default: 80,
      min: [1, 'Warning threshold must be between 1 and 100'],
      max: [100, 'Warning threshold must be between 1 and 100'],
    },
  },
  {
    collection: 'balances',
    timestamps: true,
  }
);

export const Balance = model<IBalance>('Balance', balanceSchema);
