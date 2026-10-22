import { ClientSession, Types } from 'mongoose';
import {
  ISavePlan,
  Item,
  SavePlan,
  SavePlanCategory,
} from '../models';
import { adjustGrossBalance, getFinancialOverview } from './balanceService';
import { withTransaction } from './transactionHelper';

export interface CreateSavePlanDTO {
  title: string;
  category: SavePlanCategory;
  targetAmount: number;
  initialDeposit?: number;
  linkedItemIds?: string[];
}

/**
 * Creates a new save plan.
 * Validates that initial deposit does not exceed available Net Spendable Balance.
 * Links registry items if specified.
 */
export const createSavePlan = async (
  userId: string,
  data: CreateSavePlanDTO,
  session?: ClientSession
): Promise<ISavePlan> => {
  const initialDeposit = data.initialDeposit || 0;

  if (initialDeposit < 0) {
    throw new Error('[SavePlanService] Initial deposit cannot be negative.');
  }

  if (data.targetAmount < 1) {
    throw new Error('[SavePlanService] Target amount must be at least 1 cent.');
  }

  return withTransaction(async (activeSession) => {
    // Guardrail: Ensure initial deposit does not exceed net spendable balance
    if (initialDeposit > 0) {
      const { netSpendableBalance } = await getFinancialOverview(userId, activeSession);
      if (initialDeposit > netSpendableBalance) {
        throw new Error(
          `[SavePlanService] Insufficient spendable funds: Initial deposit (${initialDeposit}) exceeds Net Spendable Balance (${netSpendableBalance}).`
        );
      }
    }

    const createdPlans = await SavePlan.create(
      [
        {
          userId: new Types.ObjectId(userId),
          title: data.title,
          category: data.category,
          targetAmount: data.targetAmount,
          currentSaved: initialDeposit,
          status: 'active',
          completedAt: null,
        },
      ],
      { session: activeSession }
    );

    const plan = createdPlans[0];

    // Link registry items if provided
    if (data.linkedItemIds && data.linkedItemIds.length > 0) {
      await Item.updateMany(
        {
          _id: { $in: data.linkedItemIds.map((id) => new Types.ObjectId(id)) },
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
 * Funds an active save plan.
 * Guardrail: Verifies amount <= Net Spendable Balance.
 * Automatically marks completed and deducts cash from gross balance if target is fulfilled.
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
    const { netSpendableBalance } = await getFinancialOverview(userId, activeSession);
    if (amount > netSpendableBalance) {
      throw new Error(
        `[SavePlanService] Insufficient spendable funds: Deposit (${amount}) exceeds Net Spendable Balance (${netSpendableBalance}).`
      );
    }

    const plan = await SavePlan.findOne({
      _id: new Types.ObjectId(planId),
      userId: new Types.ObjectId(userId),
    }).session(activeSession);

    if (!plan) {
      throw new Error(`[SavePlanService] Save plan not found: ${planId}`);
    }

    if (plan.status !== 'active') {
      throw new Error(`[SavePlanService] Cannot fund plan with status: "${plan.status}".`);
    }

    plan.currentSaved += amount;

    // Auto-complete check: If goal is met, transition to completed and cash out from gross balance
    if (plan.currentSaved >= plan.targetAmount) {
      plan.status = 'completed';
      plan.completedAt = new Date();
      await adjustGrossBalance(userId, -plan.currentSaved, activeSession);
    }

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

    if (plan.status !== 'active') {
      throw new Error(`[SavePlanService] Only active plans can be canceled (current: ${plan.status}).`);
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

    if (plan.status !== 'active') {
      throw new Error(`[SavePlanService] Only active plans can be completed (current: ${plan.status}).`);
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
