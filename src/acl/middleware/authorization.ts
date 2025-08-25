import type { Response, NextFunction } from 'express';
import type { RequestWithUser } from '../../shared/types/common.js';
import { Permission, PermissionContext } from '../types/index.js';
import { permissionService } from '../permissions/permissionService.js';
import { sendForbidden, sendUnauthorized } from '../../shared/utils/response.js';

/**
 * Enhanced authorization middleware with context-aware permissions
 */
export const requirePermission = (permission: Permission) => {
  return async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    // Build permission context from request
    const context: PermissionContext = {
      userId: req.user.id,
      userRole: req.user.role,
      companyId: req.user.companyId,
      systemEditionId: req.user.systemEditionId,
      targetUserId: req.params['userId'] || req.params['id'],
      targetCompanyId: req.params['companyId'],
      targetSystemEditionId: req.params['systemEditionId'] || req.params['id']
    };

    // Check permission
    const result = await permissionService.checkPermission(permission, context);

    if (!result.granted) {
      sendForbidden(res, result.reason || 'Insufficient permissions');
      return;
    }

    next();
  };
};

/**
 * Middleware to require multiple permissions (AND logic)
 */
export const requireAllPermissions = (...permissions: Permission[]) => {
  return async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    const context: PermissionContext = {
      userId: req.user.id,
      userRole: req.user.role,
      companyId: req.user.companyId,
      systemEditionId: req.user.systemEditionId,
      targetUserId: req.params['userId'] || req.params['id'],
      targetCompanyId: req.params['companyId'],
      targetSystemEditionId: req.params['systemEditionId'] || req.params['id']
    };

    // Check all permissions
    for (const permission of permissions) {
      const result = await permissionService.checkPermission(permission, context);
      if (!result.granted) {
        sendForbidden(res, result.reason || `Missing permission: ${permission}`);
        return;
      }
    }

    next();
  };
};

/**
 * Middleware to require any of the specified permissions (OR logic)
 */
export const requireAnyPermission = (...permissions: Permission[]) => {
  return async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    const context: PermissionContext = {
      userId: req.user.id,
      userRole: req.user.role,
      companyId: req.user.companyId,
      systemEditionId: req.user.systemEditionId,
      targetUserId: req.params['userId'] || req.params['id'],
      targetCompanyId: req.params['companyId'],
      targetSystemEditionId: req.params['systemEditionId'] || req.params['id']
    };

    // Check if user has any of the permissions
    const results = await Promise.all(
      permissions.map(permission => permissionService.checkPermission(permission, context))
    );

    const hasPermission = results.some(result => result.granted);
    
    if (!hasPermission) {
      const reasons = results.map(r => r.reason).filter(Boolean).join(', ');
      sendForbidden(res, reasons || 'Insufficient permissions');
      return;
    }

    next();
  };
};

/**
 * Resource ownership middleware - checks if user owns/can access the resource
 */
export const requireResourceAccess = (resourceType: 'user' | 'company' | 'edition') => {
  return async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    const resourceId = req.params['id'];
    if (!resourceId) {
      sendForbidden(res, 'Resource ID required');
      return;
    }

    // Get resource filters based on user role and scope
    try {
      const filter = await permissionService.getResourceFilter(
        req.user.role as any,
        req.user.id,
        resourceType
      );

      // Add resource ID to filter
      const finalFilter = { ...filter, id: resourceId };

      // Add filter to request for use in controllers
      req.resourceFilter = finalFilter;
      next();
    } catch (error) {
      sendForbidden(res, 'Cannot access resource');
    }
  };
};

/**
 * Delegate authorization middleware
 */
export const requireDelegateAccess = (permission: Permission) => {
  return async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    if (req.user.role !== 'delegate') {
      sendForbidden(res, 'Delegate access required');
      return;
    }

    const targetUserId = req.params['userId'] || req.params['targetUserId'];
    if (!targetUserId) {
      sendForbidden(res, 'Target user ID required for delegate access');
      return;
    }

    // Check delegate access
    const result = await permissionService.checkDelegateAccess(
      req.user.id,
      targetUserId,
      permission
    );

    if (!result.granted) {
      sendForbidden(res, result.reason || 'Delegate access denied');
      return;
    }

    next();
  };
};

// Legacy authorization middleware for backward compatibility
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