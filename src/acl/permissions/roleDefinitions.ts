import { Permission, AccessScope, RoleDefinition, UserRole } from '../types/index.js';

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  super_admin: {
    name: 'Super Admin',
    permissions: [
      // Full system access
      Permission.CREATE_USER,
      Permission.READ_USER,
      Permission.UPDATE_USER,
      Permission.DELETE_USER,
      Permission.CREATE_COMPANY,
      Permission.READ_COMPANY,
      Permission.UPDATE_COMPANY,
      Permission.DELETE_COMPANY,
      Permission.CREATE_EDITION,
      Permission.READ_EDITION,
      Permission.UPDATE_EDITION,
      Permission.DELETE_EDITION,
      Permission.CREATE_TAG,
      Permission.READ_TAG,
      Permission.UPDATE_TAG,
      Permission.DELETE_TAG,
      Permission.CREATE_CUSTOM_FIELD,
      Permission.READ_CUSTOM_FIELD,
      Permission.UPDATE_CUSTOM_FIELD,
      Permission.DELETE_CUSTOM_FIELD,
      Permission.CREATE_DELEGATE,
      Permission.READ_DELEGATE,
      Permission.UPDATE_DELEGATE,
      Permission.DELETE_DELEGATE,
      Permission.READ_SEAT_MANAGEMENT,
      Permission.UPDATE_SEAT_MANAGEMENT,
      Permission.READ_COBRANDING,
      Permission.UPDATE_COBRANDING,
      Permission.READ_AUDIT_LOGS,
      Permission.READ_SYSTEM_SETTINGS,
      Permission.UPDATE_SYSTEM_SETTINGS,
    ],
    scope: AccessScope.GLOBAL,
    description: 'Full system access with all permissions'
  },

  edition_admin: {
    name: 'Edition Admin',
    permissions: [
      // Limited to assigned editions
      Permission.READ_USER,
      Permission.UPDATE_USER, // Within edition
      Permission.CREATE_COMPANY,
      Permission.READ_COMPANY,
      Permission.UPDATE_COMPANY,
      Permission.DELETE_COMPANY, // Within edition
      Permission.READ_EDITION,
      Permission.UPDATE_EDITION, // Own edition only
      Permission.CREATE_TAG,
      Permission.READ_TAG,
      Permission.UPDATE_TAG,
      Permission.DELETE_TAG,
      Permission.CREATE_CUSTOM_FIELD,
      Permission.READ_CUSTOM_FIELD,
      Permission.UPDATE_CUSTOM_FIELD,
      Permission.DELETE_CUSTOM_FIELD,
      Permission.CREATE_DELEGATE,
      Permission.READ_DELEGATE,
      Permission.UPDATE_DELEGATE,
      Permission.DELETE_DELEGATE,
      Permission.READ_SEAT_MANAGEMENT,
      Permission.UPDATE_SEAT_MANAGEMENT,
      Permission.READ_COBRANDING,
      Permission.UPDATE_COBRANDING,
      Permission.READ_AUDIT_LOGS,
    ],
    scope: AccessScope.EDITION,
    description: 'Limited access to assigned editions and their resources'
  },

  company_admin: {
    name: 'Company Admin',
    permissions: [
      // Limited to assigned company
      Permission.READ_USER, // Company users only
      Permission.UPDATE_USER, // Company users only
      Permission.READ_COMPANY, // Own company only
      Permission.UPDATE_COMPANY, // Own company only
      Permission.READ_EDITION, // Own edition only
      Permission.READ_TAG,
      Permission.CREATE_DELEGATE,
      Permission.READ_DELEGATE,
      Permission.UPDATE_DELEGATE, // Own delegates only
      Permission.DELETE_DELEGATE, // Own delegates only
      Permission.READ_SEAT_MANAGEMENT,
      Permission.READ_COBRANDING,
    ],
    scope: AccessScope.COMPANY,
    description: 'Limited access to assigned company and its users'
  },

  user: {
    name: 'Standard User',
    permissions: [
      // Very limited access
      Permission.READ_USER, // Self only
      Permission.UPDATE_USER, // Self only
      Permission.READ_COMPANY, // Own company info
      Permission.READ_EDITION, // Own edition info
      Permission.READ_TAG,
      Permission.READ_COBRANDING,
    ],
    scope: AccessScope.SELF,
    description: 'Basic user access to own resources'
  },

  delegate: {
    name: 'Delegate',
    permissions: [
      // Acting on behalf of others
      Permission.READ_USER, // Delegated users
      Permission.UPDATE_USER, // Delegated users (limited)
      Permission.READ_COMPANY, // Delegated company
      Permission.READ_EDITION, // Delegated edition
      Permission.READ_TAG,
      Permission.READ_COBRANDING,
    ],
    scope: AccessScope.SELF, // Scope determined by delegation context
    description: 'Access on behalf of delegated users with limited permissions'
  }
};

// Helper function to get role definition
export const getRoleDefinition = (role: UserRole): RoleDefinition => {
  return ROLE_DEFINITIONS[role];
};

// Helper function to check if role has permission
export const roleHasPermission = (role: UserRole, permission: Permission): boolean => {
  return ROLE_DEFINITIONS[role].permissions.includes(permission);
}; 