import { Schema, model, Document, Types } from 'mongoose';

export interface IOverheadItem extends Document {
  userId: Types.ObjectId;
  title: string;
  defaultAmount: number;
  dueDate: number;
  iconKey?: string;
  notes?: string;
  isActive: boolean;
  isArchived: boolean;
  archivedAtMonthKey?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const overheadItemSchema = new Schema<IOverheadItem>(
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
    defaultAmount: {
      type: Number,
      required: [true, 'Default amount is required'],
      min: [0, 'Default amount must be non-negative'],
    },
    dueDate: {
      type: Number,
      required: [true, 'Due date is required'],
      min: [1, 'Due date must be between 1 and 31'],
      max: [31, 'Due date must be between 1 and 31'],
    },
    iconKey: {
      type: String,
      default: 'home',
    },
    notes: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAtMonthKey: {
      type: String,
      default: null,
    },
  },
  {
    collection: 'overhead_items',
    timestamps: true,
  }
);

overheadItemSchema.index({ userId: 1, isArchived: 1, createdAt: -1 });
overheadItemSchema.index({ userId: 1, monthKey: 1 });

export const OverheadItem = model<IOverheadItem>('OverheadItem', overheadItemSchema);
