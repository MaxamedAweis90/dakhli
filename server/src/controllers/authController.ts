import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { Balance, User } from '../models';
import { withTransaction } from '../services/transactionHelper';
import { AuthRequest } from '../middleware/auth';
import { verifyGoogleToken } from '../services/googleAuthService';

// Helper to project safe user payload
export const toSafeUser = (user: any) => ({
  id: user._id.toString(),
  _id: user._id.toString(),
  email: user.email,
  name: user.name,
  authProvider: user.authProvider || 'LOCAL',
  isVerified: Boolean(user.isVerified),
  isDeactivated: Boolean(user.isDeactivated),
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

    const result = await withTransaction(async (session) => {
      const user = new User({
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        authProvider: 'LOCAL',
        isVerified: false,
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

    if (user.isDeactivated) {
      res.status(403).json({
        success: false,
        error: {
          message: 'This account has been deactivated.',
          code: 'ACCOUNT_DEACTIVATED',
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
    const { idToken, credential, token: rawToken } = req.body;
    const tokenToVerify = idToken || credential || rawToken;

    if (!tokenToVerify) {
      res.status(400).json({
        success: false,
        error: { message: 'Google credential or idToken is required.' },
      });
      return;
    }

    const googlePayload = await verifyGoogleToken(tokenToVerify);
    const { googleId, email, name } = googlePayload;

    // 1. Look up existing user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      if (user.isDeactivated) {
        res.status(403).json({
          success: false,
          error: {
            message: 'This account has been deactivated.',
            code: 'ACCOUNT_DEACTIVATED',
          },
        });
        return;
      }

      // Link googleId or update verification state if previously registered locally
      let hasUpdates = false;
      if (!user.googleId) {
        user.googleId = googleId;
        hasUpdates = true;
      }
      if (!user.isVerified) {
        user.isVerified = true;
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
    const user = await User.findById(userId).select('-passwordHash -verificationOtp -passwordResetOtp');

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
