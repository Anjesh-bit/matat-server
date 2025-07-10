import rateLimit from 'express-rate-limit';
import { EnvUtils } from '../config/env';
const serverConfig = EnvUtils.getServerConfig();
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: serverConfig.rateLimitWindowMs || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
