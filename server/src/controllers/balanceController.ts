import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Balance, User } from '../models';
import { getFinancialOverview } from '../services/balanceService';
import { processSystemReserveMonthlyCut } from '../services/savePlanService';

export const getOverview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    await processSystemReserveMonthlyCut(userId);
    const overview = await getFinancialOverview(userId);

    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBaseline = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const {
      grossBalance,
      baseMonthlyIncome,
      monthlyIncome,
      paydayAnchor,
      paydayAnchorDay,
      currency,
      overheadAutoGenerate,
      defaultDailyCap,
      warningThreshold,
    } = req.body;

    const updates: Record<string, unknown> = {};
    if (typeof grossBalance === 'number') updates.grossBalance = grossBalance;

    const incomeVal =
      typeof baseMonthlyIncome === 'number'
        ? baseMonthlyIncome
        : typeof monthlyIncome === 'number'
        ? monthlyIncome
        : undefined;
    if (incomeVal !== undefined) updates.baseMonthlyIncome = incomeVal;

    const anchorVal =
      typeof paydayAnchor === 'number'
        ? paydayAnchor
        : typeof paydayAnchorDay === 'number'
        ? paydayAnchorDay
        : undefined;
    if (anchorVal !== undefined) {
      if (anchorVal < 1 || anchorVal > 31) {
        res.status(400).json({
          success: false,
          error: { message: 'paydayAnchor must be between 1 and 31.' },
        });
        return;
      }
      updates.paydayAnchor = anchorVal;
    }

    if (typeof currency === 'string' && currency.trim()) {
      updates.currency = currency.trim();
    }
    if (typeof overheadAutoGenerate === 'boolean') {
      updates.overheadAutoGenerate = overheadAutoGenerate;
    }
    if (typeof defaultDailyCap === 'number' && defaultDailyCap >= 0) {
      updates.defaultDailyCap = defaultDailyCap;
    }
    if (typeof warningThreshold === 'number' && warningThreshold >= 1 && warningThreshold <= 100) {
      updates.warningThreshold = warningThreshold;
    }

    const updatedBalance = await Balance.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedBalance) {
      res.status(404).json({
        success: false,
        error: { message: 'Balance record not found.' },
      });
      return;
    }

    if (updates.currency) {
      await User.findByIdAndUpdate(userId, {
        $set: { 'preferences.currency': updates.currency },
      });
    }

    res.status(200).json({
      success: true,
      data: updatedBalance,
    });
  } catch (error) {
    next(error);
  }
};
