import dotenv from 'dotenv';
dotenv.config();

import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';

import logger from "./config/logger";
import { proxyServices, setupRealtimeProxy } from './config/services';
import config from './config';
import { apiRateLimiter } from './middleware/rateLimiter';

const app = express();

app.use(helmet());
app.use(cors());

// Mount the realtime (Socket.IO) proxy before the rate limiter so long-lived
// socket polling/upgrade traffic is not throttled.
setupRealtimeProxy(app);

app.use(apiRateLimiter );

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

proxyServices(app);

app.use((req: Request, res: Response) => {
  logger.warn(`Resource not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'resource not found' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const startServer = () => {
  try {
    app.listen(config.port, () => {
      logger.info(`${config.SERVICE_NAME} running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
