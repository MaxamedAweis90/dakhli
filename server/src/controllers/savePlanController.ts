import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { ISavePlan, SavePlan } from '../models';
import {
  cancelSavePlan,
  completeSavePlan,
  createSavePlan,
  fundSavePlan,
  updateSavePlan,
} from '../services/savePlanService';

const formatSavePlan = (plan: ISavePlan) => {
  const targetAmount = Number(plan.targetAmount || 1);
  const currentAmount = Number(plan.cumulativeTotal !== undefined && plan.isSystemDefault ? plan.cumulativeTotal : plan.currentSaved || 0);
  const percentage = Math.min(100, Math.round((currentAmount / targetAmount) * 100));

  return {
    id: plan._id.toString(),
    _id: plan._id.toString(),
    userId: plan.userId.toString(),
    title: plan.title,
    name: plan.title,
    category: plan.category || 'general',
    type: plan.type || 'targeted',
    targetAmount,
    currentAmount,
    currentSaved: currentAmount,
    percentage,
    monthlyContribution: plan.monthlyContribution,
    iconKey: plan.iconKey,
    targetDate: plan.targetDate,
    isPinned: plan.isPinned !== undefined ? plan.isPinned : true,
    linkedItemId: plan.linkedItemId,
    linkedItemName: plan.linkedItemName,
    status: plan.status,
    completedAt: plan.completedAt,
    isSystemDefault: Boolean(plan.isSystemDefault),
    isRemovable: plan.isRemovable !== undefined ? Boolean(plan.isRemovable) : !plan.isSystemDefault,
    monthlyDeduction: Number(plan.monthlyDeduction ?? plan.monthlyContribution ?? 0),
    targetCycleWindow: plan.targetCycleWindow ?? 'PERPETUAL',
    sourceBalance: plan.sourceBalance || 'BASELINE_INCOME',
    cumulativeTotal: Number(plan.cumulativeTotal ?? plan.currentSaved ?? 0),
    createdAt: plan.createdAt ? plan.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: plan.updatedAt ? plan.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const listSavePlans = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const status = req.query.status as string | undefined;

    // Check if user already has a system baseline reserve
    let systemReserve = await SavePlan.findOne({
      userId: new Types.ObjectId(userId),
      isSystemDefault: true,
    });

    if (!systemReserve) {
      // Check if legacy general_life exists and upgrade it
      const legacyGeneral = await SavePlan.findOne({
        userId: new Types.ObjectId(userId),
        type: 'general_life',
      });

      if (legacyGeneral) {
        legacyGeneral.isSystemDefault = true;
        legacyGeneral.isRemovable = false;
        legacyGeneral.monthlyDeduction = legacyGeneral.monthlyDeduction ?? legacyGeneral.monthlyContribution ?? 300;
        legacyGeneral.cumulativeTotal = legacyGeneral.cumulativeTotal ?? legacyGeneral.currentSaved ?? 0;
        legacyGeneral.sourceBalance = legacyGeneral.sourceBalance || 'BASELINE_INCOME';
        legacyGeneral.targetCycleWindow = legacyGeneral.targetCycleWindow || 'PERPETUAL';
        if (legacyGeneral.status === 'active') {
          legacyGeneral.status = 'ACTIVE';
        }
        await legacyGeneral.save();
        systemReserve = legacyGeneral;
      } else {
        // Create initial default system baseline reserve for this user
        systemReserve = await SavePlan.create({
          userId: new Types.ObjectId(userId),
          title: 'Cumulative Baseline Reserve',
          category: 'general',
          type: 'general_life',
          targetAmount: 25000,
          currentSaved: 0,
          cumulativeTotal: 0,
          monthlyDeduction: 300,
          monthlyContribution: 300,
          isSystemDefault: true,
          isRemovable: false,
          isPinned: true,
          status: 'ACTIVE',
          sourceBalance: 'BASELINE_INCOME',
          targetCycleWindow: 'PERPETUAL',
        });
      }
    }

    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (status) {
      query.status = status;
    }

    const plans = await SavePlan.find(query).sort({ isSystemDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: plans.map(formatSavePlan),
    });
  } catch (error) {
    next(error);
  }
};

export const createPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const {
      title,
      name,
      category,
      type,
      targetAmount,
      initialDeposit,
      currentAmount,
      currentSaved,
      monthlyContribution,
      iconKey,
      targetDate,
      isPinned,
      linkedItemId,
      linkedItemName,
      linkedItemIds,
    } = req.body;

    const finalTitle = title || name;
    const finalTarget = targetAmount !== undefined ? Number(targetAmount) : 1000;
    const finalInitialDeposit =
      initialDeposit !== undefined
        ? Number(initialDeposit)
        : currentAmount !== undefined
        ? Number(currentAmount)
        : currentSaved !== undefined
        ? Number(currentSaved)
        : 0;

    if (!finalTitle) {
      res.status(400).json({
        success: false,
        error: { message: 'title is required.' },
      });
      return;
    }

    const plan = await createSavePlan(userId, {
      title: finalTitle,
      category: category || 'general',
      type: type || 'targeted',
      targetAmount: finalTarget,
      initialDeposit: finalInitialDeposit,
      monthlyContribution: monthlyContribution !== undefined ? Number(monthlyContribution) : undefined,
      iconKey,
      targetDate,
      isPinned,
      linkedItemId,
      linkedItemName,
      linkedItemIds,
    });

    res.status(201).json({
      success: true,
      data: formatSavePlan(plan),
    });
  } catch (error) {
    next(error);
  }
};

export const fundPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;
    const { amount } = req.body;

    if (amount === undefined || Number(amount) <= 0) {
      res.status(400).json({
        success: false,
        error: { message: 'Funding amount must be greater than zero.' },
      });
      return;
    }

    const plan = await fundSavePlan(userId, id, Number(amount));

    res.status(200).json({
      success: true,
      data: formatSavePlan(plan),
    });
  } catch (error) {
    next(error);
  }
};

export const cancelPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;

    const plan = await cancelSavePlan(userId, id);

    res.status(200).json({
      success: true,
      data: formatSavePlan(plan),
    });
  } catch (error) {
    next(error);
  }
};

export const completePlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;

    const plan = await completeSavePlan(userId, id);

    res.status(200).json({
      success: true,
      data: formatSavePlan(plan),
    });
  } catch (error) {
    next(error);
  }
};

export const patchPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;
    const {
      title,
      name,
      targetAmount,
      currentAmount,
      currentSaved,
      status,
      isPinned,
      iconKey,
      targetDate,
      category,
      type,
      monthlyContribution,
      monthlyDeduction,
      targetCycleWindow,
      sourceBalance,
      cumulativeTotal,
    } = req.body;

    const updates: Record<string, any> = {};
    if (title !== undefined || name !== undefined) updates.title = title ?? name;
    if (targetAmount !== undefined) updates.targetAmount = Number(targetAmount);
    if (currentAmount !== undefined || currentSaved !== undefined) {
      updates.currentSaved = Number(currentAmount ?? currentSaved);
    }
    if (cumulativeTotal !== undefined) {
      updates.cumulativeTotal = Number(cumulativeTotal);
      if (currentAmount === undefined && currentSaved === undefined) {
        updates.currentSaved = Number(cumulativeTotal);
      }
    }
    if (status !== undefined) updates.status = status;
    if (isPinned !== undefined) updates.isPinned = Boolean(isPinned);
    if (iconKey !== undefined) updates.iconKey = iconKey;
    if (targetDate !== undefined) updates.targetDate = targetDate;
    if (category !== undefined) updates.category = category;
    if (type !== undefined) updates.type = type;
    if (monthlyDeduction !== undefined) {
      updates.monthlyDeduction = Number(monthlyDeduction);
      if (monthlyContribution === undefined) {
        updates.monthlyContribution = Number(monthlyDeduction);
      }
    }
    if (monthlyContribution !== undefined) {
      updates.monthlyContribution = Number(monthlyContribution);
      if (monthlyDeduction === undefined) {
        updates.monthlyDeduction = Number(monthlyContribution);
      }
    }
    if (targetCycleWindow !== undefined) updates.targetCycleWindow = targetCycleWindow;
    if (sourceBalance !== undefined) updates.sourceBalance = sourceBalance;

    const plan = await updateSavePlan(userId, id, updates);

    res.status(200).json({
      success: true,
      data: formatSavePlan(plan),
    });
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;

    const plan = await SavePlan.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!plan) {
      res.status(404).json({
        success: false,
        error: { message: 'Save plan not found' },
      });
      return;
    }

    if (plan.isSystemDefault || plan.isRemovable === false) {
      res.status(403).json({
        success: false,
        error: { message: '403 Forbidden: System baseline reserve cannot be removed' },
      });
      return;
    }

    await SavePlan.findOneAndDelete({
      _id: plan._id,
      userId: plan.userId,
    });

    res.status(200).json({
      success: true,
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};
