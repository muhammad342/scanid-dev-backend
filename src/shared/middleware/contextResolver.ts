import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../types/common.js';
import { Company } from '../../models/Company/index.js';

export interface ResolvedContext {
  companyId?: string;
  systemEditionId?: string;
  role: string;
  userId: string;
  isEmulating: boolean;
}

export interface RequestWithContext extends RequestWithUser {
  resolvedContext?: ResolvedContext;
}

/**
 * Middleware to resolve and validate access context based on user role
 * This centralizes the logic for determining which company/edition a user can access
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

    const context: ResolvedContext = {
      role: req.user.role,
      userId: req.user.id,
      isEmulating: req.user.isEmulating || false,
    };

    // Handle system edition ID resolution
    switch (req.user.role) {
      case 'super_admin': {
        // Super admin can access any edition, so we use the one from params if provided
        const editionId = req.params['systemEditionId'] || req.query['systemEditionId'] || req.body['systemEditionId'];
        if (editionId && typeof editionId === 'string') {
          context.systemEditionId = editionId;
        }
        break;
      }

      case 'edition_admin':
        // Edition admin is restricted to their assigned edition
        if (!req.user.systemEditionId) {
          res.status(400).json({
            success: false,
            message: 'Edition admin must be associated with a system edition',
            timestamp: new Date().toISOString(),
          });
          return;
        }
        context.systemEditionId = req.user.systemEditionId;
        break;

      default:
        // Other roles inherit system edition from their company
        if (req.user.systemEditionId) {
          context.systemEditionId = req.user.systemEditionId;
        }
        break;
    }

    // Handle company ID resolution
    switch (req.user.role) {
      case 'super_admin': {
        // Super admin can access any company, so we use the one from params if provided
        const companyId = req.params['companyId'] || req.params['id'] || req.query['companyId'] || req.body['companyId'];
        if (companyId && typeof companyId === 'string') {
          context.companyId = companyId;
        }
        break;
      }

      case 'edition_admin': {
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
        break;
      }

      case 'company_admin':
      case 'user':
        // Company users are restricted to their assigned company
        if (!req.user.companyId) {
          res.status(400).json({
            success: false,
            message: 'User must be associated with a company',
            timestamp: new Date().toISOString(),
          });
          return;
        }
        context.companyId = req.user.companyId;
        break;
    }

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

  switch (context.role) {
    case 'super_admin':
      return true;

    case 'edition_admin':
      if (!context.systemEditionId) return false;
      const company = await Company.findByPk(companyId);
      return company?.systemEditionId === context.systemEditionId;

    case 'company_admin':
    case 'user':
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

  switch (context.role) {
    case 'super_admin':
      return true;

    case 'edition_admin':
    case 'company_admin':
    case 'user':
      return context.systemEditionId === systemEditionId;

    default:
      return false;
  }
}; 