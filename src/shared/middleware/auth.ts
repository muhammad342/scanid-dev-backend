import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Response, NextFunction } from 'express';
import type { RequestWithUser, AuthenticatedUser } from '../types/common.js';
import { config } from '../../config/index.js';
import { sendUnauthorized, sendForbidden } from '../utils/response.js';
import { User } from '../../models/index.js';

export const authenticateToken = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    sendUnauthorized(res, 'Access token required');
    return;
  }

  try {
    const decoded = jwt.verify(token, config.app.jwtSecret) as any;
    
    // Fetch the full User model instance
    const user = await User.findByPk(decoded.id);
    const userData = user?.get({ plain: true });
    
    if (!user || !userData?.isActive) {
      sendUnauthorized(res, 'User not found or inactive');
      return;
    }

    // Attach the full User model instance (which has all the methods) to req.user
    req.user = user as any;
    
    // Add emulation properties if they exist in the token
    if (decoded.isEmulating) {
      (req.user as any).isEmulating = decoded.isEmulating;
      (req.user as any).originalUser = decoded.originalUser;
    }
    
    next();
  } catch (error) {
    sendUnauthorized(res, 'Invalid or expired token');
  }
};

export const authorize = (...roles: string[]) => {
  return async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    try {
      const context = await req.user.getCurrentContext();
      
      if (!context.roleName) {
        sendForbidden(res, 'No active role selected');
        return;
      }

      if (!roles.includes(context.roleName)) {
        sendForbidden(res, 'Insufficient permissions');
        return;
      }

      next();
    } catch (error) {
      sendForbidden(res, 'Error checking permissions');
      return;
    }
  };
};

export const generateToken = (payload: AuthenticatedUser): string => {
  return jwt.sign(payload, config.app.jwtSecret, {
    expiresIn: config.app.jwtExpiresIn,
  } as SignOptions);
}; 