import type { RequestWithContext } from '../../../shared/middleware/contextResolver.js';

/**
 * Policy to check if user can create tags
 * Only super admin and edition admin can create tags
 */
export const canCreateTag = (req: RequestWithContext): boolean => {
  const { roleName } = req.resolvedContext || {};
  return roleName === 'super_admin' || roleName === 'edition_admin';
};

/**
 * Policy to check if user can read tags
 * All authenticated users can read tags within their context
 */
export const canReadTag = (req: RequestWithContext): boolean => {
  return !!req.resolvedContext?.systemEditionId;
};

/**
 * Policy to check if user can update tags
 * Only super admin and edition admin can update tags
 */
export const canUpdateTag = (req: RequestWithContext): boolean => {
  const { roleName } = req.resolvedContext || {};
  return roleName === 'super_admin' || roleName === 'edition_admin';
};

/**
 * Policy to check if user can delete tags
 * Only super admin and edition admin can delete tags
 */
export const canDeleteTag = (req: RequestWithContext): boolean => {
  const { roleName } = req.resolvedContext || {};
  return roleName === 'super_admin' || roleName === 'edition_admin';
};

/**
 * Policy to check if user can manage tag order
 * Only super admin and edition admin can manage tag order
 */
export const canManageTagOrder = (req: RequestWithContext): boolean => {
  const { roleName } = req.resolvedContext || {};
  return roleName === 'super_admin' || roleName === 'edition_admin';
};

/**
 * Policy to check if user can merge tags
 * Only super admin and edition admin can merge tags
 */
export const canMergeTags = (req: RequestWithContext): boolean => {
  const { roleName } = req.resolvedContext || {};
  return roleName === 'super_admin' || roleName === 'edition_admin';
};

/**
 * Policy to check if user can access tag statistics
 * All authenticated users can access tag statistics within their context
 */
export const canAccessTagStats = (req: RequestWithContext): boolean => {
  return !!req.resolvedContext?.systemEditionId;
}; 