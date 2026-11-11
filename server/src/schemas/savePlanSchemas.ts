import { z } from 'zod';

export const createSavePlanSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required.').max(80, 'Title cannot exceed 80 characters.').optional(),
    name: z.string().trim().min(1, 'Name is required.').max(80, 'Name cannot exceed 80 characters.').optional(),
    category: z.string().trim().optional().default('general'),
    type: z.string().trim().optional().default('targeted'),
    targetAmount: z.coerce
      .number()
      .positive('Target amount must be greater than 0.'),
    initialDeposit: z.coerce.number().min(0, 'Initial deposit cannot be negative.').optional().default(0),
    currentAmount: z.coerce.number().min(0).optional(),
    currentSaved: z.coerce.number().min(0).optional(),
    monthlyContribution: z.coerce.number().min(0, 'Monthly contribution cannot be negative.').optional(),
    monthlyDeduction: z.coerce.number().min(0, 'Monthly deduction cannot be negative.').optional(),
    cutDay: z.coerce.number().int().min(1).max(31).optional(),
    iconKey: z.string().trim().optional(),
    targetDate: z.string().trim().optional(),
    isPinned: z.boolean().optional(),
    linkedItemId: z.string().trim().optional(),
    linkedItemName: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.title || data.name), {
    message: 'Goal title is required.',
    path: ['title'],
  })
  .refine(
    (data) => {
      const deposit = data.initialDeposit ?? data.currentAmount ?? data.currentSaved ?? 0;
      return deposit <= data.targetAmount;
    },
    {
      message: 'Initial deposit cannot exceed target amount.',
      path: ['initialDeposit'],
    }
  );

export const updateSavePlanSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  targetAmount: z.coerce.number().positive().optional(),
  monthlyContribution: z.coerce.number().min(0).optional(),
  monthlyDeduction: z.coerce.number().min(0).optional(),
  cutDay: z.coerce.number().int().min(1).max(31).optional(),
  targetDate: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'PAUSED']).optional(),
  isPinned: z.boolean().optional(),
  category: z.string().trim().optional(),
});

export const fundSavePlanSchema = z.object({
  amount: z.coerce
    .number()
    .positive('Funding amount must be greater than 0.'),
});

export type CreateSavePlanInput = z.infer<typeof createSavePlanSchema>;
export type UpdateSavePlanInput = z.infer<typeof updateSavePlanSchema>;
