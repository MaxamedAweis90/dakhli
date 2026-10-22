import mongoose from 'mongoose';
import { ENV } from './env';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI);
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
};

const handleTermination = async (signal: string): Promise<void> => {
  console.log(`[Database] Received ${signal}. Gracefully closing MongoDB connection...`);
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('[Database] Error closing MongoDB connection on shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => handleTermination('SIGINT'));
process.on('SIGTERM', () => handleTermination('SIGTERM'));
