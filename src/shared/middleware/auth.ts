import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Response, NextFunction } from 'express';
import type { RequestWithUser, AuthenticatedUser } from '../types/common.js';
import { config } from '../../config/index.js';
import { sendUnauthorized, sendForbidden } from '../utils/response.js';

export const authenticateToken = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    sendUnauthorized(res, 'Access token required');
    return;
  }

  try {
    const decoded = jwt.verify(token, config.app.jwtSecret) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (error) {
    sendUnauthorized(res, 'Invalid or expired token');
  }
};

export const authorize = (...roles: string[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendForbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
};

export const generateToken = (payload: AuthenticatedUser): string => {
  return jwt.sign(payload, config.app.jwtSecret, {
    expiresIn: config.app.jwtExpiresIn,
  } as SignOptions);
}; 