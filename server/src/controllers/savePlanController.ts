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
  const currentAmount = Number(plan.currentSaved || 0);
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

    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (status) {
      query.status = status;
    }

    const plans = await SavePlan.find(query).sort({ createdAt: -1 });

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
    } = req.body;

    const updates: Record<string, any> = {};
    if (title !== undefined || name !== undefined) updates.title = title ?? name;
    if (targetAmount !== undefined) updates.targetAmount = Number(targetAmount);
    if (currentAmount !== undefined || currentSaved !== undefined) {
      updates.currentSaved = Number(currentAmount ?? currentSaved);
    }
    if (status !== undefined) updates.status = status;
    if (isPinned !== undefined) updates.isPinned = Boolean(isPinned);
    if (iconKey !== undefined) updates.iconKey = iconKey;
    if (targetDate !== undefined) updates.targetDate = targetDate;
    if (category !== undefined) updates.category = category;
    if (type !== undefined) updates.type = type;
    if (monthlyContribution !== undefined) updates.monthlyContribution = Number(monthlyContribution);

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

    await SavePlan.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    res.status(200).json({
      success: true,
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};
