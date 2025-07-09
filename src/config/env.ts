import dotenv from 'dotenv';
import { log } from '../utils/logger.utils.js';

dotenv.config();

interface EnvironmentConfiguration {
  readonly NODE_ENV: 'development' | 'production' | 'test';
  readonly PORT: string;
  readonly DB_USER_NAME: string;
  readonly DB_PASSWORD: string;
  readonly DB_NAME: string;
  readonly FRONTEND_URL: string;
  readonly WOOCOMMERCE_API_BASE_URL: string;
  readonly WOOCOMMERCE_CONSUMER_KEY: string;
  readonly WOOCOMMERCE_CONSUMER_SECRET: string;
  readonly SYNC_CRON_SCHEDULE: string;
  readonly ORDER_RETENTION_DAYS: string;
  readonly ORDER_FETCH_DAYS: string;
  readonly RATE_LIMIT_WINDOW_MS: string;
  readonly RATE_LIMIT_MAX_REQUESTS: string;
}

const REQUIRED_ENV_VARIABLES = [
  'WOOCOMMERCE_API_BASE_URL',
  'WOOCOMMERCE_CONSUMER_KEY',
  'WOOCOMMERCE_CONSUMER_SECRET',
  'DB_USER_NAME',
  'DB_PASSWORD',
  'DB_NAME',
  'SYNC_CRON_SCHEDULE',
  'ORDER_RETENTION_DAYS',
  'ORDER_FETCH_DAYS',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
] as const;

const ENV_DEFAULTS = {
  NODE_ENV: 'development',
  PORT: '5000',
  FRONTEND_URL: '',
  SYNC_CRON_SCHEDULE: '0 12 * * *',
  ORDER_RETENTION_DAYS: '90',
  ORDER_FETCH_DAYS: '30',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100',
} as const;

const createEnvironmentConfiguration = (): EnvironmentConfiguration => {
  const rawEnvironment = {
    NODE_ENV: process.env.NODE_ENV || ENV_DEFAULTS.NODE_ENV,
    PORT: process.env.PORT || ENV_DEFAULTS.PORT,
    DB_USER_NAME: process.env.DB_USER_NAME || '',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || '',
    FRONTEND_URL: process.env.FRONTEND_URL || ENV_DEFAULTS.FRONTEND_URL,
    WOOCOMMERCE_API_BASE_URL: process.env.WOOCOMMERCE_API_BASE_URL || '',
    WOOCOMMERCE_CONSUMER_KEY: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
    WOOCOMMERCE_CONSUMER_SECRET: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
    SYNC_CRON_SCHEDULE: process.env.SYNC_CRON_SCHEDULE || ENV_DEFAULTS.SYNC_CRON_SCHEDULE,
    ORDER_RETENTION_DAYS: process.env.ORDER_RETENTION_DAYS || ENV_DEFAULTS.ORDER_RETENTION_DAYS,
    ORDER_FETCH_DAYS: process.env.ORDER_FETCH_DAYS || ENV_DEFAULTS.ORDER_FETCH_DAYS,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || ENV_DEFAULTS.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS:
      process.env.RATE_LIMIT_MAX_REQUESTS || ENV_DEFAULTS.RATE_LIMIT_MAX_REQUESTS,
  };

  if (!['development', 'production', 'test'].includes(rawEnvironment.NODE_ENV)) {
    log('warn', `Invalid NODE_ENV: ${rawEnvironment.NODE_ENV}. Falling back to 'development'.`);
    rawEnvironment.NODE_ENV = 'development';
  }

  return {
    ...rawEnvironment,
    NODE_ENV: rawEnvironment.NODE_ENV as 'development' | 'production' | 'test',
  };
};

const validateRequiredEnvironmentVariables = (config: EnvironmentConfiguration): void => {
  const missingVariables = REQUIRED_ENV_VARIABLES.filter(
    (variable) => !config[variable] || config[variable].trim() === ''
  );

  if (missingVariables.length > 0) {
    log('error', 'Missing required environment variables:', {
      missing: missingVariables,
      message: 'Please ensure all required environment variables are set in your .env file',
    });

    log('info', 'Required environment variables:', REQUIRED_ENV_VARIABLES);
    log('info', 'Current environment:', config.NODE_ENV);

    process.exit(1);
  }
};

const validateWooCommerceConfiguration = (config: EnvironmentConfiguration): void => {
  const { WOOCOMMERCE_API_BASE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET } =
    config;

  try {
    new URL(WOOCOMMERCE_API_BASE_URL);
  } catch {
    log('error', 'Invalid WOOCOMMERCE_API_BASE_URL format. Please provide a valid URL.');
    process.exit(1);
  }

  if (WOOCOMMERCE_CONSUMER_KEY.length < 10) {
    log(
      'error',
      'WOOCOMMERCE_CONSUMER_KEY appears to be too short. Please verify your credentials.'
    );
    process.exit(1);
  }

  if (WOOCOMMERCE_CONSUMER_SECRET.length < 10) {
    log(
      'error',
      'WOOCOMMERCE_CONSUMER_SECRET appears to be too short. Please verify your credentials.'
    );
    process.exit(1);
  }

  log('info', 'WooCommerce API configuration validated successfully');
};

const logEnvironmentConfiguration = (config: EnvironmentConfiguration): void => {
  if (config.NODE_ENV !== 'production') {
    log('info', 'Environment configuration loaded:', {
      NODE_ENV: config.NODE_ENV,
      PORT: config.PORT,
      DB_USER_NAME: config.DB_USER_NAME,
      DB_NAME: config.DB_NAME,
      FRONTEND_URL: config.FRONTEND_URL || 'Not configured',
      WOOCOMMERCE_API_BASE_URL: config.WOOCOMMERCE_API_BASE_URL,
      WOOCOMMERCE_CONSUMER_KEY: config.WOOCOMMERCE_CONSUMER_KEY.substring(0, 8) + '...',
      WOOCOMMERCE_CONSUMER_SECRET: '[REDACTED]',
      SYNC_CRON_SCHEDULE: config.SYNC_CRON_SCHEDULE,
      ORDER_RETENTION_DAYS: config.ORDER_RETENTION_DAYS,
      ORDER_FETCH_DAYS: config.ORDER_FETCH_DAYS,
      RATE_LIMIT_WINDOW_MS: config.RATE_LIMIT_WINDOW_MS,
      RATE_LIMIT_MAX_REQUESTS: config.RATE_LIMIT_MAX_REQUESTS,
    });
  }
};

const environmentConfiguration = createEnvironmentConfiguration();
validateRequiredEnvironmentVariables(environmentConfiguration);
validateWooCommerceConfiguration(environmentConfiguration);
logEnvironmentConfiguration(environmentConfiguration);

export const env = Object.freeze(environmentConfiguration);

export const EnvUtils = {
  isDevelopment: () => env.NODE_ENV === 'development',
  isProduction: () => env.NODE_ENV === 'production',
  isTest: () => env.NODE_ENV === 'test',

  getWooCommerceConfig: () => ({
    baseUrl: env.WOOCOMMERCE_API_BASE_URL,
    consumerKey: env.WOOCOMMERCE_CONSUMER_KEY,
    consumerSecret: env.WOOCOMMERCE_CONSUMER_SECRET,
  }),

  getServerConfig: () => ({
    port: parseInt(env.PORT, 10),
    frontendUrl: env.FRONTEND_URL,
    dbUserName: env.DB_USER_NAME,
    dbPassword: env.DB_PASSWORD,
    dbName: env.DB_NAME,
    syncCronSchedule: env.SYNC_CRON_SCHEDULE,
    orderRetentionDays: parseInt(env.ORDER_RETENTION_DAYS, 10),
    orderFetchDays: parseInt(env.ORDER_FETCH_DAYS, 10),
    rateLimitWindowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    rateLimitMaxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  }),
} as const;

export type { EnvironmentConfiguration };
