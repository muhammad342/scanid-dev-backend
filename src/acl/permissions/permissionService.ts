import { Op } from 'sequelize';
import { Permission, AccessScope, PermissionContext, PermissionResult, UserRole } from '../types/index.js';
import { getRoleDefinition, roleHasPermission } from './roleDefinitions.js';
import { User } from '../../models/User/index.js';
import { Company } from '../../models/Company/index.js';
import { DelegateAccess } from '../../models/DelegateAccess/index.js';

export class PermissionService {
  /**
   * Check if user has permission in given context
   */
  async checkPermission(
    permission: Permission,
    context: PermissionContext
  ): Promise<PermissionResult> {
    const { userRole } = context;

    // Check if role has the basic permission
    if (!roleHasPermission(userRole as UserRole, permission)) {
      return {
        granted: false,
        reason: `Role ${userRole} does not have permission ${permission}`
      };
    }

    // Get role definition for scope checking
    const roleDefinition = getRoleDefinition(userRole as UserRole);

    // Apply scope-based access control
    return await this.checkScopeAccess(roleDefinition.scope, permission, context);
  }

  /**
   * Check scope-based access control
   */
  private async checkScopeAccess(
    scope: AccessScope,
    _permission: Permission,
    context: PermissionContext
  ): Promise<PermissionResult> {
    switch (scope) {
      case AccessScope.GLOBAL:
        return { granted: true };

      case AccessScope.EDITION:
        return await this.checkEditionScope(_permission, context);

      case AccessScope.COMPANY:
        return await this.checkCompanyScope(_permission, context);

      case AccessScope.SELF:
        return this.checkSelfScope(_permission, context);

      default:
        return { granted: false, reason: 'Unknown access scope' };
    }
  }

  /**
   * Check edition-level access
   */
  private async checkEditionScope(
    _permission: Permission,
    context: PermissionContext
  ): Promise<PermissionResult> {
    const { userId, targetSystemEditionId, targetCompanyId, targetUserId } = context;

    // Get user's assigned edition
    const user = await User.findByPk(userId);
    if (!user?.systemEditionId) {
      return { granted: false, reason: 'User not assigned to any edition' };
    }

    // Check if user can access target edition
    if (targetSystemEditionId && targetSystemEditionId !== user.systemEditionId) {
      return { granted: false, reason: 'Cannot access resources outside assigned edition' };
    }

    // Check if target company belongs to user's edition
    if (targetCompanyId) {
      const company = await Company.findByPk(targetCompanyId);
      if (company?.systemEditionId !== user.systemEditionId) {
        return { granted: false, reason: 'Target company not in assigned edition' };
      }
    }

    // Check if target user belongs to user's edition
    if (targetUserId) {
      const targetUser = await User.findByPk(targetUserId);
      if (targetUser?.systemEditionId !== user.systemEditionId) {
        return { granted: false, reason: 'Target user not in assigned edition' };
      }
    }

    return { granted: true };
  }

  /**
   * Check company-level access
   */
  private async checkCompanyScope(
    _permission: Permission,
    context: PermissionContext
  ): Promise<PermissionResult> {
    const { userId, targetCompanyId, targetUserId } = context;

    // Get user's assigned company
    const user = await User.findByPk(userId);
    if (!user?.companyId) {
      return { granted: false, reason: 'User not assigned to any company' };
    }

    // Check if user can access target company
    if (targetCompanyId && targetCompanyId !== user.companyId) {
      return { granted: false, reason: 'Cannot access resources outside assigned company' };
    }

    // Check if target user belongs to user's company
    if (targetUserId) {
      const targetUser = await User.findByPk(targetUserId);
      if (targetUser?.companyId !== user.companyId) {
        return { granted: false, reason: 'Target user not in assigned company' };
      }
    }

    return { granted: true };
  }

  /**
   * Check self-only access
   */
  private checkSelfScope(
    _permission: Permission,
    context: PermissionContext
  ): PermissionResult {
    const { userId, targetUserId } = context;

    // For self scope, user can only access their own resources
    if (targetUserId && targetUserId !== userId) {
      return { granted: false, reason: 'Can only access own resources' };
    }

    return { granted: true };
  }

  /**
   * Check delegate access permissions
   */
  async checkDelegateAccess(
    delegateUserId: string,
    targetUserId: string,
    permission: Permission
  ): Promise<PermissionResult> {
    // Find active delegate access record
    const delegateAccess = await DelegateAccess.findOne({
      where: {
        delegateId: delegateUserId,
        delegatorId: targetUserId,
        isActive: true
      }
    });

    if (!delegateAccess) {
      return { granted: false, reason: 'No active delegate access found' };
    }

    // Check if permission is in delegate permissions
    if (!delegateAccess.permissions.includes(permission)) {
      return { granted: false, reason: 'Permission not granted in delegate access' };
    }

    // Check expiration
    if (delegateAccess.expirationDate && delegateAccess.expirationDate < new Date()) {
      return { granted: false, reason: 'Delegate access has expired' };
    }

    return { granted: true };
  }

  /**
   * Get filtered query conditions based on user role and scope
   */
  async getResourceFilter(
    userRole: UserRole,
    userId: string,
    resourceType: 'user' | 'company' | 'edition' | 'tag' | 'delegate'
  ): Promise<any> {
    const roleDefinition = getRoleDefinition(userRole);
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    switch (roleDefinition.scope) {
      case AccessScope.GLOBAL:
        return {}; // No filter - access all

      case AccessScope.EDITION:
        return this.getEditionScopeFilter(user, resourceType);

      case AccessScope.COMPANY:
        return this.getCompanyScopeFilter(user, resourceType);

      case AccessScope.SELF:
        return this.getSelfScopeFilter(user, resourceType);

      default:
        throw new Error('Unknown access scope');
    }
  }

  private getEditionScopeFilter(user: User, resourceType: string): any {
    switch (resourceType) {
      case 'user':
        return { systemEditionId: user.systemEditionId };
      case 'company':
        return { systemEditionId: user.systemEditionId };
      case 'edition':
        return { id: user.systemEditionId };
      case 'tag':
        return { systemEditionId: user.systemEditionId };
      case 'delegate':
        return { systemEditionId: user.systemEditionId };
      default:
        return {};
    }
  }

  private getCompanyScopeFilter(user: User, resourceType: string): any {
    switch (resourceType) {
      case 'user':
        return { companyId: user.companyId };
      case 'company':
        return { id: user.companyId };
      case 'edition':
        return { id: user.systemEditionId };
      case 'tag':
        return { systemEditionId: user.systemEditionId };
      case 'delegate':
        return { 
          [Op.or]: [
            { delegatorId: user.id },
            { delegateId: user.id }
          ]
        };
      default:
        return {};
    }
  }

  private getSelfScopeFilter(user: User, resourceType: string): any {
    switch (resourceType) {
      case 'user':
        return { id: user.id };
      case 'company':
        return { id: user.companyId };
      case 'edition':
        return { id: user.systemEditionId };
      case 'tag':
        return { systemEditionId: user.systemEditionId };
      case 'delegate':
        return { 
          [Op.or]: [
            { delegatorId: user.id },
            { delegateId: user.id }
          ]
        };
      default:
        return {};
    }
  }
}

// Export singleton instance
export const permissionService = new PermissionService(); 