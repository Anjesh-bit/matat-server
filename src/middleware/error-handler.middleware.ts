import { Request, Response } from 'express';
import { log } from '../utils/logger.utils';

interface CustomError extends Error {
  statusCode?: number;
  details?: { message: string }[];
  code?: number;
  name: string;
}

export const errorHandler = (err: CustomError, req: Request, res: Response): void => {
  log('error', 'Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.details?.map((detail) => detail.message) || [err.message],
    });
    return;
  }

  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'Duplicate entry found',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Database error occurred',
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
