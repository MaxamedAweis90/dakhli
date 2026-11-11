import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password is required.'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(50, 'Name must not exceed 50 characters.'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.'),
  initialBalance: z.coerce
    .number()
    .min(0, 'Initial balance cannot be negative.')
    .optional()
    .default(0),
  baseMonthlyIncome: z.coerce
    .number()
    .min(0, 'Base monthly income cannot be negative.')
    .optional()
    .default(0),
  paydayAnchor: z.coerce
    .number()
    .int('Payday anchor must be a whole day number.')
    .min(1, 'Payday anchor must be between 1 and 31.')
    .max(31, 'Payday anchor must be between 1 and 31.')
    .optional()
    .default(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
