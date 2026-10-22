import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { SavePlan } from '../models';
import {
  cancelSavePlan,
  completeSavePlan,
  createSavePlan,
  fundSavePlan,
} from '../services/savePlanService';

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
      data: plans,
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
    const { title, category, targetAmount, initialDeposit, linkedItemIds } = req.body;

    if (!title || !category || targetAmount === undefined) {
      res.status(400).json({
        success: false,
        error: { message: 'title, category, and targetAmount are required.' },
      });
      return;
    }

    const plan = await createSavePlan(userId, {
      title,
      category,
      targetAmount,
      initialDeposit,
      linkedItemIds,
    });

    res.status(201).json({
      success: true,
      data: plan,
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

    if (amount === undefined || amount <= 0) {
      res.status(400).json({
        success: false,
        error: { message: 'Funding amount must be greater than zero.' },
      });
      return;
    }

    const plan = await fundSavePlan(userId, id, amount);

    res.status(200).json({
      success: true,
      data: plan,
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
      data: plan,
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
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};
