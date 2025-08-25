# Multi-Role Database Schema Documentation

## Overview

This document describes the refactored database schema that supports multiple roles per user. The system has been migrated from a single-role per user model to a flexible multi-role system that allows users to have different roles in different contexts (companies, editions, channels).

## New Schema Components

### 1. `roles` Table

Defines the available roles in the system.

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

**Predefined Roles:**
- `super_admin` - Full system access, can manage all editions, companies, and users
- `edition_admin` - Manage assigned system editions and their companies/users
- `company_admin` - Manage assigned company and its users
- `channel_admin` - Access a channel and manage its users
- `user` - Standard user with basic access
- `delegate` - Act on behalf of another user

### 2. `channels` Table

New table to support channel partner functionality.

```sql
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  system_edition_id UUID NOT NULL REFERENCES system_editions(id),
  channel_admin_id UUID REFERENCES users(id),
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' NOT NULL,
  revenue_split_percentage DECIMAL(5,2) DEFAULT 0.00,
  contact_email VARCHAR,
  contact_phone VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP
);
```

**Unique Constraints:**
- `(name, system_edition_id)` where `deleted_at IS NULL`

### 3. `user_roles` Table (Join Table)

The core table that enables the multi-role system. Links users to roles with contextual information.

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  
  -- Context fields - define where this role applies
  system_edition_id UUID REFERENCES system_editions(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  
  -- Role metadata
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  revoked_by UUID REFERENCES users(id),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

**Unique Constraints:**
- `(user_id, role_id, system_edition_id)` - Prevents duplicate roles in the same edition
- `(user_id, role_id, company_id)` - Prevents duplicate roles in the same company
- `(user_id, role_id, channel_id)` - Prevents duplicate roles in the same channel
- `(user_id, role_id)` - Prevents duplicate global roles (where all context fields are NULL)

## Role Context Rules

### 1. Global Roles
- **super_admin**: No context required (all context fields are NULL)
- Can access any resource across the entire system

### 2. Edition-Scoped Roles
- **edition_admin**: Requires `system_edition_id`
- Can access resources within their assigned edition

### 3. Company-Scoped Roles
- **company_admin**: Requires `company_id` (and inherits `system_edition_id` from company)
- **user**: Requires `company_id` (and inherits `system_edition_id` from company)
- **delegate**: Requires `company_id` (and inherits `system_edition_id` from company)

### 4. Channel-Scoped Roles
- **channel_admin**: Requires `channel_id` (and inherits `system_edition_id` from channel)

## Key Features

### 1. Multiple Roles Per User
- A user can have different roles in different contexts
- Example: User can be `company_admin` in Company A and `user` in Company B

### 2. Role Lifecycle Management
- Roles can be granted and revoked
- Support for expiration dates
- Audit trail of who granted/revoked roles

### 3. Hierarchical Context
- Channel roles inherit system edition context
- Company roles inherit system edition context
- Edition roles are scoped to specific editions
- Global roles have no scope restrictions

### 4. Unique Constraints
- Prevents duplicate role assignments within the same context
- Ensures data integrity and prevents conflicts

## Migration Strategy

The migration is handled through several sequential migrations:

1. **011-create-roles-table.cjs**: Creates roles table and seeds default roles
2. **012-create-channels-table.cjs**: Creates channels table for channel partner support
3. **013-create-user-roles-table.cjs**: Creates the user_roles join table with all constraints
4. **014-migrate-existing-user-roles.cjs**: Migrates existing user roles to new system
5. **015-remove-old-role-column.cjs**: Removes the old single role column from users table

## Updated Model Relationships

### User Model Changes
- Removed single `role` field
- Added helper methods: `getRoles()`, `hasRole()`, `isSuperAdmin()`, etc.
- Added associations to `userRoles` and `roles`

### New Models
- **Role**: Manages role definitions
- **Channel**: Manages channel partner information
- **UserRole**: Manages user-role assignments with context

### Enhanced Associations
- Users can have multiple roles through UserRole join table
- Channels belong to system editions and can have channel admins
- All role assignments are tracked with audit information

## Usage Examples

### Checking User Roles
```typescript
// Check if user has a specific role in any context
const hasRole = await user.hasRole('company_admin');

// Check if user has role in specific context
const isCompanyAdmin = await user.hasRole('company_admin', { companyId: 'company-uuid' });

// Get all roles for a user in a specific company
const roles = await user.getRoles({ companyId: 'company-uuid' });

// Check for super admin (global role)
const isSuperAdmin = await user.isSuperAdmin();
```

### Creating Role Assignments
```typescript
// Grant company admin role to user
await UserRole.create({
  userId: 'user-uuid',
  roleId: 'company-admin-role-uuid',
  companyId: 'company-uuid',
  grantedBy: 'granting-user-uuid'
});
```

### Revoking Roles
```typescript
const userRole = await UserRole.findOne({
  where: {
    userId: 'user-uuid',
    roleId: 'role-uuid',
    companyId: 'company-uuid',
    isActive: true
  }
});

await userRole.revoke('revoking-user-uuid');
```

## Benefits

1. **Flexibility**: Users can have different roles in different contexts
2. **Scalability**: Supports complex organizational structures
3. **Auditability**: Full audit trail of role grants/revocations
4. **Data Integrity**: Unique constraints prevent duplicate assignments
5. **Extensibility**: Easy to add new roles or contexts in the future

## Backward Compatibility

The migration preserves existing role assignments by:
1. Creating equivalent UserRole records for existing user roles
2. Maintaining proper context (company/edition associations)
3. Handling role-specific logic (super_admin as global, edition_admin scoped to edition, etc.)

The rollback functionality allows reverting to the old single-role system if needed during the migration period.
