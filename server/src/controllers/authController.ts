import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { Balance, User } from '../models';
import { withTransaction } from '../services/transactionHelper';
import { AuthRequest } from '../middleware/auth';

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
        error: { message: 'An account with this email already exists.' },
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
        user: {
          id: result.user._id,
          email: result.user.email,
          name: result.user.name,
        },
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
        error: { message: 'Invalid email or password.' },
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password.' },
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
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const user = await User.findById(userId).select('-passwordHash');

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
        user,
        balance,
      },
    });
  } catch (error) {
    next(error);
  }
};
