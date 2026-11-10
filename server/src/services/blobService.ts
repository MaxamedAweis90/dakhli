import { put } from '@vercel/blob';
import crypto from 'crypto';
import path from 'path';

export interface UploadResult {
  url: string;
  provider: 'vercel-blob' | 'fallback-data-url';
}

/**
 * Uploads a file buffer to Vercel Blob.
 * If BLOB_READ_WRITE_TOKEN is not configured, provides a fallback data URL
 * so local development and immediate testing work seamlessly.
 */
export const uploadImageToStorage = async (
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadResult> => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const ext = path.extname(originalName) || '.jpg';
  const cleanBase = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const randomSuffix = crypto.randomBytes(6).toString('hex');
  const filename = `items/${cleanBase}_${randomSuffix}${ext}`;

  if (token && token.trim().length > 0) {
    try {
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: mimeType,
        token: token.trim(),
      });

      return {
        url: blob.url,
        provider: 'vercel-blob',
      };
    } catch (error) {
      console.error(
        '[BlobService] Vercel Blob upload failed, falling back to data URL:',
        error
      );
    }
  } else {
    console.warn(
      '[BlobService] BLOB_READ_WRITE_TOKEN not detected in environment. Using embedded data URL fallback for local development.'
    );
  }

  // Graceful local fallback: Return Base64 Data URL
  const base64Data = buffer.toString('base64');
  const fallbackUrl = `data:${mimeType || 'image/jpeg'};base64,${base64Data}`;

  return {
    url: fallbackUrl,
    provider: 'fallback-data-url',
  };
};

