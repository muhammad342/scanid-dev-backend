import type { Request } from 'express';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  dialect: 'postgres';
  ssl?: {
    require: boolean;
    rejectUnauthorized: boolean;
  };
}

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  bucketPath: string;
}
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  senderName: string;
}
export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiPrefix: string;
  corsOrigin: string[];
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptSaltRounds: number;
  rateLimitMaxRequests: number;
  rateLimitWindowMs: number;
  logLevel: string;
  logFormat: string;
  frontendUrl: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Authenticated user data (from JWT payload)
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  systemEditionId?: string;
  companyId?: string;
  // Emulation fields
  originalUser?: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    // Support for nested emulation
    originalUser?: {
      id: string;
      email: string;
      role: string;
      firstName: string;
      lastName: string;
    };
    isEmulating?: boolean;
  };
  isEmulating?: boolean;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
  resourceFilter?: any;
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
  method?: string;
} 