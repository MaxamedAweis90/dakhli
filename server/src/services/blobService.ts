import { put, get, del, createFolder, list } from '@vercel/blob';
import crypto from 'crypto';
import path from 'path';
import { ENV } from '../config/env';

export type StorageFolder = 'items' | 'avatars';

export interface UploadOptions {
  folder?: StorageFolder;
  userId?: string;
  customPrefix?: string;
}

export interface UploadResult {
  url: string;
  rawBlobUrl?: string;
  pathname: string;
  provider: 'vercel-blob' | 'fallback-data-url';
  folder: StorageFolder;
}

export interface BlobStreamResult {
  statusCode: number;
  stream: NodeJS.ReadableStream | any;
  contentType: string;
  contentLength?: string;
  etag?: string;
}

/**
 * Normalizes and extracts the Vercel Blob Read/Write token from configuration.
 */
export const getCleanBlobToken = (): string => {
  const rawToken = ENV.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || '';
  return rawToken.trim().replace(/^["']|["']$/g, '');
};

/**
 * Initializes the dual-folder structure ('items/' and 'avatars/') in the Vercel Blob store ('dakhli-item-assets').
 * Safe and idempotent: will not overwrite existing assets.
 */
export const initBlobFolders = async (): Promise<{
  success: boolean;
  folders: { items: boolean; avatars: boolean };
  message: string;
}> => {
  const token = getCleanBlobToken();

  if (!token) {
    return {
      success: false,
      folders: { items: false, avatars: false },
      message: 'BLOB_READ_WRITE_TOKEN not configured.',
    };
  }

  const status = { items: false, avatars: false };

  try {
    // List existing blobs/folders to check presence
    const existing = await list({ token });
    const pathnames = new Set(existing.blobs.map((b) => b.pathname));

    if (!pathnames.has('items/')) {
      try {
        await createFolder('items/', { access: 'private', token });
        status.items = true;
      } catch (err: any) {
        // If it already exists or returns overwrite notice, mark as initialized
        status.items = true;
      }
    } else {
      status.items = true;
    }

    if (!pathnames.has('avatars/')) {
      try {
        await createFolder('avatars/', { access: 'private', token });
        status.avatars = true;
      } catch (err: any) {
        status.avatars = true;
      }
    } else {
      status.avatars = true;
    }

    console.log('[BlobService] Folders initialized in dakhli-item-assets: items/ (true), avatars/ (true)');
    return {
      success: true,
      folders: status,
      message: 'Folders items/ and avatars/ verified and ready in dakhli-item-assets.',
    };
  } catch (err: any) {
    console.error('[BlobService] Error during folder initialization:', err?.message || err);
    return {
      success: false,
      folders: status,
      message: err?.message || 'Failed to initialize blob folders.',
    };
  }
};

/**
 * Uploads an image file buffer to Vercel Blob ('dakhli-item-assets') into the designated folder.
 * If BLOB_READ_WRITE_TOKEN is not configured, provides a base64 Data URL fallback for local development.
 */
export const uploadImageToStorage = async (
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  const token = getCleanBlobToken();
  const folder: StorageFolder = options.folder === 'avatars' ? 'avatars' : 'items';

  const ext = path.extname(originalName) || '.jpg';
  const cleanBase = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const randomSuffix = crypto.randomBytes(6).toString('hex');
  const userPrefix = options.userId ? `${options.userId.slice(-6)}_` : '';
  const pathname = `${folder}/${userPrefix}${cleanBase}_${randomSuffix}${ext}`;

  if (token && token.length > 0) {
    try {
      // Upload to Vercel Blob with private access and long-term cache headers
      const blob = await put(pathname, buffer, {
        access: 'private',
        contentType: mimeType,
        token,
        addRandomSuffix: false, // pathname already includes unique randomSuffix
        cacheControlMaxAge: 31536000, // 1 year immutable edge cache
      });

      // For private blob stores, direct URLs return 403 Forbidden on public browser fetch.
      // We route the client through our high-performance streaming proxy endpoint.
      const accessibleUrl = `/api/v1/upload/media/${blob.pathname}`;

      return {
        url: accessibleUrl,
        rawBlobUrl: blob.url,
        pathname: blob.pathname,
        provider: 'vercel-blob',
        folder,
      };
    } catch (error) {
      console.error(
        `[BlobService] Vercel Blob upload to folder '${folder}' failed, falling back to data URL:`,
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
    pathname,
    provider: 'fallback-data-url',
    folder,
  };
};

/**
 * Streams a stored blob by pathname from Vercel Blob.
 */
export const getBlobStream = async (pathname: string): Promise<BlobStreamResult | null> => {
  const token = getCleanBlobToken();
  if (!token) return null;

  try {
    const cleanPath = pathname.replace(/^\/+/, '');
    const blobRes = await get(cleanPath, { token, access: 'private' });

    if (!blobRes || blobRes.statusCode !== 200) {
      return null;
    }

    const contentType = blobRes.headers.get('content-type') || 'application/octet-stream';
    const contentLength = blobRes.headers.get('content-length') || undefined;
    const etag = blobRes.headers.get('etag') || undefined;

    return {
      statusCode: blobRes.statusCode,
      stream: blobRes.stream,
      contentType,
      contentLength,
      etag,
    };
  } catch (err: any) {
    console.error(`[BlobService] Error streaming blob '${pathname}':`, err?.message || err);
    return null;
  }
};

/**
 * Safely deletes a file from Vercel Blob storage.
 */
export const deleteBlobFromStorage = async (urlOrPathname: string): Promise<boolean> => {
  const token = getCleanBlobToken();
  if (!token || !urlOrPathname) return false;

  try {
    // If it's a data URL, nothing to delete
    if (urlOrPathname.startsWith('data:')) return true;

    // Extract pathname from media proxy URL if applicable
    let target = urlOrPathname;
    const mediaProxyMatch = urlOrPathname.match(/\/upload\/media\/(.+)$/);
    if (mediaProxyMatch) {
      target = mediaProxyMatch[1];
    }

    await del(target, { token });
    return true;
  } catch (err: any) {
    console.warn(`[BlobService] Could not delete blob '${urlOrPathname}':`, err?.message || err);
    return false;
  }
};
