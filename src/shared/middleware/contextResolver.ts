import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../types/common.js';
import { Company } from '../../models/Company/index.js';

export interface ResolvedContext {
  companyId?: string;
  systemEditionId?: string;
  channelId?: string;
  roleName?: string;
  activeUserRoleId?: string;
  userId: string;
  isEmulating: boolean;
}

export interface RequestWithContext extends RequestWithUser {
  resolvedContext?: ResolvedContext;
}

/**
 * Middleware to resolve and validate access context based on user's active role
 * This centralizes the logic for determining which company/edition/channel a user can access
 */
export const resolveContext = async (
  req: RequestWithContext,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate the user's active role
    const hasValidActiveRole = await req.user.validateActiveRole();
    
    if (!hasValidActiveRole && await req.user.hasActiveRole()) {
      // Active role was invalid and was cleared
      res.status(400).json({
        success: false,
        message: 'Active role is invalid or expired. Please select a new role.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Get the current context from the user's active role
    const userContext = await req.user.getCurrentContext();
    
    const context: ResolvedContext = {
      userId: req.user.id,
      isEmulating: req.user.isEmulating || false,
    };

    // Only add properties if they exist (to avoid undefined issues)
    if (userContext.roleName) context.roleName = userContext.roleName;
    if (req.user.activeUserRoleId) context.activeUserRoleId = req.user.activeUserRoleId;
    if (userContext.systemEditionId) context.systemEditionId = userContext.systemEditionId;
    if (userContext.companyId) context.companyId = userContext.companyId;
    if (userContext.channelId) context.channelId = userContext.channelId;

    // Handle context override for super admins
    if (userContext.roleName === 'super_admin') {
      // Super admin can access any context, so use params if provided
      const requestedEditionId = req.params['systemEditionId'] || req.query['systemEditionId'] || req.body['systemEditionId'];
      const requestedCompanyId = req.params['companyId'] || req.params['id'] || req.query['companyId'] || req.body['companyId'];
      const requestedChannelId = req.params['channelId'] || req.query['channelId'] || req.body['channelId'];
      
      if (requestedEditionId && typeof requestedEditionId === 'string') {
        context.systemEditionId = requestedEditionId;
      }
      if (requestedCompanyId && typeof requestedCompanyId === 'string') {
        context.companyId = requestedCompanyId;
      }
      if (requestedChannelId && typeof requestedChannelId === 'string') {
        context.channelId = requestedChannelId;
      }
    } else if (userContext.roleName === 'edition_admin') {
      // Edition admin can access companies in their edition
      const requestedCompanyId = req.params['companyId'] || req.params['id'] || req.query['companyId'] || req.body['companyId'];
      if (requestedCompanyId && typeof requestedCompanyId === 'string') {
        // Verify the company belongs to the admin's edition
        const companyQuery = await Company.findByPk(requestedCompanyId);
        const company = companyQuery?.get({ plain: true });
        if (company && company.systemEditionId === context.systemEditionId) {
          context.companyId = requestedCompanyId;
        } else {
          res.status(403).json({
            success: false,
            message: 'Company does not belong to your system edition',
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }
    }

    // Validation: Ensure user has an active role for non-public endpoints
    if (!userContext.roleName) {
      res.status(400).json({
        success: false,
        message: 'No active role selected. Please select a role to continue.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.log("context", context);

    // Attach the resolved context to the request
    req.resolvedContext = context;
    next();
  } catch (error) {
    console.error('Error in context resolution:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving access context',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Helper to validate if a user has access to a specific company
 */
export const validateCompanyAccess = async (
  context: ResolvedContext,
  companyId: string
): Promise<boolean> => {
  if (!companyId) return false;

  switch (context.roleName) {
    case 'super_admin':
      return true;

    case 'edition_admin':
      if (!context.systemEditionId) return false;
      const company = await Company.findByPk(companyId);
      return company?.systemEditionId === context.systemEditionId;

    case 'company_admin':
    case 'user':
    case 'delegate':
      return context.companyId === companyId;

    case 'channel_admin':
      // Channel admin can access companies if they're within their channel's scope
      if (!context.companyId) return false;
      return context.companyId === companyId;

    default:
      return false;
  }
};

/**
 * Helper to validate if a user has access to a specific system edition
 */
export const validateSystemEditionAccess = (
  context: ResolvedContext,
  systemEditionId: string
): boolean => {
  if (!systemEditionId) return false;

  switch (context.roleName) {
    case 'super_admin':
      return true;

    case 'edition_admin':
    case 'company_admin':
    case 'user':
    case 'delegate':
    case 'channel_admin':
      return context.systemEditionId === systemEditionId;

    default:
      return false;
  }
};

/**
 * Helper to validate if a user has access to a specific channel
 */
export const validateChannelAccess = (
  context: ResolvedContext,
  channelId: string
): boolean => {
  if (!channelId) return false;

  switch (context.roleName) {
    case 'super_admin':
      return true;

    case 'channel_admin':
      return context.channelId === channelId;

    case 'edition_admin':
      // Edition admins can access channels in their edition
      // This would need additional validation against the channel's edition
      return true; // For now, allow edition admins to access channels

    default:
      return false;
  }
}; 