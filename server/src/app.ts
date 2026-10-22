import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';

const app: Express = express();

// Standard middleware
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1', apiRouter);

// Catch-all 404 handler for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { message: 'Requested resource or endpoint does not exist.' },
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
