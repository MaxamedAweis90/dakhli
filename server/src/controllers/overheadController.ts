import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { OverheadItem, OverheadMonthlyRecord } from '../models';
import {
  getMonthOverheads,
  markOverheadPaid,
  markOverheadUnpaid,
} from '../services/overheadService';

export const listOverheads = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const monthKey = (req.query.monthKey as string) || new Date().toISOString().slice(0, 7);

    const entries = await getMonthOverheads(userId, monthKey);

    const formatted = entries.map(({ item, record }) => ({
      id: item._id.toString(),
      userId: item.userId.toString(),
      title: item.title,
      amount: record.billedAmount ?? item.defaultAmount,
      dueDay: item.dueDate,
      status: (record.isPaid ? 'paid' : 'unpaid') as 'paid' | 'unpaid',
      iconKey: undefined,
      isRecurring: !item.isArchived,
      paidAt: record.paidAt,
      createdAt: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: item.updatedAt ? item.updatedAt.toISOString() : new Date().toISOString(),
      item,
      record,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      entries,
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
    const { title, defaultAmount, dueDate, amount, dueDay, isRecurring, notes, iconKey } = req.body;

    const finalAmount = defaultAmount !== undefined ? defaultAmount : amount;
    const finalDueDay = dueDate !== undefined ? dueDate : dueDay;

    if (!title || finalAmount === undefined || finalDueDay === undefined) {
      res.status(400).json({
        success: false,
        error: { message: 'Title, amount (or defaultAmount), and dueDay (or dueDate) are required.' },
      });
      return;
    }

    const item = new OverheadItem({
      userId: new Types.ObjectId(userId),
      title: title.trim(),
      defaultAmount: Number(finalAmount),
      dueDate: Number(finalDueDay),
      isArchived: false,
    });

    await item.save();

    const monthKey = new Date().toISOString().slice(0, 7);
    const record = await OverheadMonthlyRecord.create({
      overheadItemId: item._id,
      userId: item.userId,
      monthKey,
      billedAmount: item.defaultAmount,
      isPaid: false,
      paidAt: null,
    });

    const formattedBill = {
      id: item._id.toString(),
      userId: item.userId.toString(),
      title: item.title,
      amount: record.billedAmount,
      dueDay: item.dueDate,
      status: 'unpaid' as const,
      iconKey,
      isRecurring: isRecurring !== undefined ? isRecurring : true,
      notes,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      item,
      record,
    };

    res.status(201).json({
      success: true,
      data: formattedBill,
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

export const updateOverheadStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;
    const { status, monthKey } = req.body;

    const targetMonth = monthKey || new Date().toISOString().slice(0, 7);

    let updatedRecord;
    if (status === 'paid') {
      updatedRecord = await markOverheadPaid(userId, id, targetMonth);
    } else if (status === 'unpaid') {
      updatedRecord = await markOverheadUnpaid(userId, id, targetMonth);
    } else {
      res.status(400).json({
        success: false,
        error: { message: "Status must be 'paid' or 'unpaid'." },
      });
      return;
    }

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
