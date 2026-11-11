import { z } from 'zod'

export const dailyCheckoffFormSchema = z.object({
  plannedCap: z.coerce
    .number()
    .min(0, 'Planned cap cannot be negative.'),
  actualSpend: z.coerce
    .number()
    .min(0, 'Actual spend cannot be negative.'),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters.').optional(),
})

export type DailyCheckoffFormValues = z.infer<typeof dailyCheckoffFormSchema>

