# Backend Codebase Documentation

## Overview

This is a production-ready Node.js backend application built with TypeScript, Express.js, and PostgreSQL. It follows clean architecture principles and implements a Super Admin system for managing product editions, companies, users, and various modules. The system is designed to support a multi-tenant architecture with comprehensive role-based access control.

## Tech Stack

- **Node.js** - Runtime environment
- **TypeScript** - Type-safe development
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Sequelize** - ORM with database migrations
- **JWT** - Authentication
- **Winston** - Logging
- **Jest** - Testing framework

## Current Folder Structure

```
backend/
├── src/
│   ├── acl/                    # Access Control Layer
│   │   ├── cache/             # Permission caching
│   │   ├── middleware/        # ACL middleware
│   │   ├── permissions/       # Role definitions and permissions
│   │   ├── policies/          # Policy implementations
│   │   └── types/             # ACL type definitions
│   ├── api/                   # API layer
│   │   └── v1/               # API version 1 routes
│   ├── config/                # Configuration files
│   │   ├── database.ts       # Database configuration
│   │   └── index.ts          # App configuration
│   ├── core/                  # Core application setup
│   │   ├── app.ts            # Express app configuration
│   │   └── server.ts         # Server startup
│   ├── database/              # Database management
│   │   ├── migrations/       # Database migrations
│   │   └── seeders/          # Database seeders
│   ├── models/                # Database models (organized by model)
│   │   ├── AuditLog/         # Audit logging model
│   │   │   ├── index.ts
│   │   │   └── triggers/
│   │   ├── Company/          # Company model
│   │   │   ├── index.ts
│   │   │   └── triggers/
│   │   ├── CustomField/      # Custom field model
│   │   │   ├── index.ts
│   │   │   └── triggers/
│   │   ├── DelegateAccess/   # Delegate access model
│   │   │   ├── index.ts
│   │   │   └── triggers/
│   │   ├── DocumentTag/      # Legacy document tags
│   │   │   ├── index.ts
│   │   │   └── triggers/
│   │   ├── NotesTag/         # Legacy notes tags
│   │   │   ├── index.ts
│   │   │   └── triggers/
│   │   ├── SeatManagement/   # Seat management model
│   │   │   ├── index.ts
│   │   │   └── triggers/
│   │   ├── SystemEdition/    # System edition model
│   │   │   ├── index.ts
│   │   │   └── triggers/
│   │   ├── SystemEditionConfig/ # System edition config
│   │   │   └── triggers/
│   │   ├── Tag/              # Unified tag model
│   │   │   ├── index.ts
│   │   │   └── triggers/
│   │   ├── User/             # User model
│   │   │   ├── index.ts
│   │   │   └── triggers/
│   │   └── index.ts          # Model associations
│   ├── modules/               # Feature modules
│   │   ├── auth/             # Authentication module
│   │   │   ├── __tests__/
│   │   │   ├── controllers/
│   │   │   ├── policies/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── companies/        # Company management
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   └── services/
│   │   ├── customFields/     # Custom field management
│   │   │   ├── __tests__/
│   │   │   ├── controllers/
│   │   │   ├── policies/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── delegates/        # Delegate access management
│   │   │   ├── __tests__/
│   │   │   ├── controllers/
│   │   │   ├── policies/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── systemEditions/   # System edition management
│   │   │   ├── __tests__/
│   │   │   ├── controllers/
│   │   │   ├── policies/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── types/
│   │   └── users/            # User management
│   │       ├── controllers/
│   │       ├── policies/
│   │       ├── routes/
│   │       ├── services/
│   │       └── types/
│   ├── scripts/               # Utility scripts
│   │   └── createSuperAdmin.ts
│   ├── shared/                # Shared utilities and middleware
│   │   ├── constants/        # Application constants
│   │   ├── middleware/       # Shared middleware
│   │   ├── types/            # Shared type definitions
│   │   └── utils/            # Utility functions
│   └── tests/                 # Test files
├── logs/                      # Log files
├── dist/                      # Compiled JavaScript
├── package.json               # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── jest.config.js            # Jest configuration
├── .sequelizerc              # Sequelize configuration
├── .prettierrc               # Prettier configuration
├── .eslintrc.json            # ESLint configuration
└── nodemon.json              # Nodemon configuration
```

## Role-Based Access Control (RBAC) System

### Current Roles (Implemented)
The system currently supports the following roles:

1. **Super Admin** (`super_admin`): Full system access, can manage all editions, create editions, and configure features
2. **Edition Admin** (`edition_admin`): Limited access to assigned editions
3. **Company Admin** (`company_admin`): Limited access to assigned company and users
4. **User** (`user`): Standard user with basic access
5. **Delegate** (`delegate`): User who can act on behalf of another user

### Access Scopes
- **GLOBAL**: Access to all resources (Super Admin)
- **EDITION**: Access within assigned edition(s) (Edition Admin)
- **COMPANY**: Access within assigned company (Company Admin)
- **SELF**: Access to own resources only (User, Delegate)

### Permission System
The system uses a granular permission system with the following permissions:
- User Management: `create:user`, `read:user`, `update:user`, `delete:user`
- Company Management: `create:company`, `read:company`, `update:company`, `delete:company`
- System Edition Management: `create:edition`, `read:edition`, `update:edition`, `delete:edition`
- Tag Management: `create:tag`, `read:tag`, `update:tag`, `delete:tag`
- Custom Field Management: `create:custom_field`, `read:custom_field`, `update:custom_field`, `delete:custom_field`
- Delegate Access: `create:delegate`, `read:delegate`, `update:delegate`, `delete:delegate`
- Seat Management: `read:seat_management`, `update:seat_management`
- Co-branding: `read:cobranding`, `update:cobranding`
- Audit Logs: `read:audit_logs`
- System Settings: `read:system_settings`, `update:system_settings`

## Database Models

### 1. **SystemEdition**
- **Purpose**: Represents product editions with configurable features
- **Key Fields**:
  - `id`: UUID primary key
  - `name`: Edition name (unique)
  - `modules`: JSONB field for enabled features (co_branding, document_management, notes, certifications, delegate_access, seat_management)
  - `archived`: Boolean for soft archiving
  - `logoUrl`, `organizationName`, `slogan`: Branding fields
  - `primaryBrandColor`, `secondaryBrandColor`: Brand colors
  - `documentSettings`, `notesSettings`: JSONB configuration objects
  - `createdBy`, `lastUpdatedBy`: User references
- **Relationships**: 
  - Has many Companies, Users, Tags, CustomFields, DelegateAccess, AuditLogs
  - Has one SeatManagement
  - Belongs to User (created by, last updated by)

### 2. **Company**
- **Purpose**: Organizations using system editions
- **Key Fields**:
  - `id`: UUID primary key
  - `name`: Company name
  - `systemEditionId`: Reference to SystemEdition
  - `companyAdminId`: Reference to User
  - `totalSeats`, `usedSeats`: Seat management
  - `availableSeats`: Virtual field (totalSeats - usedSeats)
  - `status`: Enum ('active', 'inactive', 'suspended')
  - `type`: Company type/category
  - `address`: Company address
  - `title`: Company title/description
  - `channelPartnerSplit`: Boolean for channel partner split
  - `commission`: Commission percentage (0-100)
  - `paymentMethod`: Payment method preference
- **Relationships**:
  - Belongs to SystemEdition and User (company admin)
  - Has many Users and DelegateAccess

### 3. **User**
- **Purpose**: Enhanced user model supporting multiple roles
- **Key Fields**:
  - `id`: UUID primary key
  - `email`: Unique email address
  - `password`: Hashed password (bcrypt)
  - `firstName`, `lastName`: User names
  - `role`: Enum ('super_admin', 'edition_admin', 'company_admin', 'user', 'delegate')
  - `isActive`, `emailVerified`: Status flags
  - `phoneNumber`: Optional phone
  - `companyId`, `systemEditionId`: Foreign keys
  - `seatAssigned`: Boolean for seat allocation
  - `licenseType`: Enum ('organizational_seat', 'individual_parent', 'individual_child', 'none')
  - `delegateCount`: Number of delegates
  - `lastLoginAt`, `expirationDate`: Tracking fields
  - `createdBy`: Reference to user who created this user
- **Relationships**:
  - Belongs to Company and SystemEdition
  - Has many managed companies and created editions
  - Has many created users (through createdBy)
  - Has many created custom fields (through createdBy)
  - Self-referential relationship for createdBy

### 4. **SeatManagement**
- **Purpose**: Pricing and license management for editions
- **Key Fields**:
  - `id`: UUID primary key
  - `systemEditionId`: One-to-one with SystemEdition
  - `allowOrganizationalSeats`, `allowIndividualLicenses`: Boolean flags
  - `seatCostMonthly`, `seatCostAnnual`: Organizational pricing
  - `individualParentCost*`, `individualChildCost*`: Individual pricing (monthly/annual/lifetime)
  - `subscriptionSplitPercentage`: Revenue sharing
- **Relationships**:
  - Belongs to SystemEdition

### 5. **Tag** (Unified)
- **Purpose**: Unified tagging system for documents and notes
- **Key Fields**:
  - `id`: UUID primary key
  - `systemEditionId`: Reference to SystemEdition
  - `name`: Tag name
  - `color`: Hex color code
  - `type`: Enum ('document', 'note')
  - `isActive`: Boolean status
  - `sortOrder`: Integer for ordering
- **Relationships**:
  - Belongs to SystemEdition

### 6. **CustomField**
- **Purpose**: Dynamic custom field definitions for system editions
- **Key Fields**:
  - `id`: UUID primary key
  - `systemEditionId`: Reference to SystemEdition
  - `fieldName`: Field name
  - `fieldType`: Enum ('Number', 'Text', 'Date', 'Dropdown', 'Checkbox')
  - `helpText`: Optional help text/tooltip
  - `isMandatory`: Boolean for required fields
  - `useDecimals`: Boolean for number fields
  - `dropdownOptions`: JSONB array for dropdown options
  - `fieldOrder`: Integer for field ordering
  - `isActive`: Boolean status
  - `createdBy`: Reference to User who created the field
- **Relationships**:
  - Belongs to SystemEdition and User (creator)

### 7. **DelegateAccess**
- **Purpose**: Admin delegation system
- **Key Fields**:
  - `id`: UUID primary key
  - `systemEditionId`: Reference to SystemEdition
  - `delegatorId`, `delegateId`: User references
  - `permissions`: Array of permission strings
  - `isActive`: Boolean status
  - `expirationDate`: Optional expiration
- **Relationships**:
  - Belongs to SystemEdition, Company, and Users (delegator/delegate)

### 8. **AuditLog**
- **Purpose**: System activity tracking
- **Key Fields**:
  - `id`: UUID primary key
  - `systemEditionId`, `companyId`, `userId`: Context references
  - `action`: Action performed
  - `module`: Enum ('documents', 'notes', 'certifications', 'users', 'settings', 'system', 'authentication', 'permissions')
  - `description`: Human-readable description
  - `ipAddress`, `userAgent`: Request metadata
  - `metadata`: JSONB for additional data
- **Relationships**:
  - Belongs to SystemEdition, Company, and User

### 9. **DocumentTag** (Legacy)
- **Purpose**: Legacy document tagging system (being migrated to unified Tag model)
- **Key Fields**:
  - `id`: UUID primary key
  - `systemEditionId`: Reference to SystemEdition
  - `name`: Tag name
  - `description`: Optional description
  - `color`: Hex color code
  - `useMasterPin`, `useDocumentViewPin`: Security settings
  - `reminderEnabled`, `reminderDays`: Reminder configuration
  - `expirationDate`: Optional expiration
- **Status**: Deprecated, migration in progress

### 10. **NotesTag** (Legacy)
- **Purpose**: Legacy notes tagging system (being migrated to unified Tag model)
- **Key Fields**: Same structure as DocumentTag
- **Status**: Deprecated, migration in progress

## API Design Guidelines

### Route Structure
1. **`/my-edition` Pattern**
   - Used for endpoints where users access their own system edition's data
   - The system edition ID comes from `req.user.systemEditionId`
   - Example: `/api/v1/custom-fields/my-edition`

2. **`/system-edition/:systemEditionId` Pattern**
   - Used only for super admin routes where they need to access any system edition
   - The system edition ID comes from URL parameters
   - Example: `/api/v1/custom-fields/system-edition/:systemEditionId`

### Sequelize Model Data Handling
1. **Accessing Model Data**
   - Always use `get({ plain: true })` to convert Sequelize model instances to plain JavaScript objects
   - This ensures consistent data access and removes Sequelize-specific metadata
   - Example:
     ```typescript
     const model = await Model.findByPk(id);
     return model.get({ plain: true });
     ```

2. **Handling Multiple Records**
   - When returning multiple records, map them to plain objects
   - Example:
     ```typescript
     const models = await Model.findAll();
     return models.map(model => model.get({ plain: true }));
     ```

3. **Creating Records**
   - After creating a record, convert it to a plain object before accessing properties
   - Example:
     ```typescript
     const newModel = await Model.create(data);
     const plainModel = newModel.get({ plain: true });
     return plainModel.id;
     ```

4. **Updating Records**
   - After updating, fetch and convert to plain object before returning
   - Example:
     ```typescript
     await model.update(data);
     const updated = await Model.findByPk(id);
     return updated.get({ plain: true });
     ```

### API Documentation
1. **Postman Collections**
   - All APIs must have corresponding Postman collection files in `postman-collection/`
   - When creating or modifying APIs, the Postman collection must be updated accordingly
   - Collections should include example requests and response schemas
   - Collections should be organized by resource type and access pattern

### Base URL: `/api/v1`

### **Health Check**
- `GET /health` - API health check

### **System Editions**
- `GET /system-editions` - Get all system editions (paginated, searchable)
- `GET /system-editions/:id` - Get system edition by ID
- `POST /system-editions` - Create new system edition
- `PUT /system-editions/:id` - Update system edition
- `DELETE /system-editions/:id` - Delete system edition

#### **System Edition Sub-resources**
- `GET /system-editions/:id/overview` - Get overview statistics
- `GET /system-editions/:id/companies` - Get related companies
- `GET /system-editions/:id/users` - Get all users
- `GET /system-editions/:id/company-admins` - Get company admins
- `GET /system-editions/:id/edition-admins` - Get edition admins
- `GET /system-editions/:id/delegates` - Get delegates
- `GET /system-editions/:id/seat-management` - Get seat management settings
- `PUT /system-editions/:id/seat-management` - Update seat management
- `GET /system-editions/:id/co-branding` - Get co-branding settings
- `PUT /system-editions/:id/co-branding` - Update co-branding
- `POST /system-editions/:id/co-branding/upload-logo` - Upload logo
- `GET /system-editions/:id/tags` - Get all tags
- `POST /system-editions/:id/tags` - Create tag
- `PUT /system-editions/:id/tags/:tagId` - Update tag
- `DELETE /system-editions/:id/tags/:tagId` - Delete tag
- `PUT /system-editions/:id/tags/order` - Update tag order
- `POST /system-editions/:id/tags/merge` - Merge tags
- `GET /system-editions/:id/delegate-access` - Get delegate access
- `POST /system-editions/:id/delegate-access` - Create delegate access
- `GET /system-editions/:id/audit-logs` - Get audit logs

#### **Edition Admin Specific Routes**
- `GET /system-editions/edition-admin` - Get edition admin's edition
- `PUT /system-editions/edition-admin` - Update edition admin's edition
- `GET /system-editions/edition-admin/co-branding` - Get edition admin co-branding
- `PUT /system-editions/edition-admin/co-branding` - Update edition admin co-branding
- `POST /system-editions/edition-admin/co-branding/upload-logo` - Upload edition admin logo
- `GET /system-editions/edition-admin/tags` - Get edition admin tags
- `POST /system-editions/edition-admin/tags` - Create edition admin tag
- `PUT /system-editions/edition-admin/tags/:tagId` - Update edition admin tag
- `DELETE /system-editions/edition-admin/tags/:tagId` - Delete edition admin tag
- `PUT /system-editions/edition-admin/tags/order` - Update edition admin tag order
- `POST /system-editions/edition-admin/tags/merge` - Merge edition admin tags

#### **Legacy Tag Routes**
- `GET /system-editions/:id/document-tags` - Get document tags
- `POST /system-editions/:id/document-tags` - Create document tag
- `GET /system-editions/:id/notes-tags` - Get notes tags
- `POST /system-editions/:id/notes-tags` - Create notes tag

### **Companies**
- `GET /companies` - Get all companies (paginated, searchable)
- `GET /companies/:id` - Get company by ID
- `POST /companies` - Create company
- `PUT /companies/:id` - Update company
- `DELETE /companies/:id` - Delete company
- `GET /companies/:id/users` - Get company users

### **Users**
- `GET /users` - Get all users (paginated)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user (register)
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### **Custom Fields**

#### Global Overview (Super Admin Only)
- `GET /custom-fields` - Get all custom fields across all editions

#### My Edition Endpoints (All Roles)
- `GET /custom-fields/my-edition` - Get custom fields for user's edition
- `GET /custom-fields/my-edition/stats` - Get statistics for user's edition
- `GET /custom-fields/my-edition/:customFieldId` - Get specific field from user's edition

#### My Edition Management (Super Admin & Edition Admin)
- `POST /custom-fields/my-edition` - Create field in user's edition
- `PUT /custom-fields/my-edition/:customFieldId` - Update field in user's edition
- `DELETE /custom-fields/my-edition/:customFieldId` - Delete field from user's edition
- `PUT /custom-fields/my-edition/order` - Update field order in user's edition

#### System Edition Management (Super Admin Only)
- `GET /custom-fields/system-edition/:systemEditionId` - Get fields from any edition
- `GET /custom-fields/system-edition/:systemEditionId/stats` - Get stats for any edition
- `GET /custom-fields/system-edition/:systemEditionId/:customFieldId` - Get any field from any edition
- `POST /custom-fields/system-edition/:systemEditionId` - Create field in any edition
- `PUT /custom-fields/system-edition/:systemEditionId/:customFieldId` - Update any field
- `DELETE /custom-fields/system-edition/:systemEditionId/:customFieldId` - Delete any field
- `PUT /custom-fields/system-edition/:systemEditionId/order` - Update order in any edition

#### Access Control
- Read operations (`GET`) on `/my-edition` routes: All roles
- Write operations on `/my-edition` routes: Super Admin and Edition Admin only
- All `/system-edition` routes: Super Admin only
- Global overview (`GET /custom-fields`): Super Admin only

### **Delegate Access**
- `GET /delegate-access` - Get all delegate access records
- `GET /delegate-access/:id` - Get delegate access by ID
- `PUT /delegate-access/:id` - Update delegate access
- `DELETE /delegate-access/:id` - Delete delegate access
- `POST /delegate-access/invite` - Invite delegate admin

### **Audit Logs**
- `GET /audit-logs` - Get audit logs (paginated, searchable)
  - Query parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)
    - `search`: Search term for action or description
    - `module`: Filter by module
    - `dateFrom`: Start date (YYYY-MM-DD)
    - `dateTo`: End date (YYYY-MM-DD)
    - `systemEditionId`: Filter by system edition ID
    - `companyId`: Filter by company ID
    - `userId`: Filter by user ID
  - Access Control:
    - Super Admin: Can see all logs
    - Edition Admin: Can only see logs from their edition
    - Company Admin: Can only see logs from their company
    - User: Can only see their own logs

## Modules and Responsibilities

### **ACL (Access Control Layer)**
- **Location**: `src/acl/`
- **Purpose**: Centralized access control and permission management
- **Components**:
  - `permissions/roleDefinitions.ts`: Role-based permission definitions
  - `types/index.ts`: Permission and access scope types
  - `middleware/`: ACL middleware implementations
  - `policies/`: Policy implementations
  - `cache/`: Permission caching layer

### **API Layer**
- **Location**: `src/api/`
- **Purpose**: API route organization and versioning
- **Structure**: Versioned API routes with modular organization

### **Core Application**
- **Location**: `src/core/`
- **Purpose**: Application setup and server configuration
- **Components**:
  - `app.ts`: Express application configuration
  - `server.ts`: Server startup and configuration

### **Feature Modules**
- **Location**: `src/modules/`
- **Purpose**: Organized feature-specific code
- **Structure**: Each module follows a consistent structure with the following directories:
  - `controllers/`: Request handling, validation, and response formatting
  - `services/`: Business logic, data operations, and external integrations
  - `routes/`: API endpoint definitions and middleware configuration
  - `policies/`: Access control policies and authorization rules
  - `types/`: TypeScript type definitions and interfaces
  - `__tests__/`: Unit tests, integration tests, and test utilities
- **Naming Convention**: Module names should be in camelCase (e.g., `customFields`, `systemEditions`)
- **Import Pattern**: Use relative imports within modules, absolute imports for shared resources

#### **Auth Module**
- Authentication and authorization logic
- JWT token management
- Login/logout functionality

#### **Custom Fields Module**
- **Location**: `src/modules/customFields/`
- **Purpose**: Manage custom field definitions for system editions
- **Components**:
  - `controllers/`: Request handling and validation
  - `services/`: Business logic and data operations
  - `routes/`: API endpoint definitions
  - `policies/`: Access control policies
  - `types/`: TypeScript type definitions
  - `__tests__/`: Unit and integration tests
- **Features**:
  - Custom field CRUD operations
  - Field type management (Number, Text, Date, Dropdown, Checkbox)
  - Field ordering and validation
  - Edition-scoped custom field management
  - Dropdown options management
  - Field statistics and reporting

#### **System Editions Module**
- System edition CRUD operations
- Co-branding management
- Seat management configuration
- Tag management (unified and legacy)
- Delegate access management

#### **Companies Module**
- Company CRUD operations
- Company user management
- Company branding configuration

#### **Users Module**
- User CRUD operations
- User role management
- User profile management

#### **Delegates Module**
- Delegate access management
- Permission delegation
- Delegate invitation system

#### **Audit Logs Module**
- **Location**: `src/modules/auditLogs/`
- **Purpose**: Centralized audit logging and activity tracking
- **Components**:
  - `controllers/`: Request handling and validation
  - `services/`: Business logic and data operations
  - `routes/`: API endpoint definitions
  - `types/`: TypeScript type definitions
  - `__tests__/`: Unit and integration tests
- **Features**:
  - Audit log retrieval with filtering
  - Role-based access control
  - Pagination and search
  - Module-specific filtering
  - Date range filtering
  - Scope-based filtering (system edition, company, user)

### **Shared Components**
- **Location**: `src/shared/`
- **Purpose**: Reusable utilities and middleware
- **Components**:
  - `middleware/`: Shared middleware (auth, validation, error handling, security, logging)
  - `utils/`: Utility functions (response helpers, logger)
  - `types/`: Shared type definitions
  - `constants/`: Application constants

## Context Resolution Pattern

### Overview
The codebase implements a centralized context resolution pattern to handle role-based access and context determination. This pattern ensures consistent handling of company and system edition access across the application.

### Context Resolver Middleware
- **Location**: `src/shared/middleware/contextResolver.ts`
- **Purpose**: Automatically resolves and validates access context based on user role
- **Usage**: Used after authentication and authorization middleware

### Context Resolution by Role

1. **Super Admin**
   - Can access any company/edition
   - Company/Edition ID taken from request params or query
   - No additional validation needed

2. **Edition Admin**
   - Restricted to their assigned edition
   - Can only access companies within their edition
   - System edition ID comes from their JWT token
   - Company access requires validation against their edition

3. **Company Admin**
   - Restricted to their assigned company
   - Company ID comes from their JWT token
   - System edition ID inherited from their company

4. **Regular User**
   - Restricted to their assigned company
   - Company ID comes from their JWT token
   - System edition ID inherited from their company

### Implementation in Controllers

```typescript
// Example controller using resolved context
async someAction(req: RequestWithContext, res: Response) {
  const context = req.resolvedContext;
  if (!context?.companyId) {
    return res.status(400).json({
      success: false,
      message: 'Company ID is required',
      timestamp: new Date().toISOString(),
    });
  }

  // Use the resolved companyId - all access checks are done
  const result = await service.doSomething(context.companyId);
  // ...
}
```

### Best Practices

1. **Controller Implementation**
   - Always use `RequestWithContext` type for request parameter
   - Check for context existence before accessing context properties
   - Use resolved IDs instead of params/query values
   - Handle missing context appropriately

2. **Route Configuration**
   - Ensure proper middleware order:
     1. Authentication (`authenticateToken`)
     2. Authorization (`authorize`)
     3. Context Resolution (`resolveContext`)
   - Example:
     ```typescript
     router.use(
       '/companies',
       authenticateToken,
       authorize('super_admin', 'edition_admin', 'company_admin'),
       resolveContext,
       companyRoutes
     );
     ```

3. **UUID Validation**
   - Always validate UUID format before database queries
   - Use proper UUID type for IDs in database
   - Handle invalid UUID errors gracefully

4. **Error Handling**
   - Provide clear error messages for context resolution failures
   - Log context resolution errors appropriately
   - Return appropriate HTTP status codes:
     - 400 for invalid IDs
     - 403 for unauthorized access
     - 404 for not found resources

### Security Considerations

1. **Access Control**
   - Context resolution happens after authentication
   - Role-based access is enforced before context resolution
   - Cross-edition access is prevented for edition admins
   - Company-level isolation is maintained

2. **Data Isolation**
   - Users can only access data within their context
   - Edition admins are restricted to their edition's data
   - Company admins are restricted to their company's data

3. **Validation**
   - All IDs are validated for proper UUID format
   - Company-edition relationships are verified
   - Invalid or unauthorized access attempts are logged

### Testing

When writing tests for endpoints using context resolution:

1. **Unit Tests**
   - Mock the context resolver middleware
   - Test with different role contexts
   - Verify proper context usage

2. **Integration Tests**
   - Test complete middleware chain
   - Verify proper access control
   - Test cross-edition access prevention
   - Test invalid UUID handling

### Example Module Implementation

```typescript
// routes/index.ts
import { Router } from 'express';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { resolveContext } from '../middleware/contextResolver.js';

const router = Router();

router.use(
  '/resource',
  authenticateToken,
  authorize('super_admin', 'edition_admin'),
  resolveContext,
  resourceRoutes
);

// controller.ts
import { RequestWithContext } from '../types/common';

export class ResourceController {
  async getResource(req: RequestWithContext, res: Response) {
    const context = req.resolvedContext;
    if (!context?.companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required',
        timestamp: new Date().toISOString(),
      });
    }

    // Use resolved context
    const resource = await this.service.findByCompany(context.companyId);
    // ...
  }
}
```

## Configuration Files

### **Database Configuration** (`src/config/database.ts`)
- Sequelize configuration with connection pooling
- Database connection and synchronization functions
- Environment-specific settings

### **App Configuration** (`src/config/index.ts`)
- Environment variable validation
- Configuration object with database and app settings
- JWT, CORS, rate limiting, and logging configurations

### **Package Configuration** (`package.json`)
- Dependencies and dev dependencies
- Scripts for development, testing, and deployment
- Project metadata and engine requirements

## Database Migrations

### **002-add-created-by-to-users.cjs**
- Adds `created_by` field to users table for tracking user creation
- Creates index on `created_by` field for performance
- Supports audit trail for user management

## Security Features

1. **Authentication**: JWT-based with configurable expiration
2. **Authorization**: Role-based access control with granular permissions
3. **Password Security**: bcrypt with configurable salt rounds
4. **Rate Limiting**: Configurable request limits
5. **Input Validation**: express-validator for request validation
6. **Security Headers**: Helmet.js for security headers
7. **CORS**: Configurable cross-origin resource sharing
8. **Audit Logging**: Comprehensive activity tracking

## Environment Variables

Key environment variables (see `env.example`):
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port
- `DB_*`: Database connection settings
- `JWT_SECRET`: JWT signing secret
- `CORS_ORIGIN`: Allowed CORS origins
- `RATE_LIMIT_*`: Rate limiting configuration
- `LOG_LEVEL`: Logging level

## Development Scripts

- `npm run dev`: Start development server with nodemon
- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Start production server
- `npm test`: Run Jest tests
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier
- `npm run db:migrate`: Run database migrations
- `npm run db:seed`: Run database seeders
- `npm run create-super-admin`: Create super admin user

## API Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Success message",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "message": "Success message",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Missing or To Be Added

### **Planned Models**

1. **Channel Partner Model**
   - **Purpose**: New model for channel partner management
   - **Status**: Not implemented
   - **Fields**: id, name, systemEditionId, channelAdminId, revenueSplitPercentage, status, etc.
   - **Relationships**: Belongs to SystemEdition, has many Companies, belongs to User (channel admin)

2. **Company Admin Model**
   - **Purpose**: Dedicated model for company administrators
   - **Status**: Currently handled through User model with role
   - **Consideration**: May not be needed as User model already supports company_admin role

3. **Revenue Split Configuration Model**
   - **Purpose**: Advanced revenue sharing between editions, channel partners, and companies
   - **Status**: Not implemented
   - **Fields**: id, systemEditionId, channelPartnerId?, companyId?, splitPercentage, splitType, etc.

4. **Permission Matrix Model**
   - **Purpose**: Granular permission system for each role
   - **Status**: Currently handled through ACL types and role definitions
   - **Consideration**: May be overkill as current system is sufficient

5. **Feature Access Control Model**
   - **Purpose**: Fine-grained feature access based on edition configuration
   - **Status**: Partially implemented through SystemEdition modules field
   - **Enhancement**: Could be more granular per user/company

### **Broken or Outdated Relationships**

1. **Legacy Tag Models**
   - **Issue**: DocumentTag and NotesTag models still exist alongside unified Tag model
   - **Impact**: Confusion in API endpoints and potential data inconsistency
   - **Solution**: Complete migration to unified Tag model and remove legacy models

2. **Missing Channel Partner Relationships**
   - **Issue**: Company model doesn't support channel partner hierarchy
   - **Impact**: Cannot implement channel partner revenue sharing
   - **Solution**: Add channelPartnerId field to Company model

3. **Inconsistent Naming**
   - **Issue**: Some fields use camelCase (createdBy) while database uses snake_case (created_by)
   - **Impact**: Potential confusion in database queries
   - **Solution**: Standardize naming convention across all models

4. **Missing Audit Trail Relationships**
   - **Issue**: AuditLog model has optional relationships that may not be properly enforced
   - **Impact**: Incomplete audit trail
   - **Solution**: Review and enforce required relationships based on business logic

### **Inconsistencies in Role Definitions**

1. **Role Scope Ambiguity**
   - **Issue**: Edition Admin scope is not clearly defined for cross-edition operations
   - **Impact**: Potential security vulnerabilities
   - **Solution**: Clarify scope boundaries in role definitions

2. **Permission Granularity**
   - **Issue**: Some permissions are too broad (e.g., `update:user` for company_admin)
   - **Impact**: Over-permissioning of users
   - **Solution**: Implement more granular permissions (e.g., `update:company_user`)

3. **Delegate Role Confusion**
   - **Issue**: Delegate role can be both a role type and a relationship
   - **Impact**: Confusion in permission checking
   - **Solution**: Clarify distinction between delegate role and delegate relationship

### **Missing Features**

1. **Email Service Implementation**
   - **Status**: Configuration exists but service implementation is missing
   - **Impact**: Cannot send invitations or notifications
   - **Priority**: High

2. **File Upload Storage**
   - **Status**: Multer is configured but file storage logic needs enhancement
   - **Impact**: Logo uploads may not work properly
   - **Priority**: Medium

3. **Redis Caching Layer**
   - **Status**: Redis configuration exists but caching layer is not implemented
   - **Impact**: Performance issues with frequent permission checks
   - **Priority**: Medium

4. **WebSocket Support**
   - **Status**: Not implemented
   - **Impact**: No real-time updates
   - **Priority**: Low

5. **API Documentation**
   - **Status**: Manual documentation exists but no OpenAPI/Swagger
   - **Impact**: Difficult for frontend developers to understand API
   - **Priority**: Medium

6. **Test Coverage**
   - **Status**: Jest is configured but actual test files need implementation
   - **Impact**: No automated testing
   - **Priority**: High

This backend provides a solid foundation for a multi-tenant system with comprehensive user management, configurable product editions, and robust security features. The planned enhancements will enable sophisticated access control and revenue management across multiple organizational levels. 