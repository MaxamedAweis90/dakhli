import app from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';
import { emailService } from './services/emailService';
import { purgeService } from './services/purgeService';
import { initBlobFolders } from './services/blobService';

const startServer = async (): Promise<void> => {
  await connectDB();

  // Non-blocking email transport verification on server boot
  void emailService.verifyTransport();

  // Non-blocking storage folders verification ('items/', 'avatars/') in Vercel Blob
  void initBlobFolders();

  // Start background 30-day purge worker
  purgeService.startPurgeWorker();

  const server = app.listen(ENV.PORT, () => {
    console.log(`[Server] Dakhli API running on port ${ENV.PORT} (${ENV.NODE_ENV})`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server] Fatal Error: Port ${ENV.PORT} is already in use by another application. Please free port ${ENV.PORT} or change PORT in .env.`);
    } else {
      console.error('[Server] Fatal server error:', err);
    }
    process.exit(1);
  });
};

startServer().catch((error) => {
  console.error('[Server] Fatal bootstrap error:', error);
  process.exit(1);
});
