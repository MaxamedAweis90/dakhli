import { Schema, model, Document, Types } from 'mongoose';

export type ItemTier = 'essential' | 'future_need' | 'want';
export type ItemStatus = 'planned' | 'bought' | 'removed';

export interface IItem extends Document {
  userId: Types.ObjectId;
  name: string;
  estimatedPrice: number;
  tier: ItemTier;
  status: ItemStatus;
  inSavePlan: boolean;
  savePlanId?: Types.ObjectId | null;
  boughtAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    estimatedPrice: {
      type: Number,
      required: [true, 'Estimated price is required'],
      min: [0, 'Estimated price must be non-negative'],
    },
    tier: {
      type: String,
      required: [true, 'Tier is required'],
      enum: {
        values: ['essential', 'future_need', 'want'],
        message: '{VALUE} is not a valid item tier',
      },
    },
    status: {
      type: String,
      required: true,
      default: 'planned',
      enum: {
        values: ['planned', 'bought', 'removed'],
        message: '{VALUE} is not a valid item status',
      },
    },
    inSavePlan: {
      type: Boolean,
      default: false,
    },
    savePlanId: {
      type: Schema.Types.ObjectId,
      ref: 'SavePlan',
      default: null,
    },
    boughtAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: 'items',
    timestamps: true,
  }
);

itemSchema.index({ userId: 1, tier: 1 });
itemSchema.index({ userId: 1, status: 1 });
itemSchema.index({ savePlanId: 1 });

export const Item = model<IItem>('Item', itemSchema);
