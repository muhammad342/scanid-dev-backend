import express from 'express';
import compression from 'compression';
import { config } from '../config/index.js';
import { requestLogger } from '../shared/middleware/logging.js';
import { helmetConfig, corsConfig, rateLimiter } from '../shared/middleware/security.js';
import { errorHandler, notFoundHandler } from '../shared/middleware/errorHandler.js';
import routes from '../api/v1/routes.js';

const app = express();

// Security middleware
app.use(helmetConfig);
app.use(corsConfig);
app.use(rateLimiter);

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(requestLogger);

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// API routes
app.use(config.app.apiPrefix, routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app; 