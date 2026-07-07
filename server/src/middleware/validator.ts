import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Provided request parameters failed validation',
        details: errors.array().map((err: any) => ({
          field: err.path || err.param,
          issue: err.msg
        }))
      }
    });
  }
  next();
};
