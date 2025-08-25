import dotenv from 'dotenv';
import type { AppConfig, DatabaseConfig, EmailConfig, S3Config } from '../shared/types/common.js';

dotenv.config();

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
];

// Validate required environment variables
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
}

const database: DatabaseConfig = {
  host: process.env['DB_HOST']!,
  port: parseInt(process.env['DB_PORT']!, 10),
  username: process.env['DB_USERNAME']!,
  password: process.env['DB_PASSWORD']!,
  database: process.env['DB_NAME']!,
  dialect: 'postgres',
  // SSL configuration - can be controlled via DB_SSL_ENABLED env var or defaults to production only
  ...((process.env['DB_SSL_ENABLED'] === 'true' || process.env['NODE_ENV'] === 'production') && {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  })
};

const app: AppConfig = {
  port: parseInt(process.env['PORT']!, 10),
  nodeEnv: process.env['NODE_ENV']!,
  apiPrefix: process.env['API_PREFIX'] || '/api/v1',
  corsOrigin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'],
  jwtSecret: process.env['JWT_SECRET']!,
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '7d',
  bcryptSaltRounds: parseInt(process.env['BCRYPT_SALT_ROUNDS']!, 10) || 12,
  rateLimitMaxRequests:
    parseInt(process.env['RATE_LIMIT_MAX_REQUESTS']!, 10) || 100,
  rateLimitWindowMs:
    parseInt(process.env['RATE_LIMIT_WINDOW_MS']!, 10) || 900000,
  logLevel: process.env['LOG_LEVEL'] || 'info',
  logFormat: process.env['LOG_FORMAT'] || 'combined',
  frontendUrl: process.env['FRONTEND_URL'] || 'http://localhost:3000',
};

const s3: S3Config = {
  accessKeyId: process.env['AWS_ACCESS_KEY_ID'] || '',
  secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] || '',
  region: process.env['AWS_REGION'] || 'us-east-1',
  bucketName: process.env['AWS_S3_BUCKET_NAME'] || '',
  bucketPath: process.env['AWS_S3_BUCKET_PATH'] || 'uploads',
};

const email: EmailConfig = {
  host: process.env['EMAIL_HOST'] || 'smtp.gmail.com',
  port: parseInt(process.env['EMAIL_PORT'] || '587', 10),
  secure: process.env['EMAIL_SECURE'] === 'true',
  user: process.env['EMAIL_USER'] || '',
  password: process.env['EMAIL_PASSWORD'] || '',
  senderName: process.env['EMAIL_SENDER_NAME'] || 'Your Platform Name',
};

export const config = {
  database,
  app,
  s3,
  email,
};

export default config; 