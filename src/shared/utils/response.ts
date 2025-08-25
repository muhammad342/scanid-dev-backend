import type { Response } from 'express';
import type { ApiResponse, PaginatedResponse, ErrorResponse } from '../types/common.js';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: string
): void => {
  const response: ErrorResponse = {
    success: false,
    message,
    error: error || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
};

export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message = 'Success',
  statusCode = 200
): void => {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const response: PaginatedResponse<T[]> = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPrevPage: pagination.page > 1,
    },
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = 'Resource created successfully'
): void => {
  sendSuccess(res, data, message, 201);
};

export const sendNoContent = (res: Response): void => {
  res.status(204).send();
};

export const sendNotFound = (
  res: Response,
  message = 'Resource not found'
): void => {
  sendError(res, message, 404, 'Not Found');
};

export const sendBadRequest = (
  res: Response,
  message = 'Bad request',
  error?: string
): void => {
  sendError(res, message, 400, error || 'Bad Request');
};

export const sendUnauthorized = (
  res: Response,
  message = 'Unauthorized'
): void => {
  sendError(res, message, 401, 'Unauthorized');
};

export const sendForbidden = (
  res: Response,
  message = 'Forbidden'
): void => {
  sendError(res, message, 403, 'Forbidden');
};

export const sendConflict = (
  res: Response,
  message = 'Conflict',
  error?: string
): void => {
  sendError(res, message, 409, error || 'Conflict');
};

export const sendValidationError = (
  res: Response,
  errors: any,
  message = 'Validation failed'
): void => {
  sendError(res, message, 422, JSON.stringify(errors));
}; 