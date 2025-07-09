import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { LogLevel } from "../types/logger.types.js";
import { levels } from "../constant/logger.constant.js";

const isProduction = process.env.NODE_ENV === "production";

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
    return `[${timestamp}] ${level}: ${message} ${metaString}`;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  levels: winston.config.npm.levels,
  format: isProduction ? jsonFormat : consoleFormat,
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        : consoleFormat,
    }),

    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "14d",
      zippedArchive: true,
    }),

    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      zippedArchive: true,
    }),
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: "logs/exceptions-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      zippedArchive: true,
    }),
    new winston.transports.Console(),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: "logs/rejections-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      zippedArchive: true,
    }),
    new winston.transports.Console(),
  ],
  exitOnError: false,
});

export const log = (level: LogLevel, message: string, meta?: unknown) => {
  if (!levels.includes(level)) {
    throw new Error(`Invalid log level: ${level}`);
  }

  if (meta) {
    logger.log(level, message, meta);
  } else {
    logger.log(level, message);
  }
};
