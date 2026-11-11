import { z } from 'zod'

export const savePlanFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Please enter a goal or target title.')
      .max(80, 'Title cannot exceed 80 characters.'),
    category: z.string().trim().default('emergency'),
    targetAmount: z.coerce
      .number()
      .positive('Target amount must be greater than 0.'),
    initialSaved: z.coerce
      .number()
      .min(0, 'Initial saved amount cannot be negative.')
      .default(0),
    monthlyCut: z.coerce
      .number()
      .min(0, 'Monthly cut cannot be negative.')
      .default(0),
    targetDate: z.string().trim().optional(),
    selectedItemId: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      const target = Number(data.targetAmount) || 0
      const saved = Number(data.initialSaved) || 0
      return saved <= target
    },
    {
      message: 'Initial deposit cannot exceed target amount.',
      path: ['initialSaved'],
    }
  )

export type SavePlanFormValues = z.infer<typeof savePlanFormSchema>

