import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger.js';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    let data: any;
    
    if (req.method === 'GET') {
      data = { ...req.query };
    } else {
      data = { ...req.body };
    }
    
    const { error, value } = schema.validate(data, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      logger.warn('Validation error:', errors);
      
      res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
      return;
    }
    
    req.validatedData = value;
    next();
  };
};

declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
    }
  }
}