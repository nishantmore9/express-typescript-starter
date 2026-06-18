import morgan from 'morgan';
import { logger } from '../utils/logger.js';

const stream = {
  write : (message: string) => logger.http(message.trim()),
};

export const httpLogger = morgan(
  ':method:url :status :res[content-length] - :response-time ms',
  { stream }
);
