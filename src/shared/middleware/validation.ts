import { validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';
import { sendValidationError } from '../utils/response.js';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    sendValidationError(res, formattedErrors, 'Validation failed');
    return;
  }

  next();
}; 