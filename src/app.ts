import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRouter from './routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { config } from './config/env';

export const createApp = (): Application => {
  const app = express();

  // Security & Utility Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (config.nodeEnv !== 'test') {
    app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
  }

  // Root welcome route
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Thread Service API',
      version: '1.0.0',
      status: 'active',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        threads: '/api/v1/threads',
        interactions: '/api/v1/interactions',
      },
    });
  });

  // Mount API Router on all common prefix patterns for maximum Postman compatibility
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);
  app.use('/api/v1/api/v1', apiRouter);
  app.use('/', apiRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Route not found: [${req.method}] ${req.originalUrl}`,
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
