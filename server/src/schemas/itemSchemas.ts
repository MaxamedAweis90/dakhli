import { z } from 'zod';

export const createItemSchema = z
  .object({
    title: z.string().trim().min(1, 'Item name is required.').max(100, 'Item name cannot exceed 100 characters.').optional(),
    name: z.string().trim().min(1, 'Item name is required.').max(100, 'Item name cannot exceed 100 characters.').optional(),
    targetPrice: z.coerce.number().positive('Price must be greater than 0.').optional(),
    estimatedPrice: z.coerce.number().positive('Price must be greater than 0.').optional(),
    price: z.coerce.number().positive('Price must be greater than 0.').optional(),
    tier: z.string().trim().min(1, 'Category tier is required.'),
    imageUrl: z.string().trim().optional(),
    iconKey: z.string().trim().optional(),
    notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters.').optional(),
    tag: z.string().trim().optional(),
    targetProgress: z.coerce.number().min(0).max(100).optional(),
  })
  .refine((data) => Boolean(data.title || data.name), {
    message: 'Item name is required.',
    path: ['name'],
  })
  .refine((data) => (data.targetPrice !== undefined || data.estimatedPrice !== undefined || data.price !== undefined), {
    message: 'A valid price greater than 0 is required.',
    path: ['price'],
  });

export const updateItemSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  price: z.coerce.number().positive().optional(),
  estimatedPrice: z.coerce.number().positive().optional(),
  targetPrice: z.coerce.number().positive().optional(),
  tier: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  iconKey: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
  tag: z.string().trim().optional(),
  targetProgress: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(['planned', 'bought', 'cancelled', 'unbought']).optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
