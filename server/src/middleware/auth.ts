import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
  userId?: string;
}

export interface JwtPayload {
  userId: string;
  scope?: string;
}

const UNVERIFIED_ALLOWED_PATHS = [
  '/auth/me',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/logout',
];

const isUnverifiedAllowedPath = (req: Request): boolean => {
  const fullPath = `${req.baseUrl || ''}${req.path || ''}`.replace(/\/+$/, '');
  const cleanOriginalUrl = (req.originalUrl || '').split('?')[0].replace(/\/+$/, '');
  return UNVERIFIED_ALLOWED_PATHS.some(
    (allowed) =>
      fullPath === allowed ||
      fullPath.endsWith(allowed) ||
      cleanOriginalUrl === allowed ||
      cleanOriginalUrl.endsWith(allowed)
  );
};

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Authorization header missing or malformed.',
      error: {
        message: 'Authentication required. Authorization header missing or malformed.',
        code: 'UNAUTHORIZED',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
  } catch (error) {
    res.status(401).json({
      success: false,
      code: 'TOKEN_INVALID',
      message: 'Invalid or expired authentication token.',
      error: {
        message: 'Invalid or expired authentication token.',
        code: 'TOKEN_INVALID',
      },
    });
    return;
  }

  if (decoded.scope === 'ACCOUNT_RESTORATION') {
    res.status(403).json({
      success: false,
      code: 'FORBIDDEN_SCOPE',
      message: 'Token scope restricted to account restoration',
      error: {
        code: 'FORBIDDEN_SCOPE',
        message: 'Token scope restricted to account restoration',
      },
    });
    return;
  }

  try {
    const user = await User.findById(decoded.userId)
      .select('isDeactivated isVerified')
      .lean();

    if (!user) {
      res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'User account not found.',
        error: {
          code: 'UNAUTHORIZED',
          message: 'User account not found.',
        },
      });
      return;
    }

    if (user.isDeactivated === true) {
      res.status(403).json({
        success: false,
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Account is deactivated',
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Account is deactivated',
        },
      });
      return;
    }

    if (user.isVerified === false && !isUnverifiedAllowedPath(req)) {
      res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification required',
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Email verification required',
        },
      });
      return;
    }

    req.user = { id: decoded.userId };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    next(error);
  }
};

export const authenticateRestoration = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  let token: string | undefined =
    typeof req.body?.restorationToken === 'string'
      ? req.body.restorationToken.trim()
      : undefined;

  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Restoration token is required.',
      error: {
        code: 'UNAUTHORIZED',
        message: 'Restoration token is required.',
      },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;

    if (decoded.scope !== 'ACCOUNT_RESTORATION') {
      res.status(403).json({
        success: false,
        code: 'FORBIDDEN_SCOPE',
        message: 'Invalid token scope for account restoration.',
        error: {
          code: 'FORBIDDEN_SCOPE',
          message: 'Invalid token scope for account restoration.',
        },
      });
      return;
    }

    req.user = { id: decoded.userId };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired restoration token.',
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired restoration token.',
      },
    });
  }
};
