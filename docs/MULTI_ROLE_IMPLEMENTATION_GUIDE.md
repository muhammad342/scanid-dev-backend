# Multi-Role System Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the new multi-role system in your backend application.

## Migration Steps

### 1. Run the Database Migrations

Execute the following migrations in order:

```bash
# Create roles table and seed default roles
npx sequelize-cli db:migrate --to 011-create-roles-table.cjs

# Create channels table for channel partner support
npx sequelize-cli db:migrate --to 012-create-channels-table.cjs

# Create user_roles join table with constraints
npx sequelize-cli db:migrate --to 013-create-user-roles-table.cjs

# Migrate existing user roles to new system
npx sequelize-cli db:migrate --to 014-migrate-existing-user-roles.cjs

# Remove old role column from users table
npx sequelize-cli db:migrate --to 015-remove-old-role-column.cjs
```

Or run all migrations at once:
```bash
npx sequelize-cli db:migrate
```

### 2. Update Your Code

The new models are automatically imported and configured. No additional setup is required for the models themselves.

## Using the New Multi-Role System

### Checking User Roles

```typescript
import { User } from '../models/index.js';

// Get user instance
const user = await User.findByPk(userId);

// Check if user has a specific role (any context)
const hasRole = await user.hasRole('company_admin');

// Check if user has role in specific context
const isCompanyAdmin = await user.hasRole('company_admin', { 
  companyId: 'company-uuid' 
});

// Check for super admin (global role)
const isSuperAdmin = await user.isSuperAdmin();

// Check edition admin for specific edition
const isEditionAdmin = await user.isEditionAdmin('edition-uuid');

// Get all roles for a user
const allRoles = await user.getRoles();

// Get roles for specific context
const companyRoles = await user.getRoles({ 
  companyId: 'company-uuid' 
});
```

### Managing Role Assignments

```typescript
import { UserRole, Role } from '../models/index.js';

// Find role by name
const roleId = await Role.findOne({ 
  where: { name: 'company_admin' } 
}).then(role => role?.id);

// Grant a role to a user
const userRole = await UserRole.create({
  userId: 'user-uuid',
  roleId: roleId,
  companyId: 'company-uuid', // Context
  grantedBy: 'admin-user-uuid',
  isActive: true
});

// Revoke a role
await userRole.revoke('admin-user-uuid');

// Reactivate a role
await userRole.activate();

// Find user roles
const userRoles = await UserRole.findAll({
  where: {
    userId: 'user-uuid',
    isActive: true,
    revokedAt: null
  },
  include: ['role', 'company', 'systemEdition', 'channel']
});
```

### Channel Management

```typescript
import { Channel } from '../models/index.js';

// Create a new channel
const channel = await Channel.create({
  name: 'Partner Channel',
  systemEditionId: 'edition-uuid',
  channelAdminId: 'user-uuid',
  revenueSplitPercentage: 15.00
});

// Assign channel admin role
await UserRole.create({
  userId: 'user-uuid',
  roleId: channelAdminRoleId,
  channelId: channel.id,
  grantedBy: 'admin-user-uuid'
});
```

## Role Context Rules

### Global Roles
- **super_admin**: No context required (all context fields are NULL)
- Can access any resource across the entire system

### Edition-Scoped Roles
- **edition_admin**: Requires `systemEditionId`
- Can manage companies and users within their edition

### Company-Scoped Roles
- **company_admin**: Requires `companyId`
- **user**: Requires `companyId`
- **delegate**: Requires `companyId`

### Channel-Scoped Roles
- **channel_admin**: Requires `channelId`
- Can manage users within their channel

## Unique Constraints

The system prevents duplicate role assignments:

1. A user cannot have the same role twice in the same system edition
2. A user cannot have the same role twice in the same company
3. A user cannot have the same role twice in the same channel
4. A user cannot have duplicate global roles

## Migration Rollback

If you need to rollback the migration:

```bash
# Rollback to the state before multi-role implementation
npx sequelize-cli db:migrate:undo:all --to 010-add-certificate-type-to-tags.cjs
```

**Warning**: Rolling back will lose any new role assignments made after migration.

## API Updates Required

### Authentication Middleware Updates

You'll need to update your authentication middleware to work with the new role system:

```typescript
// OLD: Checking single role
if (req.user.role === 'company_admin') {
  // Allow access
}

// NEW: Checking multiple roles
const hasRole = await req.user.hasRole('company_admin', {
  companyId: req.params.companyId
});
if (hasRole) {
  // Allow access
}
```

### Context Resolution Updates

Update your context resolver middleware to handle the new role system:

```typescript
// Check user roles for the resolved context
const userRoles = await req.user.getRoles({
  companyId: context.companyId,
  systemEditionId: context.systemEditionId
});

req.userRoles = userRoles;
```

## Testing

### Test Data Setup

```typescript
// Create test roles
const superAdminRole = await Role.findOne({ where: { name: 'super_admin' }});
const companyAdminRole = await Role.findOne({ where: { name: 'company_admin' }});

// Create test user with multiple roles
const user = await User.create({
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
});

// Assign super admin role (global)
await UserRole.create({
  userId: user.id,
  roleId: superAdminRole.id,
  isActive: true
});

// Assign company admin role (company-scoped)
await UserRole.create({
  userId: user.id,
  roleId: companyAdminRole.id,
  companyId: 'company-uuid',
  isActive: true
});
```

### Test Role Checking

```typescript
// Test role checks
const isSuperAdmin = await user.isSuperAdmin(); // true
const isCompanyAdmin = await user.isCompanyAdmin('company-uuid'); // true
const isCompanyAdminOther = await user.isCompanyAdmin('other-company'); // false
```

## Performance Considerations

1. **Indexing**: The user_roles table has comprehensive indexes for performance
2. **Caching**: Consider caching role checks for frequently accessed users
3. **Bulk Operations**: Use bulk operations when assigning roles to multiple users

## Security Considerations

1. **Audit Trail**: All role grants/revocations are tracked with timestamps and grantor information
2. **Expiration**: Roles can have expiration dates for temporary access
3. **Unique Constraints**: Prevent duplicate role assignments
4. **Cascading Deletes**: Proper foreign key constraints maintain referential integrity

## Troubleshooting

### Common Issues

1. **Migration Failures**: Ensure database is backed up before running migrations
2. **Constraint Violations**: Check for existing duplicate role assignments before migration
3. **Performance Issues**: Monitor query performance after migration and adjust indexes if needed

### Debugging

```typescript
// Debug user roles
const user = await User.findByPk(userId, {
  include: [{
    model: UserRole,
    as: 'userRoles',
    include: ['role', 'company', 'systemEdition', 'channel'],
    where: { isActive: true }
  }]
});

console.log('User roles:', user.userRoles);
```

## Support

For issues or questions about the multi-role system implementation, refer to:

1. **Schema Documentation**: `MULTI_ROLE_SCHEMA_DOCUMENTATION.md`
2. **Migration Files**: Check the individual migration files for specific changes
3. **Model Definitions**: Review the updated model files for relationship definitions
