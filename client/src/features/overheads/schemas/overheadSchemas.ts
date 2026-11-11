import { z } from 'zod'

export const overheadFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Please enter a bill title.')
    .max(80, 'Bill title cannot exceed 80 characters.'),
  amount: z.coerce
    .number()
    .positive('Please enter a valid amount greater than 0.'),
  dueDay: z.coerce
    .number()
    .int('Due day must be a whole number.')
    .min(1, 'Due day must be between 1 and 31.')
    .max(31, 'Due day must be between 1 and 31.'),
  category: z.string().trim().default('home'),
  notes: z.string().trim().max(300, 'Notes cannot exceed 300 characters.').optional(),
})

export type OverheadFormValues = z.infer<typeof overheadFormSchema>

