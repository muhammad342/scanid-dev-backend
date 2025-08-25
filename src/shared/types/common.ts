import type { Request } from 'express';
import { UserAttributes } from '../../models/User/index';

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
  firstName: string;
  lastName: string;
  activeUserRoleId?: string;
  // Emulation fields
  originalUser?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    activeUserRoleId?: string;
    // Support for nested emulation
    originalUser?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      activeUserRoleId?: string;
    };
    isEmulating?: boolean;
  };
  isEmulating?: boolean;
  // Active role management methods
  getCurrentContext(): Promise<{
    roleId?: string;
    roleName?: string;
    systemEditionId?: string;
    companyId?: string;
    channelId?: string;
  }>;
  getActiveRole(): Promise<any | null>;
  setActiveRole(userRoleId: string): Promise<boolean>;
  clearActiveRole(): Promise<void>;
  getAvailableRoles(): Promise<any[]>;
  hasActiveRole(): Promise<boolean>;
  validateActiveRole(): Promise<boolean>;
  hasRole(roleName: string, options?: {
    systemEditionId?: string;
    companyId?: string;
    channelId?: string;
  }): Promise<boolean>;
  isSuperAdmin(): Promise<boolean>;
  isEditionAdmin(systemEditionId?: string): Promise<boolean>;
  isCompanyAdmin(companyId?: string): Promise<boolean>;
  isChannelAdmin(channelId?: string): Promise<boolean>;
  getPlainData(): UserAttributes;
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