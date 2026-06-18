import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) : void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if(err instanceof AppError) {
    statusCode : err.statusCode;
    message : err.message;
  } else {
    logger.error(`[Unhandled Exception] ${err.message}`, { stack : err.stack});
  } 

  res.status(statusCode).json({
    status: 'error',
    message,
    // Only leak the stack trace to the client if we are in development mode!
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}