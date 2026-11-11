import { z } from 'zod';

export const dailyCheckoffSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD.')
      .optional(),
    plannedCap: z.coerce.number().min(0, 'Planned cap cannot be negative.').optional(),
    cap: z.coerce.number().min(0, 'Planned cap cannot be negative.').optional(),
    actualSpend: z.coerce.number().min(0, 'Actual spend cannot be negative.').optional(),
    spent: z.coerce.number().min(0, 'Actual spend cannot be negative.').optional(),
    notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters.').optional(),
    note: z.string().trim().max(500, 'Notes cannot exceed 500 characters.').optional(),
  })
  .refine((data) => data.plannedCap !== undefined || data.cap !== undefined, {
    message: 'Planned daily cap is required.',
    path: ['cap'],
  })
  .refine((data) => data.actualSpend !== undefined || data.spent !== undefined, {
    message: 'Actual daily spend is required.',
    path: ['spent'],
  });

export type DailyCheckoffInput = z.infer<typeof dailyCheckoffSchema>;
