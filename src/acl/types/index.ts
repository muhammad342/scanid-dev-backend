// Permission actions
export enum Permission {
  // User Management
  CREATE_USER = 'create:user',
  READ_USER = 'read:user',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',
  
  // Company Management
  CREATE_COMPANY = 'create:company',
  READ_COMPANY = 'read:company',
  UPDATE_COMPANY = 'update:company',
  DELETE_COMPANY = 'delete:company',
  
  // System Edition Management
  CREATE_EDITION = 'create:edition',
  READ_EDITION = 'read:edition',
  UPDATE_EDITION = 'update:edition',
  DELETE_EDITION = 'delete:edition',
  
  // Tags
  CREATE_TAG = 'create:tag',
  READ_TAG = 'read:tag',
  UPDATE_TAG = 'update:tag',
  DELETE_TAG = 'delete:tag',
  
  // Custom Fields
  CREATE_CUSTOM_FIELD = 'create:custom_field',
  READ_CUSTOM_FIELD = 'read:custom_field',
  UPDATE_CUSTOM_FIELD = 'update:custom_field',
  DELETE_CUSTOM_FIELD = 'delete:custom_field',
  
  // Delegate Access
  CREATE_DELEGATE = 'create:delegate',
  READ_DELEGATE = 'read:delegate',
  UPDATE_DELEGATE = 'update:delegate',
  DELETE_DELEGATE = 'delete:delegate',
  
  // Seat Management
  READ_SEAT_MANAGEMENT = 'read:seat_management',
  UPDATE_SEAT_MANAGEMENT = 'update:seat_management',
  
  // Co-branding
  READ_COBRANDING = 'read:cobranding',
  UPDATE_COBRANDING = 'update:cobranding',
  
  // Audit Logs
  READ_AUDIT_LOGS = 'read:audit_logs',
  
  // System Settings
  READ_SYSTEM_SETTINGS = 'read:system_settings',
  UPDATE_SYSTEM_SETTINGS = 'update:system_settings',
}

// Access scopes for context-aware permissions
export enum AccessScope {
  GLOBAL = 'global',          // Access to all resources
  EDITION = 'edition',        // Access within assigned edition(s)
  COMPANY = 'company',        // Access within assigned company
  SELF = 'self',              // Access to own resources only
}

// Role definitions with permissions and scopes
export interface RoleDefinition {
  name: string;
  permissions: Permission[];
  scope: AccessScope;
  description: string;
}

// Context for permission checking
export interface PermissionContext {
  userId: string;
  userRole: string;
  companyId?: string | undefined;
  systemEditionId?: string | undefined;
  targetUserId?: string | undefined;
  targetCompanyId?: string | undefined;
  targetSystemEditionId?: string | undefined;
}

// Permission check result
export interface PermissionResult {
  granted: boolean;
  reason?: string;
}

export type UserRole = 'super_admin' | 'edition_admin' | 'company_admin' | 'user' | 'delegate'; 