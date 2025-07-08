import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes/v1';
import { errorHandler } from './middleware/error-handler.middleware';

import { apiRateLimiter } from './middleware/rate-limit.middleware';

import { whiteListUrls } from './constant/cors.constant';
import compression from 'compression';
import helmet from 'helmet';
import { logger } from './utils/logger.utils';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: whiteListUrls,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(compression());

app.use((req, _, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    query: req.query,
  });
  next();
});

app.use('/api', apiRateLimiter);
app.use('/api/v1', routes);

app.get('/health', (_, res) => {
  res.json({
    success: true,
    message: 'WooCommerce Sync API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.use((_, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

export default app;
