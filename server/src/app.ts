import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { ENV } from './config/env';

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

export default app;
