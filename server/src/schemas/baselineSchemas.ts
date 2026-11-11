import { z } from 'zod';

export const updateBaselineSchema = z.object({
  grossBalance: z.coerce.number().optional(),
  baseMonthlyIncome: z.coerce.number().min(0, 'Monthly income cannot be negative.').optional(),
  monthlyIncome: z.coerce.number().min(0, 'Monthly income cannot be negative.').optional(),
  paydayAnchor: z.coerce
    .number()
    .int('Payday anchor must be a whole day number.')
    .min(1, 'Payday anchor must be between 1 and 31.')
    .max(31, 'Payday anchor must be between 1 and 31.')
    .optional(),
  paydayAnchorDay: z.coerce
    .number()
    .int('Payday anchor must be a whole day number.')
    .min(1, 'Payday anchor must be between 1 and 31.')
    .max(31, 'Payday anchor must be between 1 and 31.')
    .optional(),
  currency: z.enum(['USD', 'EUR', 'SOS', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF'] as const).optional(),
  overheadAutoGenerate: z.boolean().optional(),
  defaultDailyCap: z.coerce.number().min(0, 'Default daily cap cannot be negative.').optional(),
  warningThreshold: z.coerce
    .number()
    .int()
    .min(1, 'Threshold must be between 1% and 100%.')
    .max(100, 'Threshold must be between 1% and 100%.')
    .optional(),
});

export type UpdateBaselineInput = z.infer<typeof updateBaselineSchema>;
