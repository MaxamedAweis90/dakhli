import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { OverheadItem, OverheadMonthlyRecord } from '../models';
import { getMonthOverheads, markOverheadPaid } from '../services/overheadService';

export const listOverheads = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const monthKey = (req.query.monthKey as string) || new Date().toISOString().slice(0, 7);

    const entries = await getMonthOverheads(userId, monthKey);

    res.status(200).json({
      success: true,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
};

export const createOverhead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { title, defaultAmount, dueDate } = req.body;

    if (!title || defaultAmount === undefined || dueDate === undefined) {
      res.status(400).json({
        success: false,
        error: { message: 'Title, defaultAmount, and dueDate are required.' },
      });
      return;
    }

    const item = new OverheadItem({
      userId: new Types.ObjectId(userId),
      title: title.trim(),
      defaultAmount,
      dueDate,
      isArchived: false,
    });

    await item.save();

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMonthlyBilled = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;
    const { billedAmount, monthKey } = req.body;

    if (billedAmount === undefined || !monthKey) {
      res.status(400).json({
        success: false,
        error: { message: 'billedAmount and monthKey are required.' },
      });
      return;
    }

    const record = await OverheadMonthlyRecord.findOneAndUpdate(
      {
        overheadItemId: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
        monthKey,
      },
      { $set: { billedAmount } },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const payOverhead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;
    const { monthKey } = req.body;

    const targetMonth = monthKey || new Date().toISOString().slice(0, 7);
    const updatedRecord = await markOverheadPaid(userId, id, targetMonth);

    res.status(200).json({
      success: true,
      data: updatedRecord,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOverhead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;

    const item = await OverheadItem.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: { isArchived: true } },
      { new: true }
    );

    if (!item) {
      res.status(404).json({
        success: false,
        error: { message: 'Overhead item not found.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { message: 'Overhead item archived successfully.', item },
    });
  } catch (error) {
    next(error);
  }
};
