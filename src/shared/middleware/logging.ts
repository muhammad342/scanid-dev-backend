import morgan from 'morgan';
import { config } from '../../config/index.js';
import { logger } from '../utils/logger.js';

// Custom morgan format
const morganFormat = config.app.nodeEnv === 'production' 
  ? 'combined' 
  : 'dev';

export const requestLogger = morgan(morganFormat, {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    },
  },
  skip: (req, _res) => {
    // Skip logging for health check endpoints
    return req.url === '/health' || req.url === '/api/health';
  },
}); 