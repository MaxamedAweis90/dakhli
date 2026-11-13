import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { UploadSession } from '../models/UploadSession';
import { User } from '../models/User';
import {
  uploadImageToStorage,
  getBlobStream,
  deleteBlobFromStorage,
  initBlobFolders,
  StorageFolder,
} from '../services/blobService';
import { AuthRequest } from '../middleware/auth';
import { toSafeUser } from './authController';

/**
 * Streams media from Vercel Blob with immutable HTTP caching.
 * GET /api/v1/upload/media/*
 */
export const streamMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract everything after /media/
    const rawPath = (req.params as any).path ?? req.params[0] ?? '';
    const targetPath = Array.isArray(rawPath) ? rawPath.join('/') : String(rawPath);
    if (!targetPath) {
      res.status(400).json({
        success: false,
        error: { message: 'Media pathname required.', code: 'MISSING_PATH' },
      });
      return;
    }

    const cleanPath = targetPath.replace(/^\/+/, '');
    const blobResult = await getBlobStream(cleanPath);

    if (!blobResult) {
      res.status(404).json({
        success: false,
        error: { message: 'Asset not found in blob storage.', code: 'ASSET_NOT_FOUND' },
      });
      return;
    }

    res.status(200);
    res.setHeader('Content-Type', blobResult.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (blobResult.contentLength) {
      res.setHeader('Content-Length', blobResult.contentLength);
    }
    if (blobResult.etag) {
      res.setHeader('ETag', blobResult.etag);
    }

    // Stream blob chunks to Express response
    for await (const chunk of blobResult.stream) {
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * Initializes and verifies storage folders in 'dakhli-item-assets'.
 * POST /api/v1/upload/init
 */
export const initializeStorageFolders = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await initBlobFolders();
    res.status(result.success ? 200 : 500).json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Uploads user profile avatar into 'avatars/' folder in 'dakhli-item-assets' (Max 2MB).
 * Automatically updates user document and deletes obsolete blob if replaced.
 * POST /api/v1/upload/avatar
 */
export const uploadAvatar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: 'No avatar image file uploaded.', code: 'NO_FILE' },
      });
      return;
    }

    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required.', code: 'UNAUTHORIZED' },
      });
      return;
    }

    const uploadResult = await uploadImageToStorage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      { folder: 'avatars', userId }
    );

    // Persist to User document
    const user = await User.findById(userId);
    if (user) {
      const oldAvatar = user.avatar;
      user.avatar = uploadResult.url;
      await user.save();

      // Clean up previous custom blob if different
      if (oldAvatar && oldAvatar !== uploadResult.url && oldAvatar.includes('/upload/media/avatars/')) {
        void deleteBlobFromStorage(oldAvatar);
      }

      res.status(200).json({
        success: true,
        data: {
          imageUrl: uploadResult.url,
          pathname: uploadResult.pathname,
          provider: uploadResult.provider,
          folder: uploadResult.folder,
          user: toSafeUser(user),
        },
        message: 'Avatar uploaded and profile updated successfully.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        imageUrl: uploadResult.url,
        pathname: uploadResult.pathname,
        provider: uploadResult.provider,
        folder: uploadResult.folder,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Uploads an item image into 'items/' folder in 'dakhli-item-assets' (Max 5MB).
 * POST /api/v1/upload/item
 */
export const uploadItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: 'No item image file uploaded.', code: 'NO_FILE' },
      });
      return;
    }

    const uploadResult = await uploadImageToStorage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      { folder: 'items', userId: req.userId }
    );

    res.status(200).json({
      success: true,
      data: {
        imageUrl: uploadResult.url,
        pathname: uploadResult.pathname,
        provider: uploadResult.provider,
        folder: uploadResult.folder,
      },
      message: 'Item image uploaded successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Direct file upload supporting folder parameter ('items' | 'avatars').
 * POST /api/v1/upload/direct
 */
export const uploadDirect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: 'No image file uploaded.', code: 'NO_FILE' },
      });
      return;
    }

    const requestedFolder = ((req.query.folder as string) || (req.body.folder as string) || 'items').toLowerCase();
    const folder: StorageFolder = requestedFolder === 'avatars' ? 'avatars' : 'items';

    // Verify avatar-specific size ceiling (2MB)
    if (folder === 'avatars' && req.file.size > 2 * 1024 * 1024) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Avatar image exceeds 2MB size limit.',
          code: 'FILE_TOO_LARGE',
        },
      });
      return;
    }

    const uploadResult = await uploadImageToStorage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      { folder, userId: req.userId }
    );

    res.status(200).json({
      success: true,
      data: {
        imageUrl: uploadResult.url,
        pathname: uploadResult.pathname,
        provider: uploadResult.provider,
        folder: uploadResult.folder,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a cross-device mobile upload session for QR code scanning.
 * POST /api/v1/upload/session
 */
export const createUploadSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await UploadSession.create({
      sessionId,
      userId: req.userId ? req.userId : undefined,
      status: 'PENDING',
      expiresAt,
    });

    res.status(201).json({
      success: true,
      data: {
        sessionId,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Polls the status of an upload session.
 * GET /api/v1/upload/session/:sessionId
 */
export const getUploadSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.sessionId as string;

    const session = await UploadSession.findOne({ sessionId });
    if (!session) {
      res.status(404).json({
        success: false,
        error: { message: 'Upload session not found or expired.', code: 'NOT_FOUND' },
      });
      return;
    }

    if (new Date() > session.expiresAt) {
      session.status = 'EXPIRED';
      await session.save();
    }

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        status: session.status,
        imageUrl: session.imageUrl,
        expiresAt: session.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accepts file upload from the mobile phone for an active session (uploads to 'items/' folder).
 * POST /api/v1/upload/session/:sessionId
 */
export const uploadToSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.sessionId as string;

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: 'No file provided.', code: 'NO_FILE' },
      });
      return;
    }

    const session = await UploadSession.findOne({ sessionId });
    if (!session) {
      res.status(404).json({
        success: false,
        error: { message: 'Upload session not found or expired.', code: 'NOT_FOUND' },
      });
      return;
    }

    if (new Date() > session.expiresAt || session.status === 'EXPIRED') {
      res.status(410).json({
        success: false,
        error: {
          message: 'Upload session has expired. Please refresh the QR code on your desktop.',
          code: 'SESSION_EXPIRED',
        },
      });
      return;
    }

    const uploadResult = await uploadImageToStorage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      { folder: 'items', userId: session.userId?.toString() }
    );

    session.imageUrl = uploadResult.url;
    session.status = 'COMPLETED';
    await session.save();

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        imageUrl: session.imageUrl,
        pathname: uploadResult.pathname,
        provider: uploadResult.provider,
        folder: uploadResult.folder,
      },
    });
  } catch (error) {
    next(error);
  }
};
