import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { UploadSession } from '../models/UploadSession';
import { uploadImageToStorage } from '../services/blobService';
import { AuthRequest } from '../middleware/auth';

/**
 * Creates a cross-device mobile upload session for QR code scanning.
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
        error: { message: 'Upload session not found or expired.' },
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
 * Accepts file upload from the mobile phone for an active session.
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
        error: { message: 'No file provided.' },
      });
      return;
    }

    const session = await UploadSession.findOne({ sessionId });
    if (!session) {
      res.status(404).json({
        success: false,
        error: { message: 'Upload session not found or expired.' },
      });
      return;
    }

    if (new Date() > session.expiresAt || session.status === 'EXPIRED') {
      res.status(410).json({
        success: false,
        error: { message: 'Upload session has expired. Please refresh the QR code on your desktop.' },
      });
      return;
    }

    const uploadResult = await uploadImageToStorage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    session.imageUrl = uploadResult.url;
    session.status = 'COMPLETED';
    await session.save();

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        imageUrl: session.imageUrl,
        provider: uploadResult.provider,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Direct file upload from desktop or mobile file input.
 */
export const uploadDirect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: 'No image file uploaded.' },
      });
      return;
    }

    const uploadResult = await uploadImageToStorage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.status(200).json({
      success: true,
      data: {
        imageUrl: uploadResult.url,
        provider: uploadResult.provider,
      },
    });
  } catch (error) {
    next(error);
  }
};

