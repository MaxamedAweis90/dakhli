import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { OverheadItem, OverheadMonthlyRecord, User } from '../models';
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
    const monthKey =
      (req.query.cycle as string) ||
      (req.query.monthKey as string) ||
      new Date().toISOString().slice(0, 7);

    const user = await User.findById(userId);
    const isDormant = Boolean(user?.dormantCycles?.includes(monthKey));

    const entries = await getMonthOverheads(userId, monthKey);

    const formatted = entries.map(({ item, record }) => ({
      id: item._id.toString(),
      userId: item.userId.toString(),
      title: item.title,
      amount: record.billedAmount ?? item.defaultAmount,
      dueDay: item.dueDate,
      status: isDormant ? ('dormant' as const) : ((record.isPaid ? 'paid' : 'unpaid') as 'paid' | 'unpaid'),
      iconKey: item.iconKey || 'home',
      isRecurring: !item.isArchived,
      isActive: item.isActive !== false,
      isDormant,
      notes: item.notes || '',
      paidAt: record.paidAt,
      createdAt: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: item.updatedAt ? item.updatedAt.toISOString() : new Date().toISOString(),
      item,
      record,
    }));

    res.status(200).json({
      success: true,
      isDormant,
      cycleStatus: isDormant ? 'DORMANT' : 'ACTIVE',
      totalOverhead: isDormant ? 0 : undefined,
      paid: isDormant ? 0 : undefined,
      unpaid: isDormant ? 0 : undefined,
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
      iconKey: iconKey || 'home',
      notes: notes ? notes.trim() : '',
      isActive: true,
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
      iconKey: item.iconKey || 'home',
      isRecurring: isRecurring !== undefined ? isRecurring : true,
      isActive: true,
      notes: item.notes || '',
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

export const updateOverhead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;
    const {
      title,
      amount,
      defaultAmount,
      dueDay,
      dueDate,
      iconKey,
      notes,
      isActive,
      monthKey,
    } = req.body;

    const currentRealMonthKey = new Date().toISOString().slice(0, 7);
    const targetMonth = monthKey || currentRealMonthKey;

    if (targetMonth < currentRealMonthKey) {
      res.status(400).json({
        success: false,
        error: { message: 'Archived cycle: Past months are read-only.' },
      });
      return;
    }

    const item = await OverheadItem.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!item) {
      res.status(404).json({
        success: false,
        error: { message: 'Overhead item not found.' },
      });
      return;
    }

    if (title !== undefined) item.title = title.trim();
    const finalAmount = amount !== undefined ? amount : defaultAmount;
    if (finalAmount !== undefined) item.defaultAmount = Number(finalAmount);
    const finalDueDay = dueDay !== undefined ? dueDay : dueDate;
    if (finalDueDay !== undefined) item.dueDate = Number(finalDueDay);
    if (iconKey !== undefined) item.iconKey = iconKey;
    if (notes !== undefined) item.notes = notes.trim();
    if (isActive !== undefined) item.isActive = Boolean(isActive);

    await item.save();

    // If amount changed, update active month's monthly record if unpaid
    if (finalAmount !== undefined) {
      await OverheadMonthlyRecord.findOneAndUpdate(
        {
          overheadItemId: item._id,
          userId: item.userId,
          monthKey: targetMonth,
          isPaid: false,
        },
        { $set: { billedAmount: Number(finalAmount) } }
      );
    }

    const record = await OverheadMonthlyRecord.findOne({
      overheadItemId: item._id,
      userId: item.userId,
      monthKey: targetMonth,
    });

    const formattedBill = {
      id: item._id.toString(),
      userId: item.userId.toString(),
      title: item.title,
      amount: record ? record.billedAmount : item.defaultAmount,
      dueDay: item.dueDate,
      status: (record?.isPaid ? 'paid' : 'unpaid') as 'paid' | 'unpaid',
      iconKey: item.iconKey || 'home',
      isRecurring: !item.isArchived,
      isActive: item.isActive !== false,
      notes: item.notes || '',
      paidAt: record?.paidAt || null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      item,
      record,
    };

    res.status(200).json({
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

    const currentRealMonthKey = new Date().toISOString().slice(0, 7);
    const targetMonth = monthKey || currentRealMonthKey;

    const user = await User.findById(userId);
    if (user?.dormantCycles?.includes(targetMonth)) {
      res.status(400).json({
        success: false,
        error: { message: 'Cycle is dormant. Operations cannot be performed on dormant cycles.', code: 'DORMANT_CYCLE' },
      });
      return;
    }

    if (targetMonth < currentRealMonthKey) {
      res.status(400).json({
        success: false,
        error: { message: 'Archived cycle: Past months are read-only.' },
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

    const currentRealMonthKey = new Date().toISOString().slice(0, 7);
    const targetMonth = monthKey || currentRealMonthKey;

    const user = await User.findById(userId);
    if (user?.dormantCycles?.includes(targetMonth)) {
      res.status(400).json({
        success: false,
        error: { message: 'Cycle is dormant. Operations cannot be performed on dormant cycles.', code: 'DORMANT_CYCLE' },
      });
      return;
    }

    if (targetMonth < currentRealMonthKey) {
      res.status(400).json({
        success: false,
        error: { message: 'Archived cycle: Past months are read-only.' },
      });
      return;
    }

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

    const currentRealMonthKey = new Date().toISOString().slice(0, 7);
    const targetMonth = monthKey || currentRealMonthKey;

    const user = await User.findById(userId);
    if (user?.dormantCycles?.includes(targetMonth)) {
      res.status(400).json({
        success: false,
        error: { message: 'Cycle is dormant. Operations cannot be performed on dormant cycles.', code: 'DORMANT_CYCLE' },
      });
      return;
    }

    if (targetMonth < currentRealMonthKey) {
      res.status(400).json({
        success: false,
        error: { message: 'Archived cycle: Past months are read-only.' },
      });
      return;
    }

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
    const targetMonth =
      req.body?.monthKey ||
      (req.query.monthKey as string) ||
      (req.query.cycle as string) ||
      new Date().toISOString().slice(0, 7);

    const currentRealMonthKey = new Date().toISOString().slice(0, 7);
    if (targetMonth < currentRealMonthKey) {
      res.status(400).json({
        success: false,
        error: { message: 'Cannot delete bills from archived past months.' },
      });
      return;
    }

    const item = await OverheadItem.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: { isArchived: true, archivedAtMonthKey: targetMonth } },
      { new: true }
    );

    if (!item) {
      res.status(404).json({
        success: false,
        error: { message: 'Overhead item not found.' },
      });
      return;
    }

    // Delete future monthly records for this item (months >= targetMonth)
    // Historical records in past months (< targetMonth) are strictly preserved!
    await OverheadMonthlyRecord.deleteMany({
      overheadItemId: item._id,
      userId: new Types.ObjectId(userId),
      monthKey: { $gte: targetMonth },
    });

    res.status(200).json({
      success: true,
      data: { message: 'Overhead item archived successfully.', item },
    });
  } catch (error) {
    next(error);
  }
};
