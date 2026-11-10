import { ClientSession, Types } from "mongoose";
import {
  IOverheadItem,
  IOverheadMonthlyRecord,
  OverheadItem,
  OverheadMonthlyRecord,
} from "../models";
import { adjustGrossBalance } from "./balanceService";
import { withTransaction } from "./transactionHelper";

export interface MonthOverheadEntry {
  item: IOverheadItem;
  record: IOverheadMonthlyRecord;
}

/**
 * Retrieves all active overhead items for the user and ensures a monthly record exists
 * for the specified monthKey. If a record does not exist yet, it is initialized.
 * - Future months carry over active recurring bills.
 * - Newly added bills only apply to current & future months (not retroactively to past months before creation).
 * - Deleting in current month removes from current & future, preserving historical past records.
 * - Sorted newest first (createdAt: -1), segregating active before inactive.
 */
export const getMonthOverheads = async (
  userId: string,
  monthKey: string,
): Promise<MonthOverheadEntry[]> => {
  // 1. Fetch user's existing monthly records for this monthKey
  const existingRecords = await OverheadMonthlyRecord.find({
    userId: new Types.ObjectId(userId),
    monthKey,
  });

  const recordMap = new Map<string, IOverheadMonthlyRecord>();
  existingRecords.forEach((record) => {
    recordMap.set(record.overheadItemId.toString(), record);
  });

  // 2. Fetch all overhead items for this user
  const allUserItems = await OverheadItem.find({
    userId: new Types.ObjectId(userId),
  });

  // 3. Filter items that belong in this monthKey:
  // - A bill NEVER exists prior to its creation month
  // - If archived/deleted, it only exists in months strictly BEFORE the deletion month
  // - Historical past records (< deletion month) are strictly preserved
  const validItems = allUserItems.filter((item) => {
    const itemCreationMonth = item.createdAt
      ? item.createdAt.toISOString().slice(0, 7)
      : monthKey;

    // Rule 1: Bill never exists prior to its creation month
    if (itemCreationMonth > monthKey) {
      return false;
    }

    // Rule 2: If archived/deleted, exclude from deletion month and all future months
    if (item.isArchived) {
      const archivedMonth = item.archivedAtMonthKey || itemCreationMonth;
      if (monthKey >= archivedMonth) {
        return false;
      }
    }

    return true;
  });

  if (validItems.length === 0) {
    return [];
  }

  // 4. Identify items that need an initial monthly snapshot
  const missingItems = validItems.filter(
    (item) => !recordMap.has(item._id.toString()),
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

  // 5. Combine and sort: Active items first, then newest created bills first (createdAt: -1)
  const entries: MonthOverheadEntry[] = validItems.map((item) => ({
    item,
    record: recordMap.get(item._id.toString())!,
  }));

  entries.sort((a, b) => {
    const aActive = a.item.isActive !== false;
    const bActive = b.item.isActive !== false;
    if (aActive !== bActive) {
      return aActive ? -1 : 1;
    }
    const aTime = a.item.createdAt ? new Date(a.item.createdAt).getTime() : 0;
    const bTime = b.item.createdAt ? new Date(b.item.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  return entries;
};

/**
 * Marks an overhead monthly record as paid and atomically deducts the billedAmount
 * from the user's grossBalance. Prevents double-deductions.
 */
export const markOverheadPaid = async (
  userId: string,
  overheadItemId: string,
  monthKey: string,
  session?: ClientSession,
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
        throw new Error(
          `[OverheadService] Overhead item not found: ${overheadItemId}`,
        );
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
        { session: activeSession },
      );
      record = created[0];
    }

    // Guardrail: Prevent double-deductions
    if (record.isPaid) {
      throw new Error(
        `[OverheadService] Overhead item "${overheadItemId}" is already marked as paid for month ${monthKey}.`,
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
  session?: ClientSession,
): Promise<IOverheadMonthlyRecord> => {
  return withTransaction(async (activeSession) => {
    const record = await OverheadMonthlyRecord.findOne({
      userId: new Types.ObjectId(userId),
      overheadItemId: new Types.ObjectId(overheadItemId),
      monthKey,
    }).session(activeSession);

    if (!record) {
      throw new Error(
        `[OverheadService] Overhead record not found: ${overheadItemId}`,
      );
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
