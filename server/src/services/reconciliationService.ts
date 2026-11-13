import { Types } from 'mongoose';
import { User, OverheadItem, OverheadMonthlyRecord } from '../models';
import { getMonthOverheads } from './overheadService';

/**
 * Determine all fully skipped dormant calendar months (YYYY-MM)
 * strictly between deactivatedAt and restoredAt (excluding the restoration month).
 * Example: deactivated 2026-09-12, restored 2026-11-05 => ['2026-10']
 */
export const getSkippedMonths = (deactivatedAt: Date, restoredAt: Date): string[] => {
  const skipped: string[] = [];
  const start = new Date(deactivatedAt);
  const end = new Date(restoredAt);

  // Month directly following deactivation month
  let cur = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  const endMonthFirst = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cur < endMonthFirst) {
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    skipped.push(`${yyyy}-${mm}`);
    cur.setMonth(cur.getMonth() + 1);
  }

  return skipped;
};

/**
 * Reconcile financial ledger for an account being restored after deactivation.
 * 1. Appends all skipped inactive cycles (YYYY-MM) to user.dormantCycles using $addToSet.
 * 2. Unfreezes user state (isDeactivated = false, deactivatedAt = null, deletionScheduledAt = null).
 * 3. Clones active recurring overhead bills into the active restoration cycle as clean Scheduled/Unpaid.
 * 4. Ensures zero false arrears or retroactive penalties carry over into current ledger.
 */
export const reconcileDormantCycles = async (
  userId: string | Types.ObjectId,
  deactivatedAt: Date,
  restoredAt: Date
): Promise<{ skippedCycles: string[]; restorationMonth: string }> => {
  const uid = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  const skippedCycles = getSkippedMonths(deactivatedAt, restoredAt);
  const restorationMonth = restoredAt.toISOString().slice(0, 7);

  // 1. Atomically append skipped cycles and reset deactivation flags
  await User.findByIdAndUpdate(uid, {
    $addToSet: { dormantCycles: { $each: skippedCycles } },
    $set: {
      isDeactivated: false,
      deactivatedAt: null,
      deletionScheduledAt: null,
    },
  });

  // 2. Clone active recurring overhead definitions cleanly into the restoration cycle
  // getMonthOverheads ensures monthly snapshots exist with isPaid: false, no overdue penalties
  try {
    await getMonthOverheads(uid.toString(), restorationMonth);
  } catch (err: any) {
    console.warn(`[ReconciliationService] Warning initializing overheads for ${restorationMonth}: ${err.message}`);
  }

  return { skippedCycles, restorationMonth };
};

export const reconciliationService = {
  getSkippedMonths,
  reconcileDormantCycles,
};

export default reconciliationService;

