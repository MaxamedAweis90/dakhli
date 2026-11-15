import {
  User,
  Balance,
  OverheadItem,
  OverheadMonthlyRecord,
  IncomeAdjustment,
  DailyLog,
  SavePlan,
  Item,
  UploadSession,
} from '../models';
import { deleteBlobFromStorage } from './blobService';

/**
 * Permanently purge accounts whose 60-day deactivation grace period has expired.
 * Cascade-removes uploaded media blobs and all financial/personal documents.
 */
export const purgeExpiredAccounts = async (): Promise<{ purgedCount: number }> => {
  const now = new Date();

  try {
    const expiredUsers = await User.find({
      isDeactivated: true,
      deletionScheduledAt: { $ne: null, $lt: now },
    });

    if (expiredUsers.length === 0) {
      return { purgedCount: 0 };
    }

    console.log(
      `[PurgeService] Found ${expiredUsers.length} expired deactivated account(s) ready for permanent purge.`
    );

    let purgedCount = 0;

    for (const user of expiredUsers) {
      const userId = user._id;

      // Collect and remove managed Vercel Blob media before wiping MongoDB records
      const userItems = await Item.find({ userId }).select('imageUrl').lean();
      const candidateUrls = [
        user.avatar,
        (user as unknown as { avatarUrl?: string | null }).avatarUrl,
        ...userItems.map((item) => item.imageUrl),
      ].filter(
        (url): url is string =>
          typeof url === 'string' && url.includes('/upload/media/')
      );

      const uniqueBlobUrls = Array.from(new Set(candidateUrls));
      for (const blobUrl of uniqueBlobUrls) {
        try {
          await deleteBlobFromStorage(blobUrl);
        } catch (blobErr) {
          console.warn(
            `[PurgeService] Failed to delete blob (${blobUrl}) for user ${userId}:`,
            blobErr
          );
        }
      }

      // Cascade remove all associated financial documents
      await Promise.all([
        Balance.deleteMany({ userId }),
        OverheadItem.deleteMany({ userId }),
        OverheadMonthlyRecord.deleteMany({ userId }),
        IncomeAdjustment.deleteMany({ userId }),
        DailyLog.deleteMany({ userId }),
        SavePlan.deleteMany({ userId }),
        Item.deleteMany({ userId }),
        UploadSession.deleteMany({ userId }),
      ]);

      // Remove user record
      await User.deleteOne({ _id: userId });
      purgedCount += 1;

      console.log(
        `[PurgeService] Permanently purged account ${user.email} (${userId}).`
      );
    }

    console.log(
      `[PurgeService] Permanent purge completed. Total purged: ${purgedCount}.`
    );

    return { purgedCount };
  } catch (error: any) {
    console.error(`[PurgeService] Error during account purge execution: ${error.message}`);
    return { purgedCount: 0 };
  }
};

/**
 * Initialize automatic periodic purge worker (every 24 hours)
 */
export const startPurgeWorker = (intervalMs = 24 * 60 * 60 * 1000): NodeJS.Timeout => {
  // Execute once on boot
  void purgeExpiredAccounts();

  // Schedule periodic cleanup
  const timer = setInterval(() => {
    void purgeExpiredAccounts();
  }, intervalMs);

  return timer;
};

export const purgeService = {
  purgeExpiredAccounts,
  startPurgeWorker,
};

export default purgeService;

