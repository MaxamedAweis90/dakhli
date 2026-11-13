import { ClientSession, Types } from 'mongoose';
import {
  Balance,
  ISavePlan,
  Item,
  ReserveSourceBalance,
  SavePlan,
  SavePlanCategory,
  SavePlanStatus,
  SavePlanType,
  User,
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
  isSystemDefault?: boolean;
  isRemovable?: boolean;
  monthlyDeduction?: number;
  targetCycleWindow?: string | number | null;
  sourceBalance?: ReserveSourceBalance;
  cumulativeTotal?: number;
  cutDay?: number;
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
          monthlyContribution: data.monthlyContribution ?? data.monthlyDeduction,
          iconKey: data.iconKey,
          targetDate: data.targetDate,
          isPinned: data.isPinned !== undefined ? data.isPinned : true,
          linkedItemId: data.linkedItemId,
          linkedItemName: data.linkedItemName,
          status: 'active',
          completedAt: null,
          isSystemDefault: Boolean(data.isSystemDefault),
          isRemovable: data.isRemovable !== undefined ? data.isRemovable : !data.isSystemDefault,
          monthlyDeduction: data.monthlyDeduction ?? data.monthlyContribution ?? 0,
          targetCycleWindow: data.targetCycleWindow ?? 'PERPETUAL',
          sourceBalance: data.sourceBalance ?? 'BASELINE_INCOME',
          cumulativeTotal: data.cumulativeTotal ?? initialDeposit,
          cutDay: data.cutDay,
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
    isSystemDefault: boolean;
    isRemovable: boolean;
    monthlyDeduction: number;
    targetCycleWindow: string | number | null;
    sourceBalance: ReserveSourceBalance;
    cumulativeTotal: number;
    cutDay: number;
    lastCutMonth: string;
    lastCutDate: Date | null;
    pausedMonth: string | null;
    pausedAt: Date | null;
    cutsCompleted: number;
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

/**
 * Processes automated monthly buffer cut for Save for Life (System Baseline Reserve).
 * - Auto-unpauses if month has ended since it was paused.
 * - Deducts from baseline/balance on cutDay (anchored to salary day from Settings).
 * - Allocates funds into Save for Life (cumulativeTotal and currentSaved).
 */
export const processSystemReserveMonthlyCut = async (
  userId: string,
  session?: ClientSession
): Promise<ISavePlan | null> => {
  return withTransaction(async (activeSession) => {
    const plan = await SavePlan.findOne({
      userId: new Types.ObjectId(userId),
      isSystemDefault: true,
    }).session(activeSession);

    if (!plan) {
      return null;
    }

    const now = new Date();
    const currentMonthKey = now.toISOString().slice(0, 7); // 'YYYY-MM'
    const todayDay = now.getDate();

    // Check if current month is dormant
    const user = await User.findById(new Types.ObjectId(userId)).session(activeSession);
    if (user?.dormantCycles?.includes(currentMonthKey)) {
      return plan;
    }

    // 1. Auto-unpause if paused in an earlier month
    // "if this month end it unpauses auto so charging next month will happen until user pause it"
    if (
      (plan.status === 'PAUSED' || plan.status === 'paused') &&
      plan.pausedMonth &&
      currentMonthKey > plan.pausedMonth
    ) {
      plan.status = 'ACTIVE';
      plan.pausedMonth = undefined;
      plan.pausedAt = null;
      await plan.save({ session: activeSession });
    }

    // 2. If plan is active, check if monthly cut is due
    const isActive = plan.status === 'ACTIVE' || plan.status === 'active';
    if (!isActive) {
      return plan;
    }

    // Check fixed duration window if configured
    if (typeof plan.targetCycleWindow === 'number' && plan.targetCycleWindow > 0) {
      if ((plan.cutsCompleted || 0) >= plan.targetCycleWindow) {
        plan.status = 'completed';
        plan.completedAt = now;
        await plan.save({ session: activeSession });
        return plan;
      }
    }

    // Determine cutDay: from plan, or balance.paydayAnchor, or default 25
    let cutDay = plan.cutDay;
    if (!cutDay || cutDay < 1 || cutDay > 31) {
      const balance = await Balance.findOne({ userId: new Types.ObjectId(userId) }).session(activeSession);
      cutDay = balance?.paydayAnchor ?? 25;
      plan.cutDay = cutDay;
    }

    // 3. If today is on or past the cut day for this month and hasn't been cut yet this month
    if (todayDay >= cutDay && plan.lastCutMonth !== currentMonthKey) {
      const cutAmount = Number(plan.monthlyDeduction ?? plan.monthlyContribution ?? 0);
      if (cutAmount > 0) {
        plan.cumulativeTotal = (plan.cumulativeTotal || 0) + cutAmount;
        plan.currentSaved = plan.cumulativeTotal;
        plan.lastCutMonth = currentMonthKey;
        plan.lastCutDate = now;
        plan.cutsCompleted = (plan.cutsCompleted || 0) + 1;

        if (typeof plan.targetCycleWindow === 'number' && plan.cutsCompleted >= plan.targetCycleWindow) {
          plan.status = 'completed';
          plan.completedAt = now;
        }

        await plan.save({ session: activeSession });
      }
    }

    // 4. Process all Active Targeted Save Plans with monthly cuts
    // Handles unbalanced cuts: cuts full amount until the final month, where it cuts only the remainder to complete
    const targetedPlans = await SavePlan.find({
      userId: new Types.ObjectId(userId),
      isSystemDefault: { $ne: true },
      status: { $in: ['active', 'ACTIVE'] },
      $or: [
        { monthlyContribution: { $gt: 0 } },
        { monthlyDeduction: { $gt: 0 } },
      ],
    }).session(activeSession);

    for (const targetPlan of targetedPlans) {
      const targetCutDay = targetPlan.cutDay || cutDay;
      if (todayDay >= targetCutDay && targetPlan.lastCutMonth !== currentMonthKey) {
        const target = Number(targetPlan.targetAmount || 0);
        const current = Number(targetPlan.currentSaved || 0);
        const remaining = Math.max(0, target - current);

        if (remaining <= 0) {
          targetPlan.status = 'completed';
          targetPlan.completedAt = now;
          await targetPlan.save({ session: activeSession });
          continue;
        }

        const configuredCut = Number(targetPlan.monthlyContribution ?? targetPlan.monthlyDeduction ?? 0);
        if (configuredCut > 0) {
          // Unbalanced cut: only cut the remaining amount needed to reach target
          const actualCut = Math.min(configuredCut, remaining);
          targetPlan.currentSaved = current + actualCut;
          targetPlan.lastCutMonth = currentMonthKey;
          targetPlan.lastCutDate = now;
          targetPlan.cutsCompleted = (targetPlan.cutsCompleted || 0) + 1;

          if (targetPlan.currentSaved >= target) {
            targetPlan.status = 'completed';
            targetPlan.completedAt = now;
          }

          await targetPlan.save({ session: activeSession });
        }
      }
    }

    // 5. For deactivated targeted save plans: if today is on or past the cut day,
    // mark lastCutMonth as currentMonthKey without deducting anything, considering this month skipped.
    const deactivatedPlans = await SavePlan.find({
      userId: new Types.ObjectId(userId),
      isSystemDefault: { $ne: true },
      status: 'deactivated',
      $or: [
        { monthlyContribution: { $gt: 0 } },
        { monthlyDeduction: { $gt: 0 } },
      ],
    }).session(activeSession);

    for (const deactPlan of deactivatedPlans) {
      const targetCutDay = deactPlan.cutDay || cutDay;
      if (todayDay >= targetCutDay && deactPlan.lastCutMonth !== currentMonthKey) {
        deactPlan.lastCutMonth = currentMonthKey;
        await deactPlan.save({ session: activeSession });
      }
    }

    return plan;
  }, session);
};
