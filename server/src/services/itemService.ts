import { ClientSession, Types } from 'mongoose';
import { IItem, Item, ItemTier, SavePlan } from '../models';
import { adjustGrossBalance } from './balanceService';
import { withTransaction } from './transactionHelper';

export interface TierSummary {
  count: number;
  totalCost: number;
  unboughtCount: number;
  unboughtCost: number;
}

export interface RegistrySummary {
  essential: TierSummary;
  future_need: TierSummary;
  want: TierSummary;
  overallTotal: {
    count: number;
    totalCost: number;
  };
  overallUnbought: {
    count: number;
    totalCost: number;
  };
}

/**
 * Marks a registry item as bought.
 * If the item was not already covered by a completed save plan,
 * its estimatedPrice is deducted directly from grossBalance.
 */
export const markItemBought = async (
  userId: string,
  itemId: string,
  session?: ClientSession
): Promise<IItem> => {
  return withTransaction(async (activeSession) => {
    const item = await Item.findOne({
      _id: new Types.ObjectId(itemId),
      userId: new Types.ObjectId(userId),
    }).session(activeSession);

    if (!item) {
      throw new Error(`[ItemService] Registry item not found: ${itemId}`);
    }

    // Idempotent: Exit early if already bought
    if (item.status === 'bought') {
      return item;
    }

    let coveredByCompletedPlan = false;
    if (item.savePlanId) {
      const plan = await SavePlan.findById(item.savePlanId).session(activeSession);
      if (plan && plan.status === 'completed') {
        coveredByCompletedPlan = true;
      }
    }

    // Deduct directly from gross balance only if not already covered by a completed save plan
    if (!coveredByCompletedPlan && item.estimatedPrice > 0) {
      await adjustGrossBalance(userId, -item.estimatedPrice, activeSession);
    }

    item.status = 'bought';
    item.boughtAt = new Date();
    await item.save({ session: activeSession });

    return item;
  }, session);
};

/**
 * Aggregates registry items grouped by tiers ('essential', 'future_need', 'want').
 * Returns counts and total costs per tier as well as overall unbought figures.
 */
export const getRegistrySummary = async (userId: string): Promise<RegistrySummary> => {
  const items = await Item.find({
    userId: new Types.ObjectId(userId),
    status: { $ne: 'removed' },
  });

  const createInitialTierSummary = (): TierSummary => ({
    count: 0,
    totalCost: 0,
    unboughtCount: 0,
    unboughtCost: 0,
  });

  const summary: RegistrySummary = {
    essential: createInitialTierSummary(),
    future_need: createInitialTierSummary(),
    want: createInitialTierSummary(),
    overallTotal: {
      count: 0,
      totalCost: 0,
    },
    overallUnbought: {
      count: 0,
      totalCost: 0,
    },
  };

  for (const item of items) {
    const tier = item.tier as ItemTier;
    const isUnbought = item.status === 'planned';

    if (summary[tier]) {
      summary[tier].count += 1;
      summary[tier].totalCost += item.estimatedPrice;

      if (isUnbought) {
        summary[tier].unboughtCount += 1;
        summary[tier].unboughtCost += item.estimatedPrice;
      }
    }

    summary.overallTotal.count += 1;
    summary.overallTotal.totalCost += item.estimatedPrice;

    if (isUnbought) {
      summary.overallUnbought.count += 1;
      summary.overallUnbought.totalCost += item.estimatedPrice;
    }
  }

  return summary;
};
