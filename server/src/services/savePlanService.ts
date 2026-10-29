import { ClientSession, Types } from 'mongoose';
import {
  ISavePlan,
  Item,
  SavePlan,
  SavePlanCategory,
  SavePlanStatus,
  SavePlanType,
} from '../models';
import { adjustGrossBalance } from './balanceService';
import { withTransaction } from './transactionHelper';

export interface CreateSavePlanDTO {
  title: string;
  category?: SavePlanCategory;
  type?: SavePlanType;
  targetAmount: number;
  initialDeposit?: number;
  monthlyContribution?: number;
  iconKey?: string;
  targetDate?: string;
  isPinned?: boolean;
  linkedItemId?: string;
  linkedItemName?: string;
  linkedItemIds?: string[];
}

/**
 * Creates a new save plan and links registry items if specified.
 */
export const createSavePlan = async (
  userId: string,
  data: CreateSavePlanDTO,
  session?: ClientSession
): Promise<ISavePlan> => {
  const initialDeposit = Number(data.initialDeposit || 0);

  if (initialDeposit < 0) {
    throw new Error('[SavePlanService] Initial deposit cannot be negative.');
  }

  const targetAmount = Number(data.targetAmount || 1000);
  if (targetAmount < 1) {
    throw new Error('[SavePlanService] Target amount must be at least 1 cent.');
  }

  return withTransaction(async (activeSession) => {
    const createdPlans = await SavePlan.create(
      [
        {
          userId: new Types.ObjectId(userId),
          title: data.title.trim(),
          category: data.category || 'general',
          type: data.type || 'targeted',
          targetAmount,
          currentSaved: initialDeposit,
          monthlyContribution: data.monthlyContribution,
          iconKey: data.iconKey,
          targetDate: data.targetDate,
          isPinned: data.isPinned !== undefined ? data.isPinned : true,
          linkedItemId: data.linkedItemId,
          linkedItemName: data.linkedItemName,
          status: 'active',
          completedAt: null,
        },
      ],
      { session: activeSession }
    );

    const plan = createdPlans[0];

    // Link registry items if provided and valid ObjectIds
    const validItemIds = (data.linkedItemIds || [])
      .concat(data.linkedItemId ? [data.linkedItemId] : [])
      .filter((id) => Types.ObjectId.isValid(id));

    if (validItemIds.length > 0) {
      await Item.updateMany(
        {
          _id: { $in: validItemIds.map((id) => new Types.ObjectId(id)) },
          userId: new Types.ObjectId(userId),
        },
        {
          inSavePlan: true,
          savePlanId: plan._id,
        },
        { session: activeSession }
      );
    }

    return plan;
  }, session);
};

/**
 * Funds / deposits into an active save plan.
 * Allocates funds into currentSaved (which increases totalSaved and reduces netSpendable).
 */
export const fundSavePlan = async (
  userId: string,
  planId: string,
  amount: number,
  session?: ClientSession
): Promise<ISavePlan> => {
  if (amount <= 0) {
    throw new Error('[SavePlanService] Funding amount must be greater than zero.');
  }

  return withTransaction(async (activeSession) => {
    const plan = await SavePlan.findOne({
      _id: new Types.ObjectId(planId),
      userId: new Types.ObjectId(userId),
    }).session(activeSession);

    if (!plan) {
      throw new Error(`[SavePlanService] Save plan not found: ${planId}`);
    }

    if (plan.status === 'canceled' || plan.status === 'cancelled' || plan.status === 'completed') {
      throw new Error(`[SavePlanService] Cannot fund plan with status: "${plan.status}".`);
    }

    plan.currentSaved += Number(amount);
    plan.status = 'active';

    await plan.save({ session: activeSession });
    return plan;
  }, session);
};

/**
 * Cancels an active save plan.
 * Restores locked funds back to Net Spendable Balance immediately without mutating Gross Balance.
 * Unlinks associated registry items.
 */
export const cancelSavePlan = async (
  userId: string,
  planId: string,
  session?: ClientSession
): Promise<ISavePlan> => {
  return withTransaction(async (activeSession) => {
    const plan = await SavePlan.findOne({
      _id: new Types.ObjectId(planId),
      userId: new Types.ObjectId(userId),
    }).session(activeSession);

    if (!plan) {
      throw new Error(`[SavePlanService] Save plan not found: ${planId}`);
    }

    plan.status = 'canceled';
    await plan.save({ session: activeSession });

    // Unlink any associated items
    await Item.updateMany(
      {
        savePlanId: plan._id,
        userId: new Types.ObjectId(userId),
      },
      {
        inSavePlan: false,
        savePlanId: null,
      },
      { session: activeSession }
    );

    return plan;
  }, session);
};

/**
 * Manually fulfills/completes an active save plan.
 * Deducts currentSaved from gross balance (real cash fulfillment).
 */
export const completeSavePlan = async (
  userId: string,
  planId: string,
  session?: ClientSession
): Promise<ISavePlan> => {
  return withTransaction(async (activeSession) => {
    const plan = await SavePlan.findOne({
      _id: new Types.ObjectId(planId),
      userId: new Types.ObjectId(userId),
    }).session(activeSession);

    if (!plan) {
      throw new Error(`[SavePlanService] Save plan not found: ${planId}`);
    }

    if (plan.status === 'completed') {
      return plan;
    }

    plan.status = 'completed';
    plan.completedAt = new Date();
    await plan.save({ session: activeSession });

    if (plan.currentSaved > 0) {
      await adjustGrossBalance(userId, -plan.currentSaved, activeSession);
    }

    return plan;
  }, session);
};

/**
 * Updates save plan fields (status toggle, isPinned, title, targetAmount, etc.).
 */
export const updateSavePlan = async (
  userId: string,
  planId: string,
  updates: Partial<{
    title: string;
    targetAmount: number;
    currentSaved: number;
    status: SavePlanStatus;
    isPinned: boolean;
    iconKey: string;
    targetDate: string;
    category: SavePlanCategory;
    type: SavePlanType;
    monthlyContribution: number;
  }>
): Promise<ISavePlan> => {
  const plan = await SavePlan.findOneAndUpdate(
    {
      _id: new Types.ObjectId(planId),
      userId: new Types.ObjectId(userId),
    },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!plan) {
    throw new Error(`[SavePlanService] Save plan not found: ${planId}`);
  }

  return plan;
};
