import { z } from 'zod'

export const itemFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Please enter an item name.')
    .max(100, 'Item name cannot exceed 100 characters.'),
  price: z.coerce
    .number()
    .positive('Please enter a valid price greater than 0.'),
  tier: z.string().trim().min(1, 'Please select a tier.'),
  imageUrl: z.string().trim().optional(),
  targetProgress: z.coerce.number().min(0).max(100).optional(),
})

export type ItemFormValues = z.infer<typeof itemFormSchema>

