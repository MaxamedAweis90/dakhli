import { ClientSession } from 'mongoose';
import { Balance, IBalance, SavePlan } from '../models';

export interface FinancialOverview {
  grossBalance: number;
  totalSaved: number;
  netSpendableBalance: number;
  currency: string;
  paydayAnchor: number;
  baseMonthlyIncome: number;
}

/**
 * Computes deterministic financial overview including Gross Balance,
 * Total Active Reserves (Total Saved), and Net Spendable Balance.
 */
export const getFinancialOverview = async (
  userId: string,
  session?: ClientSession
): Promise<FinancialOverview> => {
  const balance = await Balance.findOne({ userId }).session(session || null);
  if (!balance) {
    throw new Error(`[BalanceService] No balance record found for user ID: ${userId}`);
  }

  // Calculate total saved across all active save plans
  const activePlans = await SavePlan.find(
    { userId, status: 'active' },
    'currentSaved',
    { session }
  );

  const totalSaved = activePlans.reduce((sum, plan) => sum + plan.currentSaved, 0);
  const netSpendableBalance = balance.grossBalance - totalSaved;

  return {
    grossBalance: balance.grossBalance,
    totalSaved,
    netSpendableBalance,
    currency: balance.currency,
    paydayAnchor: balance.paydayAnchor,
    baseMonthlyIncome: balance.baseMonthlyIncome,
  };
};

/**
 * Atomically adjusts gross balance by amountDelta (positive for income/refunds, negative for spend).
 */
export const adjustGrossBalance = async (
  userId: string,
  amountDelta: number,
  session?: ClientSession
): Promise<IBalance> => {
  const updatedBalance = await Balance.findOneAndUpdate(
    { userId },
    { $inc: { grossBalance: amountDelta } },
    { new: true, session, runValidators: true }
  );

  if (!updatedBalance) {
    throw new Error(`[BalanceService] Failed to adjust balance. User record not found: ${userId}`);
  }

  return updatedBalance;
};
