import { Request, Response, NextFunction } from 'express';

import { ValidationResult } from 'joi';
import { querySchema } from '../validations/schema';

export const validateQuery = (req: Request, res: Response, next: NextFunction): any => {
  const { error, value }: ValidationResult = querySchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: error.details.map((detail) => detail.message),
    });
  }

  req.query = value;
  next();
};
