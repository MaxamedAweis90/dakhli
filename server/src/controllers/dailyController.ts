import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { DailyLog } from '../models';
import {
  getDailySavingsTracker,
  recordDailyCheckoff,
} from '../services/dailyService';

export const checkoff = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { date, plannedCap, actualSpend, notes = '' } = req.body;

    if (!date || plannedCap === undefined || actualSpend === undefined) {
      res.status(400).json({
        success: false,
        error: { message: 'date, plannedCap, and actualSpend are required fields.' },
      });
      return;
    }

    const log = await recordDailyCheckoff(userId, date, plannedCap, actualSpend, notes);

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const monthKey = (req.query.monthKey as string) || new Date().toISOString().slice(0, 7);

    const logs = await DailyLog.find({
      userId: new Types.ObjectId(userId),
      monthKey,
    }).sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

export const getSavingsPreview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const monthKey = (req.query.monthKey as string) || new Date().toISOString().slice(0, 7);

    const preview = await getDailySavingsTracker(userId, monthKey);

    res.status(200).json({
      success: true,
      data: preview,
    });
  } catch (error) {
    next(error);
  }
};
