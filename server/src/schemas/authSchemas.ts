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

export const checkEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.')
    .toLowerCase(),
});

export const googleAuthSchema = z
  .object({
    idToken: z.string().trim().optional(),
    credential: z.string().trim().optional(),
    token: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.idToken || data.credential || data.token), {
    message: 'Google credential or idToken is required.',
  });

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.')
    .toLowerCase(),
  otp: z
    .string()
    .trim()
    .length(6, 'Verification code must be exactly 6 digits.')
    .regex(/^\d{6}$/, 'Verification code must consist of 6 digits only.'),
});

export const resendOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.')
    .toLowerCase(),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(50, 'Name must not exceed 50 characters.'),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long.'),
});

export const deactivateAccountSchema = z.object({
  confirmation: z.string().trim().optional(),
});

export const restoreAccountSchema = z.object({
  restorationToken: z.string().trim().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CheckEmailInput = z.infer<typeof checkEmailSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type DeactivateAccountInput = z.infer<typeof deactivateAccountSchema>;
export type RestoreAccountInput = z.infer<typeof restoreAccountSchema>;
