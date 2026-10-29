import { ClientSession, Types } from 'mongoose';
import {
  IOverheadItem,
  IOverheadMonthlyRecord,
  OverheadItem,
  OverheadMonthlyRecord,
} from '../models';
import { adjustGrossBalance } from './balanceService';
import { withTransaction } from './transactionHelper';

export interface MonthOverheadEntry {
  item: IOverheadItem;
  record: IOverheadMonthlyRecord;
}

/**
 * Retrieves all active overhead items for the user and ensures a monthly record exists
 * for the specified monthKey. If a record does not exist yet, it is initialized.
 */
export const getMonthOverheads = async (
  userId: string,
  monthKey: string
): Promise<MonthOverheadEntry[]> => {
  const activeItems = await OverheadItem.find({
    userId: new Types.ObjectId(userId),
    isArchived: false,
  });

  if (activeItems.length === 0) {
    return [];
  }

  const existingRecords = await OverheadMonthlyRecord.find({
    userId: new Types.ObjectId(userId),
    monthKey,
  });

  const recordMap = new Map<string, IOverheadMonthlyRecord>();
  existingRecords.forEach((record) => {
    recordMap.set(record.overheadItemId.toString(), record);
  });

  // Identify items that need an initial monthly snapshot
  const missingItems = activeItems.filter(
    (item) => !recordMap.has(item._id.toString())
  );

  if (missingItems.length > 0) {
    const toInsert = missingItems.map((item) => ({
      overheadItemId: item._id,
      userId: item.userId,
      monthKey,
      billedAmount: item.defaultAmount,
      isPaid: false,
      paidAt: null,
    }));

    const insertedRecords = await OverheadMonthlyRecord.insertMany(toInsert);
    insertedRecords.forEach((rec) => {
      recordMap.set(rec.overheadItemId.toString(), rec);
    });
  }

  return activeItems.map((item) => ({
    item,
    record: recordMap.get(item._id.toString())!,
  }));
};

/**
 * Marks an overhead monthly record as paid and atomically deducts the billedAmount
 * from the user's grossBalance. Prevents double-deductions.
 */
export const markOverheadPaid = async (
  userId: string,
  overheadItemId: string,
  monthKey: string,
  session?: ClientSession
): Promise<IOverheadMonthlyRecord> => {
  return withTransaction(async (activeSession) => {
    let record = await OverheadMonthlyRecord.findOne({
      userId: new Types.ObjectId(userId),
      overheadItemId: new Types.ObjectId(overheadItemId),
      monthKey,
    }).session(activeSession);

    // If no monthly record exists yet, initialize it from the overhead item
    if (!record) {
      const parentItem = await OverheadItem.findOne({
        _id: new Types.ObjectId(overheadItemId),
        userId: new Types.ObjectId(userId),
      }).session(activeSession);

      if (!parentItem) {
        throw new Error(`[OverheadService] Overhead item not found: ${overheadItemId}`);
      }

      const created = await OverheadMonthlyRecord.create(
        [
          {
            overheadItemId: parentItem._id,
            userId: parentItem.userId,
            monthKey,
            billedAmount: parentItem.defaultAmount,
            isPaid: false,
            paidAt: null,
          },
        ],
        { session: activeSession }
      );
      record = created[0];
    }

    // Guardrail: Prevent double-deductions
    if (record.isPaid) {
      throw new Error(
        `[OverheadService] Overhead item "${overheadItemId}" is already marked as paid for month ${monthKey}.`
      );
    }

    record.isPaid = true;
    record.paidAt = new Date();
    await record.save({ session: activeSession });

    // Deduct billedAmount from gross balance atomically
    await adjustGrossBalance(userId, -record.billedAmount, activeSession);

    return record;
  }, session);
};

/**
 * Marks an overhead monthly record as unpaid and atomically refunds the billedAmount
 * back to the user's grossBalance.
 */
export const markOverheadUnpaid = async (
  userId: string,
  overheadItemId: string,
  monthKey: string,
  session?: ClientSession
): Promise<IOverheadMonthlyRecord> => {
  return withTransaction(async (activeSession) => {
    const record = await OverheadMonthlyRecord.findOne({
      userId: new Types.ObjectId(userId),
      overheadItemId: new Types.ObjectId(overheadItemId),
      monthKey,
    }).session(activeSession);

    if (!record) {
      throw new Error(`[OverheadService] Overhead record not found: ${overheadItemId}`);
    }

    if (!record.isPaid) {
      // Already unpaid, no-op
      return record;
    }

    record.isPaid = false;
    record.paidAt = null;
    await record.save({ session: activeSession });

    // Atomically refund billedAmount back to gross balance
    await adjustGrossBalance(userId, record.billedAmount, activeSession);

    return record;
  }, session);
};
