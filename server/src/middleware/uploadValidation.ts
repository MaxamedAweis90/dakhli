import { Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import path from 'path';

// Upload Size Limits
export const MAX_ITEM_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_AVATAR_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB

// Allowed MIME types
export const ALLOWED_ITEM_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
];

export const ALLOWED_AVATAR_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// Allowed extensions
export const ALLOWED_ITEM_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
export const ALLOWED_AVATAR_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Validates the binary header (magic numbers) of an image buffer
 * to prevent file extension spoofing attacks.
 */
export const verifyImageMagicBytes = (
  buffer: Buffer
): { valid: boolean; detectedMime?: string } => {
  if (!buffer || buffer.length < 12) {
    return { valid: false };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedMime: 'image/png' };
  }

  // WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, detectedMime: 'image/webp' };
  }

  // AVIF: offset 4 'ftypavif' or 'ftypavis'
  const ftyp = buffer.subarray(4, 12).toString('ascii');
  if (ftyp.startsWith('ftyp') && (ftyp.includes('avif') || ftyp.includes('avis'))) {
    return { valid: true, detectedMime: 'image/avif' };
  }

  return { valid: false };
};

/**
 * Helper to create a configured Multer uploader with standard image filters
 */
const createMulterUploader = (maxSize: number, allowedMimes: string[], allowedExts: string[]) => {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxSize,
      files: 1,
    },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const mime = file.mimetype.toLowerCase();

      if (!allowedMimes.includes(mime)) {
        return cb(
          new Error(
            `Unsupported image format (${mime}). Allowed formats: ${allowedExts.join(', ')}`
          )
        );
      }

      if (!allowedExts.includes(ext)) {
        return cb(
          new Error(
            `Invalid file extension (${ext}). Allowed extensions: ${allowedExts.join(', ')}`
          )
        );
      }

      cb(null, true);
    },
  });
};

const itemUploader = createMulterUploader(
  MAX_ITEM_IMAGE_SIZE,
  ALLOWED_ITEM_MIME_TYPES,
  ALLOWED_ITEM_EXTENSIONS
);

const avatarUploader = createMulterUploader(
  MAX_AVATAR_IMAGE_SIZE,
  ALLOWED_AVATAR_MIME_TYPES,
  ALLOWED_AVATAR_EXTENSIONS
);

/**
 * Middleware wrapper that catches Multer limit and validation errors gracefully
 */
const wrapMulterMiddleware = (
  uploader: multer.Multer,
  maxSizeBytes: number
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    uploader.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            const limitMb = Math.round(maxSizeBytes / (1024 * 1024));
            res.status(400).json({
              success: false,
              error: {
                message: `File size exceeds the ${limitMb}MB limit.`,
                code: 'FILE_TOO_LARGE',
              },
            });
            return;
          }
        }
        res.status(400).json({
          success: false,
          error: {
            message: err.message || 'Image upload validation failed.',
            code: 'INVALID_IMAGE',
          },
        });
        return;
      }

      // If file exists, perform deep binary magic byte verification
      if (req.file) {
        const magic = verifyImageMagicBytes(req.file.buffer);
        if (!magic.valid) {
          res.status(400).json({
            success: false,
            error: {
              message: 'Invalid or corrupted image format. Magic bytes signature verification failed.',
              code: 'INVALID_IMAGE_SIGNATURE',
            },
          });
          return;
        }
      }

      next();
    });
  };
};

export const uploadItemImage = wrapMulterMiddleware(itemUploader, MAX_ITEM_IMAGE_SIZE);
export const uploadAvatarImage = wrapMulterMiddleware(avatarUploader, MAX_AVATAR_IMAGE_SIZE);
