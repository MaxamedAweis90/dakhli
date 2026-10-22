import app from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(ENV.PORT, () => {
    console.log(`[Server] Dakhli API running on port ${ENV.PORT} (${ENV.NODE_ENV})`);
  });
};

startServer().catch((error) => {
  console.error('[Server] Fatal bootstrap error:', error);
  process.exit(1);
});
