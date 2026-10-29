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
    const {
      date,
      plannedCap,
      cap,
      actualSpend,
      spent,
      notes,
      note,
    } = req.body;

    const finalDate = date || new Date().toISOString().slice(0, 10);
    const finalCap = plannedCap !== undefined ? plannedCap : cap;
    const finalSpend = actualSpend !== undefined ? actualSpend : spent;
    const finalNotes = notes !== undefined ? notes : (note !== undefined ? note : '');

    if (finalCap === undefined || finalSpend === undefined) {
      res.status(400).json({
        success: false,
        error: { message: 'cap (or plannedCap) and spent (or actualSpend) are required fields.' },
      });
      return;
    }

    const log = await recordDailyCheckoff(
      userId,
      finalDate,
      Number(finalCap),
      Number(finalSpend),
      finalNotes
    );

    const formatted = {
      id: log._id.toString(),
      userId: log.userId.toString(),
      date: log.date,
      cap: log.plannedCap,
      spent: log.actualSpend,
      savedDelta: log.variance,
      status: log.status,
      note: log.notes,
      createdAt: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(),
      plannedCap: log.plannedCap,
      actualSpend: log.actualSpend,
      variance: log.variance,
      notes: log.notes,
    };

    res.status(200).json({
      success: true,
      data: formatted,
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

    const formatted = logs.map((log) => ({
      id: log._id.toString(),
      userId: log.userId.toString(),
      date: log.date,
      cap: log.plannedCap,
      spent: log.actualSpend,
      savedDelta: log.variance,
      status: log.status,
      note: log.notes,
      createdAt: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(),
      plannedCap: log.plannedCap,
      actualSpend: log.actualSpend,
      variance: log.variance,
      notes: log.notes,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      logs: formatted,
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

    const formattedLogs = preview.logs.map((log) => ({
      id: log._id.toString(),
      userId: log.userId.toString(),
      date: log.date,
      cap: log.plannedCap,
      spent: log.actualSpend,
      savedDelta: log.variance,
      status: log.status,
      note: log.notes,
      createdAt: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(),
      plannedCap: log.plannedCap,
      actualSpend: log.actualSpend,
      variance: log.variance,
      notes: log.notes,
    }));

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRecord = formattedLogs.find((l) => l.date === todayStr) || null;

    let streak = 0;
    const sortedDesc = [...formattedLogs].sort((a, b) => b.date.localeCompare(a.date));
    for (const l of sortedDesc) {
      if (l.status === 'under_budget' || l.status === 'on_budget') {
        streak++;
      } else {
        break;
      }
    }

    const summary = {
      todayRecord,
      currentStreak: streak,
      monthlySavedFromDaily: preview.totalVariance,
      recentLogs: formattedLogs,
      monthKey: preview.monthKey,
      totalVariance: preview.totalVariance,
      daysLogged: preview.daysLogged,
      logs: formattedLogs,
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
