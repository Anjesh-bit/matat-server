import dotenv from 'dotenv';
dotenv.config();

import { pathToFileURL } from 'url';
import path from 'path';

import app from './app.js';
import database from './config/database.js';
import syncServices from './services/sync.services.js';
import { logger } from './utils/logger.utils.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await database.connect();

    syncServices.startScheduledSync();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    const gracefulShutdown = async (signal: NodeJS.Signals) => {
      logger.info(`${signal} received, shutting down gracefully`);
      server.close(async () => {
        await database.disconnect();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const currentFileUrl = import.meta.url;
const entryFilePath = process.argv[1];
const entryFileUrl = pathToFileURL(path.resolve(entryFilePath)).href;

if (currentFileUrl === entryFileUrl) startServer();

export default app;
