import { Response } from 'express';
import { asyncHandler } from '../../../shared/middleware/errorHandler.js';
import { sendSuccess, sendBadRequest, sendNotFound } from '../../../shared/utils/response.js';
import { RequestWithContext } from '../../../shared/middleware/contextResolver.js';

export class UserRoleController {
  // Get user's available roles
  static getAvailableRoles = asyncHandler(async (req: RequestWithContext, res: Response) => {
    if (!req.user) {
      return sendBadRequest(res, 'User not authenticated');
    }

    try {
      const availableRoles = await req.user.getAvailableRoles();
      sendSuccess(res, availableRoles, 'Available roles retrieved successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Get user's current active role
  static getCurrentActiveRole = asyncHandler(async (req: RequestWithContext, res: Response) => {
    if (!req.user) {
      return sendBadRequest(res, 'User not authenticated');
    }

    try {
      const activeRole = await req.user.getActiveRole();
      const context = await req.user.getCurrentContext();
      
      const response = {
        activeRole,
        context,
        hasActiveRole: await req.user.hasActiveRole(),
      };

      sendSuccess(res, response, 'Current active role retrieved successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Set user's active role
  static setActiveRole = asyncHandler(async (req: RequestWithContext, res: Response) => {
    if (!req.user) {
      return sendBadRequest(res, 'User not authenticated');
    }

    const { userRoleId } = req.body;

    if (!userRoleId) {
      return sendBadRequest(res, 'User role ID is required');
    }

    try {
      await req.user.setActiveRole(userRoleId);
      
      // Get the updated context
      const activeRole = await req.user.getActiveRole();
      const context = await req.user.getCurrentContext();
      
      const response = {
        activeRole,
        context,
        message: 'Active role set successfully',
      };

      sendSuccess(res, response, 'Active role set successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Clear user's active role
  static clearActiveRole = asyncHandler(async (req: RequestWithContext, res: Response) => {
    if (!req.user) {
      return sendBadRequest(res, 'User not authenticated');
    }

    try {
      await req.user.clearActiveRole();
      sendSuccess(res, null, 'Active role cleared successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Validate user's active role (useful for checking if role is still valid)
  static validateActiveRole = asyncHandler(async (req: RequestWithContext, res: Response) => {
    if (!req.user) {
      return sendBadRequest(res, 'User not authenticated');
    }

    try {
      const isValid = await req.user.validateActiveRole();
      const hasActiveRole = await req.user.hasActiveRole();
      
      const response = {
        isValid,
        hasActiveRole,
        message: isValid ? 'Active role is valid' : 'Active role is invalid or expired',
      };

      sendSuccess(res, response, 'Active role validation completed');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Switch role quickly (for users with multiple roles)
  static switchRole = asyncHandler(async (req: RequestWithContext, res: Response) => {
    if (!req.user) {
      return sendBadRequest(res, 'User not authenticated');
    }

    const { userRoleId } = req.body;

    if (!userRoleId) {
      return sendBadRequest(res, 'User role ID is required');
    }

    try {
      // First validate the role exists and belongs to user
      const availableRoles = await req.user.getAvailableRoles();
      const targetRole = availableRoles.find(role => role.id === userRoleId);
      
      if (!targetRole) {
        return sendNotFound(res, 'Role not found or not available for this user');
      }

      // Set the new active role
      await req.user.setActiveRole(userRoleId);
      
      // Get the updated context
      const activeRole = await req.user.getActiveRole();
      const context = await req.user.getCurrentContext();
      
      const response = {
        previousRole: req.resolvedContext?.roleName,
        newRole: context.roleName,
        activeRole,
        context,
      };

      sendSuccess(res, response, `Switched to ${context.roleName} role successfully`);
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });
}
