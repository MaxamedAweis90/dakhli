import mongoose, { ClientSession } from 'mongoose';

/**
 * Executes a callback within a managed Mongoose transaction.
 * If an existing session is supplied, it reuses it; otherwise, it starts
 * and automatically commits or aborts a new transaction.
 */
export const withTransaction = async <T>(
  callback: (session: ClientSession) => Promise<T>,
  existingSession?: ClientSession
): Promise<T> => {
  if (existingSession) {
    return callback(existingSession);
  }

  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    return result!;
  } finally {
    await session.endSession();
  }
};
