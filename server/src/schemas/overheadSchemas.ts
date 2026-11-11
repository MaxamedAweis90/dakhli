import { z } from 'zod';

export const createOverheadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Bill title is required.')
    .max(80, 'Bill title cannot exceed 80 characters.'),
  amount: z.coerce
    .number()
    .positive('Amount must be greater than 0.'),
  defaultAmount: z.coerce.number().positive('Amount must be greater than 0.').optional(),
  dueDay: z.coerce
    .number()
    .int('Due day must be a whole number.')
    .min(1, 'Due day must be between 1 and 31.')
    .max(31, 'Due day must be between 1 and 31.'),
  dueDate: z.coerce.number().int().min(1).max(31).optional(),
  iconKey: z.string().trim().optional().default('home'),
  notes: z.string().trim().max(300, 'Notes cannot exceed 300 characters.').optional().default(''),
  isRecurring: z.boolean().optional().default(true),
});

export const updateOverheadSchema = createOverheadSchema.partial();

export type CreateOverheadInput = z.infer<typeof createOverheadSchema>;
export type UpdateOverheadInput = z.infer<typeof updateOverheadSchema>;
