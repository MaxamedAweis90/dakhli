import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { Balance, User } from '../models';
import { withTransaction } from '../services/transactionHelper';
import { AuthRequest } from '../middleware/auth';
import { authenticateGoogleUser, verifyGoogleToken } from '../services/googleAuthService';
import { emailService } from '../services/emailService';
import { reconciliationService } from '../services/reconciliationService';

// Helper to project safe user payload
export const toSafeUser = (user: any) => ({
  id: user._id.toString(),
  _id: user._id.toString(),
  email: user.email,
  name: user.name,
  avatar: user.avatar || null,
  authProvider: user.authProvider || 'LOCAL',
  hasPassword: Boolean(user.passwordHash),
  isVerified: Boolean(user.isVerified),
  isDeactivated: Boolean(user.isDeactivated),
  isOnboarded: Boolean(user.isOnboarded),
  dormantCycles: user.dormantCycles || [],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, initialBalance = 0, baseMonthlyIncome = 0, paydayAnchor = 1 } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        error: { message: 'Email, password, and name are required fields.' },
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          message: 'An account with this email already exists.',
          code: 'EMAIL_ALREADY_EXISTS',
          fieldErrors: {
            email: 'An account with this email already exists. Try signing in instead.',
          },
        },
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate 6-digit verification OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const codeHash = crypto.createHash('sha256').update(otp).digest('hex');

    const result = await withTransaction(async (session) => {
      const user = new User({
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        authProvider: 'LOCAL',
        isVerified: false,
        verificationOtp: {
          codeHash,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          attempts: 0,
          lastSentAt: new Date(),
        },
      });
      await user.save({ session });

      const balance = new Balance({
        userId: user._id,
        grossBalance: initialBalance,
        baseMonthlyIncome,
        paydayAnchor,
        currency: 'USD',
      });
      await balance.save({ session });

      return { user, balance };
    });

    // Send verification email asynchronously
    void emailService.sendVerificationOtp(result.user.email, result.user.name, otp);

    const token = jwt.sign(
      { userId: result.user._id.toString() },
      ENV.JWT_SECRET,
      { expiresIn: (ENV.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
    );

    res.status(201).json({
      success: true,
      data: {
        user: toSafeUser(result.user),
        balance: result.balance,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { message: 'Email and password are required.' },
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
          fieldErrors: {
            email: 'Account not found with this email. Please check your spelling or create an account.',
          },
        },
      });
      return;
    }

    if (user.authProvider === 'GOOGLE' && !user.passwordHash) {
      res.status(400).json({
        success: false,
        error: {
          message: 'This account is registered via Google OAuth. Please sign in with Google.',
          code: 'USE_GOOGLE_AUTH',
        },
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
          fieldErrors: {
            password: 'Incorrect password. Please verify and try again.',
          },
        },
      });
      return;
    }

    // Check account deactivation state after credential verification
    if (user.isDeactivated) {
      const now = new Date();
      const deletionDate = user.deletionScheduledAt
        ? new Date(user.deletionScheduledAt)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Expired past 30-day grace period: treat as permanently purged
      if (now > deletionDate) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Account does not exist or has been permanently purged.',
            code: 'ACCOUNT_PURGED',
          },
        });
        return;
      }

      // Active grace period: issue restricted restoration token (1h)
      const restorationToken = jwt.sign(
        { userId: user._id.toString(), scope: 'ACCOUNT_RESTORATION' },
        ENV.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({
        success: true,
        isDeactivated: true,
        data: {
          isDeactivated: true,
          email: user.email,
          name: user.name,
          deletionScheduledAt: deletionDate.toISOString(),
          restorationToken,
        },
      });
      return;
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      ENV.JWT_SECRET,
      { expiresIn: (ENV.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
    );

    res.status(200).json({
      success: true,
      data: {
        user: toSafeUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pre-flight endpoint to check email availability for real-time registration validation
 * POST /api/auth/check-email
 */
export const checkEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({
        success: false,
        error: { message: 'Email address is required.' },
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail }).select(
      'authProvider isVerified isDeactivated'
    );

    if (existingUser) {
      res.status(200).json({
        success: true,
        data: {
          available: false,
          message: 'This email is already registered.',
          authProvider: existingUser.authProvider,
          isGoogleAccount: existingUser.authProvider === 'GOOGLE',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        available: true,
        message: 'Email is available.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth verification & auto-provisioning
 * POST /api/auth/google
 */
export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { idToken, credential, token: rawToken, code, accessToken } = req.body;

    if (!idToken && !credential && !rawToken && !code && !accessToken) {
      res.status(400).json({
        success: false,
        error: { message: 'Google credential, authorization code, or idToken is required.' },
      });
      return;
    }

    const googlePayload = await authenticateGoogleUser({
      idToken,
      credential,
      token: rawToken,
      code,
      accessToken,
    });
    const { googleId, email, name, picture } = googlePayload;

    // 1. Look up existing user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      if (user.isDeactivated) {
        const now = new Date();
        const deletionDate = user.deletionScheduledAt
          ? new Date(user.deletionScheduledAt)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Expired past 30-day grace period: treat as permanently purged
        if (now > deletionDate) {
          res.status(404).json({
            success: false,
            error: {
              message: 'Account does not exist or has been permanently purged.',
              code: 'ACCOUNT_PURGED',
            },
          });
          return;
        }

        // Active grace period: issue restricted restoration token (1h)
        const restorationToken = jwt.sign(
          { userId: user._id.toString(), scope: 'ACCOUNT_RESTORATION' },
          ENV.JWT_SECRET,
          { expiresIn: '1h' }
        );

        res.status(200).json({
          success: true,
          isDeactivated: true,
          data: {
            isDeactivated: true,
            email: user.email,
            name: user.name,
            deletionScheduledAt: deletionDate.toISOString(),
            restorationToken,
          },
        });
        return;
      }

      // Link googleId or update verification state or avatar if previously missing
      let hasUpdates = false;
      if (!user.googleId) {
        user.googleId = googleId;
        hasUpdates = true;
      }
      if (!user.isVerified) {
        user.isVerified = true;
        hasUpdates = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        hasUpdates = true;
      }
      if (hasUpdates) {
        await user.save();
      }
    } else {
      // 2. Auto-provision new user account with default baseline financial figures
      const result = await withTransaction(async (session) => {
        const newUser = new User({
          email,
          name: name.trim() || email.split('@')[0],
          avatar: picture || null,
          authProvider: 'GOOGLE',
          googleId,
          isVerified: true,
        });
        await newUser.save({ session });

        const balance = new Balance({
          userId: newUser._id,
          grossBalance: 0,
          baseMonthlyIncome: 0,
          paydayAnchor: 1,
          currency: 'USD',
        });
        await balance.save({ session });

        return { user: newUser, balance };
      });

      user = result.user;
    }

    // 3. Issue session JWT
    const token = jwt.sign(
      { userId: user._id.toString() },
      ENV.JWT_SECRET,
      { expiresIn: (ENV.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
    );

    res.status(200).json({
      success: true,
      data: {
        user: toSafeUser(user),
        token,
      },
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        message: error.message || 'Google authentication failed.',
        code: 'GOOGLE_AUTH_FAILED',
      },
    });
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const user = await User.findById(userId).select('-verificationOtp -passwordResetOtp -passwordChangeOtp');

    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User profile not found.' },
      });
      return;
    }

    const balance = await Balance.findOne({ userId });

    res.status(200).json({
      success: true,
      data: {
        user: toSafeUser(user),
        balance,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP Code
 * POST /api/auth/verify-otp
 */
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const normalizedEmail = (email || '').toLowerCase().trim();
    const cleanOtp = (otp || '').trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'Account not found with this email.', code: 'USER_NOT_FOUND' },
      });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({
        success: false,
        error: { message: 'Account is already verified.', code: 'ALREADY_VERIFIED' },
      });
      return;
    }

    if (user.isDeactivated) {
      res.status(403).json({
        success: false,
        error: { message: 'This account has been deactivated.', code: 'ACCOUNT_DEACTIVATED' },
      });
      return;
    }

    const otpRecord = user.verificationOtp;
    if (!otpRecord || !otpRecord.expiresAt || new Date() > new Date(otpRecord.expiresAt)) {
      res.status(400).json({
        success: false,
        error: { message: 'Verification code has expired. Please request a new code.', code: 'OTP_EXPIRED' },
      });
      return;
    }

    if ((otpRecord.attempts || 0) >= 5) {
      res.status(429).json({
        success: false,
        error: { message: 'Too many invalid attempts. Please request a new code.', code: 'TOO_MANY_ATTEMPTS' },
      });
      return;
    }

    const incomingHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
    if (incomingHash !== otpRecord.codeHash) {
      user.verificationOtp.attempts = (user.verificationOtp.attempts || 0) + 1;
      await user.save();
      const remaining = Math.max(0, 5 - user.verificationOtp.attempts);
      res.status(400).json({
        success: false,
        error: {
          message: `Invalid verification code. Attempts remaining: ${remaining}.`,
          code: 'INVALID_OTP',
          remainingAttempts: remaining,
        },
      });
      return;
    }

    // Success: activate account and clear OTP record
    user.isVerified = true;
    user.verificationOtp = {
      codeHash: null as any,
      expiresAt: null as any,
      attempts: 0,
      lastSentAt: null as any,
    };
    await user.save();

    // Trigger Welcome Email asynchronously
    void emailService.sendWelcomeEmail(user.email, user.name);

    // Issue updated session JWT token
    const token = jwt.sign(
      { userId: user._id.toString() },
      ENV.JWT_SECRET,
      { expiresIn: (ENV.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        user: toSafeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Throttled Resend OTP
 * POST /api/auth/resend-otp
 */
export const resendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'Account not found with this email.', code: 'USER_NOT_FOUND' },
      });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({
        success: false,
        error: { message: 'Account is already verified.', code: 'ALREADY_VERIFIED' },
      });
      return;
    }

    // Throttling: 60-second cooldown
    if (user.verificationOtp?.lastSentAt) {
      const elapsedMs = Date.now() - new Date(user.verificationOtp.lastSentAt).getTime();
      if (elapsedMs < 60000) {
        const remainingSeconds = Math.ceil((60000 - elapsedMs) / 1000);
        res.status(429).json({
          success: false,
          error: {
            message: `Resend cooldown active. Please wait ${remainingSeconds}s.`,
            code: 'RESEND_COOLDOWN',
            remainingSeconds,
          },
        });
        return;
      }
    }

    // Generate fresh 6-digit OTP
    const newOtp = crypto.randomInt(100000, 1000000).toString();
    const hashedCode = crypto.createHash('sha256').update(newOtp).digest('hex');

    user.verificationOtp = {
      codeHash: hashedCode,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      attempts: 0,
      lastSentAt: new Date(),
    };
    await user.save();

    // Dispatch verification email
    await emailService.sendVerificationOtp(user.email, user.name, newOtp);

    res.status(200).json({
      success: true,
      data: {
        message: 'Verification code sent.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Profile Information (Name, Avatar)
 * PATCH /api/users/profile or PATCH /api/auth/profile
 */
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { name, avatar, isOnboarded } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found.', code: 'USER_NOT_FOUND' },
      });
      return;
    }

    if (name !== undefined) {
      user.name = name.trim();
    }
    if (avatar !== undefined) {
      user.avatar = avatar ? String(avatar).trim() : null;
    }
    if (isOnboarded !== undefined) {
      user.isOnboarded = Boolean(isOnboarded);
    }
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: toSafeUser(user),
      },
      message: 'Profile updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request OTP for Password Update/Set
 * POST /api/auth/request-password-otp
 */
export const requestPasswordOtp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { currentPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found.', code: 'USER_NOT_FOUND' },
      });
      return;
    }

    // If user already has a password set, currentPassword must match
    if (user.passwordHash) {
      if (!currentPassword) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Current password is required.',
            code: 'CURRENT_PASSWORD_REQUIRED',
            fieldErrors: { currentPassword: 'Enter your current password to proceed.' },
          },
        });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Current password does not match.',
            code: 'INVALID_CURRENT_PASSWORD',
            fieldErrors: { currentPassword: 'Incorrect current password.' },
          },
        });
        return;
      }
    }

    // Throttling: 60-second cooldown
    if (user.passwordChangeOtp?.lastSentAt) {
      const elapsedMs = Date.now() - new Date(user.passwordChangeOtp.lastSentAt).getTime();
      if (elapsedMs < 60000) {
        const remainingSeconds = Math.ceil((60000 - elapsedMs) / 1000);
        res.status(429).json({
          success: false,
          error: {
            message: `Resend cooldown active. Please wait ${remainingSeconds}s.`,
            code: 'RESEND_COOLDOWN',
            remainingSeconds,
          },
        });
        return;
      }
    }

    // Generate fresh 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedCode = crypto.createHash('sha256').update(otp).digest('hex');

    user.passwordChangeOtp = {
      codeHash: hashedCode,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      attempts: 0,
      lastSentAt: new Date(),
    };
    await user.save();

    // Dispatch verification OTP email
    await emailService.sendPasswordChangeOtp(user.email, user.name, otp);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your registered email.',
      data: {
        expiresIn: '15m',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update/Set Password with OTP Verification
 * PATCH /api/auth/update-password
 */
export const updatePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { currentPassword, newPassword, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found.', code: 'USER_NOT_FOUND' },
      });
      return;
    }

    // If user already has a password set, verify currentPassword
    if (user.passwordHash) {
      if (!currentPassword) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Current password is required.',
            code: 'CURRENT_PASSWORD_REQUIRED',
            fieldErrors: { currentPassword: 'Enter your current password.' },
          },
        });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Current password does not match.',
            code: 'INVALID_CURRENT_PASSWORD',
            fieldErrors: { currentPassword: 'Incorrect current password.' },
          },
        });
        return;
      }
    }

    // Verify OTP
    const cleanOtp = (otp || '').trim();
    const otpRecord = user.passwordChangeOtp;
    if (!otpRecord || !otpRecord.expiresAt || new Date() > new Date(otpRecord.expiresAt)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Verification code has expired. Please request a new code.',
          code: 'OTP_EXPIRED',
        },
      });
      return;
    }

    if ((otpRecord.attempts || 0) >= 5) {
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many invalid attempts. Please request a new code.',
          code: 'TOO_MANY_ATTEMPTS',
        },
      });
      return;
    }

    const incomingHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
    if (incomingHash !== otpRecord.codeHash) {
      user.passwordChangeOtp.attempts = (user.passwordChangeOtp.attempts || 0) + 1;
      await user.save();
      const remaining = Math.max(0, 5 - user.passwordChangeOtp.attempts);
      res.status(400).json({
        success: false,
        error: {
          message: `Invalid verification code. Attempts remaining: ${remaining}.`,
          code: 'INVALID_OTP',
          remainingAttempts: remaining,
        },
      });
      return;
    }

    // OTP Verified! Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    // Clear passwordChangeOtp
    user.passwordChangeOtp = {
      codeHash: null as any,
      expiresAt: null as any,
      attempts: 0,
      lastSentAt: null as any,
    };
    await user.save();

    // Dispatch confirmation email asynchronously
    void emailService.sendPasswordChangedConfirmation(user.email, user.name);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. A confirmation email has been dispatched to your inbox.',
      data: {
        user: toSafeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 30-Day Soft Account Deactivation
 * POST /api/auth/deactivate
 */
export const deactivateAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found.', code: 'USER_NOT_FOUND' },
      });
      return;
    }

    if (user.isDeactivated) {
      res.status(400).json({
        success: false,
        error: { message: 'Account is already deactivated.', code: 'ALREADY_DEACTIVATED' },
      });
      return;
    }

    user.isDeactivated = true;
    user.deactivatedAt = new Date();
    user.deletionScheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();

    // Trigger deactivation notice email asynchronously
    void emailService.sendDeactivationNotice(
      user.email,
      user.name,
      user.deletionScheduledAt
    );

    res.status(200).json({
      success: true,
      message: 'Your account has been deactivated. 30-day recovery window is active.',
      data: {
        deletionScheduledAt: user.deletionScheduledAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to calculate skipped month cycles (YYYY-MM) between deactivation and restoration dates,
 * excluding the current restoration month.
 */
export const calculateDormantCycles = (deactivatedAt: Date, restoredAt: Date): string[] => {
  const cycles: string[] = [];
  const start = new Date(deactivatedAt);
  const end = new Date(restoredAt);

  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current < endMonth) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    cycles.push(`${yyyy}-${mm}`);
    current.setMonth(current.getMonth() + 1);
  }

  return cycles;
};

/**
 * Self-Service Account Restoration
 * POST /api/auth/restore
 */
export const restoreAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined = req.body?.restorationToken;
    const authHeader = req.headers.authorization;

    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    let userId: string | undefined = (req as AuthRequest).userId;

    if (token) {
      try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
          userId: string;
          scope?: string;
        };
        userId = decoded.userId;
      } catch (err: any) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Invalid or expired restoration token.',
            code: 'INVALID_TOKEN',
          },
        });
        return;
      }
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Restoration token or active session is required.',
          code: 'UNAUTHORIZED',
        },
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found.', code: 'USER_NOT_FOUND' },
      });
      return;
    }

    if (!user.isDeactivated) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Account is not deactivated.',
          code: 'ACCOUNT_NOT_DEACTIVATED',
        },
      });
      return;
    }

    const now = new Date();
    if (user.deletionScheduledAt && now > new Date(user.deletionScheduledAt)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Grace period has expired. Account cannot be restored.',
          code: 'RESTORATION_PERIOD_EXPIRED',
        },
      });
      return;
    }

    // Reconcile dormant cycles, unfreeze account state, and clone active recurring overheads
    const { skippedCycles } = await reconciliationService.reconcileDormantCycles(
      user._id,
      user.deactivatedAt || now,
      now
    );

    const updatedUser = await User.findById(user._id);

    // Dispatch confirmation email
    void emailService.sendRestorationNotice(user.email, user.name);

    // Issue full session token
    const sessionToken = jwt.sign(
      { userId: user._id.toString() },
      ENV.JWT_SECRET,
      { expiresIn: (ENV.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
    );

    res.status(200).json({
      success: true,
      message: 'Account restored successfully. Recurring ledger active.',
      token: sessionToken,
      data: {
        user: toSafeUser(updatedUser || user),
        token: sessionToken,
        reconciledCycles: skippedCycles,
      },
    });
  } catch (error) {
    next(error);
  }
};
