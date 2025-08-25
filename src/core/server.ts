import app from './app.js';
import { config } from '../config/index.js';
import { connectDatabase, syncDatabase } from '../config/database.js';
import { logger } from '../shared/utils/logger.js';

// Import models to ensure associations are set up
import '../models/index.js';

// Start the server
const startServer = async (): Promise<void> => {
  try {
    // Initialize database connection
    await connectDatabase();
    logger.info('Database connected successfully');
    
    // Sync database models (create tables)
    await syncDatabase();
    logger.info('Database tables synchronized successfully');
    
    const server = app.listen(config.app.port, () => {
      logger.info(`Server running on port ${config.app.port}`);
      logger.info(`Environment: ${config.app.nodeEnv}`);
      logger.info(`API Base URL: http://localhost:${config.app.port}${config.app.apiPrefix}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

export default app; 