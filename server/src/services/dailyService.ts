import { ClientSession, Types } from 'mongoose';
import { DailyLog, DailyLogStatus, IDailyLog } from '../models';
import { adjustGrossBalance } from './balanceService';
import { withTransaction } from './transactionHelper';

export interface DailySavingsTrackerResult {
  monthKey: string;
  totalVariance: number;
  daysLogged: number;
  logs: IDailyLog[];
}

/**
 * Records an end-of-day spending check-off.
 * Calculates variance, determines budget performance status,
 * and atomically deducts actual spend from grossBalance.
 */
export const recordDailyCheckoff = async (
  userId: string,
  date: string,
  plannedCap: number,
  actualSpend: number,
  notes: string = '',
  session?: ClientSession
): Promise<IDailyLog> => {
  if (plannedCap < 0) {
    throw new Error('[DailyService] Planned cap cannot be negative.');
  }
  if (actualSpend < 0) {
    throw new Error('[DailyService] Actual spend cannot be negative.');
  }

  const monthKey = date.slice(0, 7);
  const variance = plannedCap - actualSpend;

  let status: DailyLogStatus;
  if (variance === 0) {
    status = 'on_budget';
  } else if (variance > 0) {
    status = 'under_budget';
  } else {
    status = 'over_budget';
  }

  return withTransaction(async (activeSession) => {
    const existingLog = await DailyLog.findOne({
      userId: new Types.ObjectId(userId),
      date,
    }).session(activeSession);

    if (existingLog) {
      // Calculate net difference if updating an existing day checkoff
      const spendDelta = actualSpend - existingLog.actualSpend;
      if (spendDelta !== 0) {
        await adjustGrossBalance(userId, -spendDelta, activeSession);
      }

      existingLog.monthKey = monthKey;
      existingLog.plannedCap = plannedCap;
      existingLog.actualSpend = actualSpend;
      existingLog.variance = variance;
      existingLog.status = status;
      existingLog.notes = notes;

      await existingLog.save({ session: activeSession });
      return existingLog;
    }

    // Deduct actual spend from gross balance
    if (actualSpend > 0) {
      await adjustGrossBalance(userId, -actualSpend, activeSession);
    }

    const created = await DailyLog.create(
      [
        {
          userId: new Types.ObjectId(userId),
          date,
          monthKey,
          plannedCap,
          actualSpend,
          variance,
          status,
          notes,
        },
      ],
      { session: activeSession }
    );

    return created[0];
  }, session);
};

/**
 * Analytical preview performance tracker: Sums variances across all logs for the target month.
 * Note: This tracker is purely analytical and does not modify save_plans or balances.
 */
export const getDailySavingsTracker = async (
  userId: string,
  monthKey: string
): Promise<DailySavingsTrackerResult> => {
  const logs = await DailyLog.find({
    userId: new Types.ObjectId(userId),
    monthKey,
  }).sort({ date: 1 });

  const totalVariance = logs.reduce((sum, log) => sum + log.variance, 0);

  return {
    monthKey,
    totalVariance,
    daysLogged: logs.length,
    logs,
  };
};
