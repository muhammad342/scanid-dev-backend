# ResolveContext Implementation Guide

## Overview

This guide provides a comprehensive approach to implementing the `resolveContext` middleware pattern across all API modules. The `resolveContext` middleware centralizes access control logic and ensures consistent context resolution based on user roles.

## Table of Contents

1. [Understanding ResolveContext](#understanding-resolvecontext)
2. [Implementation Patterns](#implementation-patterns)
3. [Step-by-Step Migration Strategy](#step-by-step-migration-strategy)
4. [Best Practices](#best-practices)
5. [Postman Collection Integration](#postman-collection-integration)
6. [Common Patterns and Examples](#common-patterns-and-examples)
7. [Testing Guidelines](#testing-guidelines)
8. [Troubleshooting](#troubleshooting)

## Understanding ResolveContext

### What is ResolveContext?

`resolveContext` is a middleware that automatically resolves and validates access context based on user roles. It ensures that users can only access data within their authorized scope.

### Context Resolution by Role

| Role | System Edition Access | Company Access | Context Source |
|------|---------------------|----------------|----------------|
| **Super Admin** | Any edition | Any company | URL params/query |
| **Edition Admin** | Assigned edition only | Companies in their edition | JWT token + validation |
| **Company Admin** | Inherited from company | Assigned company only | JWT token |
| **User** | Inherited from company | Assigned company only | JWT token |
| **Delegate** | Inherited from company | Assigned company only | JWT token |

### Resolved Context Structure

```typescript
interface ResolvedContext {
  companyId?: string;
  systemEditionId?: string;
  role: string;
  userId: string;
  isEmulating: boolean;
}
```

## Implementation Patterns

### 1. Route Layer Pattern

**File**: `src/modules/{moduleName}/routes/{moduleName}Routes.ts`

```typescript
import { Router } from 'express';
import { authenticateToken, authorize } from '../../../shared/middleware/auth.js';
import { resolveContext } from '../../../shared/middleware/contextResolver.js';
import { controllerMethods } from '../controllers/{moduleName}Controller.js';

const router = Router();

// Apply authentication and context resolution to all routes
router.use(authenticateToken);
router.use(resolveContext);

// Define routes with proper authorization
router.get('/', authorize('super_admin', 'edition_admin', 'company_admin'), controllerMethods.getAll);
router.get('/:id', authorize('super_admin', 'edition_admin', 'company_admin'), controllerMethods.getById);
router.post('/', authorize('super_admin', 'edition_admin'), controllerMethods.create);
router.put('/:id', authorize('super_admin', 'edition_admin'), controllerMethods.update);
router.delete('/:id', authorize('super_admin', 'edition_admin'), controllerMethods.delete);

export default router;
```

### 2. Controller Layer Pattern

**File**: `src/modules/{moduleName}/controllers/{moduleName}Controller.ts`

```typescript
import { Response } from 'express';
import { asyncHandler } from '../../../shared/middleware/errorHandler.js';
import { sendBadRequest, sendSuccess, sendPaginatedResponse } from '../../../shared/utils/response.js';
import { moduleService } from '../services/{moduleName}Service.js';
import { RequestWithContext } from '../../../shared/middleware/contextResolver.js';
import type { ModuleFilters, CreateModuleData } from '../types/index.js';

export class ModuleController {
  // Get all items with filtering
  static getAll = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    const filters: ModuleFilters = {
      page: parseInt(req.query['page'] as string) || 1,
      limit: parseInt(req.query['limit'] as string) || 10,
      search: req.query['search'] as string | undefined,
      systemEditionId: context.systemEditionId,
      companyId: context.companyId,
    };

    const result = await moduleService.getAll(filters);

    sendPaginatedResponse(
      res,
      result.items,
      { page: filters.page, limit: filters.limit, total: result.total },
      'Items retrieved successfully'
    );
  });

  // Get item by ID
  static getById = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    const { id } = req.params;

    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    const item = await moduleService.getById(id, context.systemEditionId, context.companyId);
    
    sendSuccess(res, item, 'Item retrieved successfully');
  });

  // Create new item
  static create = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    
    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    const data: CreateModuleData = {
      ...req.body,
      systemEditionId: context.systemEditionId,
      companyId: context.companyId,
      createdBy: context.userId,
    };

    const newItem = await moduleService.create(data);
    
    sendSuccess(res, newItem, 'Item created successfully', 201);
  });

  // Update item
  static update = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    const { id } = req.params;

    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    const updatedItem = await moduleService.update(id, req.body, context.systemEditionId, context.companyId);
    
    sendSuccess(res, updatedItem, 'Item updated successfully');
  });

  // Delete item
  static delete = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    const { id } = req.params;

    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    await moduleService.delete(id, context.systemEditionId, context.companyId);
    
    sendSuccess(res, null, 'Item deleted successfully');
  });
}
```

### 3. Service Layer Pattern

**File**: `src/modules/{moduleName}/services/{moduleName}Service.ts`

```typescript
import { Op, WhereOptions } from 'sequelize';
import { Module } from '../../../models/Module/index.js';
import { logger } from '../../../shared/utils/logger.js';
import type { ModuleFilters, CreateModuleData } from '../types/index.js';

export class ModuleService {
  // Get all items with filtering
  async getAll(filters: ModuleFilters): Promise<{ items: any[]; total: number; totalPages: number }> {
    const offset = ((filters.page || 1) - 1) * (filters.limit || 10);
    const whereClause: WhereOptions = {};

    // Apply context filters
    if (filters.systemEditionId) {
      whereClause['systemEditionId'] = filters.systemEditionId;
    }

    if (filters.companyId) {
      whereClause['companyId'] = filters.companyId;
    }

    // Apply search filter
    if (filters.search) {
      (whereClause as any)[Op.or] = [
        { name: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    const { rows: items, count: total } = await Module.findAndCountAll({
      where: whereClause,
      limit: filters.limit || 10,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      items: items.map(item => item.get({ plain: true })),
      total,
      totalPages: Math.ceil(total / (filters.limit || 10)),
    };
  }

  // Get item by ID with context validation
  async getById(id: string, systemEditionId: string, companyId?: string): Promise<any> {
    const whereClause: WhereOptions = {
      id,
      systemEditionId,
    };

    if (companyId) {
      whereClause['companyId'] = companyId;
    }

    const item = await Module.findOne({ where: whereClause });
    
    if (!item) {
      throw new Error('Item not found');
    }

    return item.get({ plain: true });
  }

  // Create new item
  async create(data: CreateModuleData): Promise<any> {
    try {
      const newItem = await Module.create(data);
      return newItem.get({ plain: true });
    } catch (error) {
      logger.error('Failed to create item:', error);
      throw error;
    }
  }

  // Update item with context validation
  async update(id: string, data: any, systemEditionId: string, companyId?: string): Promise<any> {
    const whereClause: WhereOptions = {
      id,
      systemEditionId,
    };

    if (companyId) {
      whereClause['companyId'] = companyId;
    }

    const item = await Module.findOne({ where: whereClause });
    
    if (!item) {
      throw new Error('Item not found');
    }

    await item.update(data);
    return item.get({ plain: true });
  }

  // Delete item with context validation
  async delete(id: string, systemEditionId: string, companyId?: string): Promise<void> {
    const whereClause: WhereOptions = {
      id,
      systemEditionId,
    };

    if (companyId) {
      whereClause['companyId'] = companyId;
    }

    const deletedCount = await Module.destroy({ where: whereClause });
    
    if (deletedCount === 0) {
      throw new Error('Item not found');
    }
  }
}

export const moduleService = new ModuleService();
```

### 4. Types Layer Pattern

**File**: `src/modules/{moduleName}/types/index.ts`

```typescript
export interface PaginationFilters {
  page?: number;
  limit?: number;
  search?: string | undefined;
}

export interface ModuleFilters extends PaginationFilters {
  systemEditionId?: string | undefined;
  companyId?: string | undefined;
  // Add module-specific filters here
}

export interface CreateModuleData {
  systemEditionId: string;
  companyId?: string;
  createdBy: string;
  // Add module-specific fields here
}

export interface UpdateModuleData {
  // Add module-specific update fields here
}
```

## Step-by-Step Migration Strategy

### Phase 1: Analysis and Planning

1. **Identify Target Modules**
   ```bash
   # List all modules that need migration
   ls src/modules/
   ```

2. **Audit Current Implementation**
   - Review existing route patterns
   - Identify manual context resolution
   - Document current authorization patterns

3. **Plan Migration Order**
   - Start with simpler modules (fewer dependencies)
   - Prioritize modules with manual context handling
   - Consider dependencies between modules

### Phase 2: Implementation

1. **Update Route Layer**
   ```typescript
   // Before
   router.get('/', authenticateToken, authorize('super_admin'), getItems);
   
   // After
   router.use(authenticateToken);
   router.use(resolveContext);
   router.get('/', authorize('super_admin'), getItems);
   ```

2. **Update Controller Layer**
   ```typescript
   // Before
   export const getItems = asyncHandler(async (req: RequestWithUser, res: Response) => {
     const systemEditionId = req.params.systemEditionId || req.user.systemEditionId;
     // Manual context resolution...
   });
   
   // After
   export const getItems = asyncHandler(async (req: RequestWithContext, res: Response) => {
     const context = req.resolvedContext;
     if (!context?.systemEditionId) {
       return sendBadRequest(res, 'System edition ID is required');
     }
     // Use resolved context...
   });
   ```

3. **Update Service Layer**
   ```typescript
   // Before
   async getAll(filters: any): Promise<any> {
     const whereClause = { systemEditionId: filters.systemEditionId };
     // Manual filtering...
   }
   
   // After
   async getAll(filters: ModuleFilters): Promise<any> {
     const whereClause: WhereOptions = {};
     if (filters.systemEditionId) {
       whereClause['systemEditionId'] = filters.systemEditionId;
     }
     if (filters.companyId) {
       whereClause['companyId'] = filters.companyId;
     }
     // Consistent filtering...
   }
   ```

4. **Update Types**
   ```typescript
   // Before
   interface Filters {
     page?: number;
     limit?: number;
   }
   
   // After
   interface ModuleFilters extends PaginationFilters {
     systemEditionId?: string;
     companyId?: string;
   }
   ```

### Phase 3: Testing and Validation

1. **Unit Tests**
   ```typescript
   describe('Module with resolveContext', () => {
     it('should use resolved context', async () => {
       const mockContext = {
         systemEditionId: 'test-edition-id',
         companyId: 'test-company-id',
         role: 'company_admin',
         userId: 'test-user-id',
         isEmulating: false,
       };
       
       const req = {
         resolvedContext: mockContext,
         // ... other request properties
       } as RequestWithContext;
       
       // Test implementation
     });
   });
   ```

2. **Integration Tests**
   ```typescript
   describe('Module API Integration', () => {
     it('should handle context resolution correctly', async () => {
       // Test complete middleware chain
       const response = await request(app)
         .get('/api/v1/module')
         .set('Authorization', `Bearer ${token}`)
         .expect(200);
       
       // Verify response contains expected data
     });
   });
   ```

## Best Practices

### 1. Consistent Error Handling

```typescript
// Always check for required context
if (!context?.systemEditionId) {
  return sendBadRequest(res, 'System edition ID is required');
}

// Use specific error messages
if (!context?.companyId && context?.role !== 'super_admin') {
  return sendBadRequest(res, 'Company ID is required for this operation');
}
```

### 2. Type Safety

```typescript
// Always use RequestWithContext type
export const handler = asyncHandler(async (req: RequestWithContext, res: Response) => {
  // Implementation
});

// Use proper filter types
const filters: ModuleFilters = {
  systemEditionId: context.systemEditionId,
  companyId: context.companyId,
  // ... other filters
};
```

### 3. Service Layer Consistency

```typescript
// Always use WhereOptions for database queries
const whereClause: WhereOptions = {};

// Apply context filters consistently
if (filters.systemEditionId) {
  whereClause['systemEditionId'] = filters.systemEditionId;
}

if (filters.companyId) {
  whereClause['companyId'] = filters.companyId;
}
```

### 4. Response Format Consistency

```typescript
// Use shared response utilities
import { sendSuccess, sendBadRequest, sendPaginatedResponse } from '../../../shared/utils/response.js';

// Consistent response format
sendSuccess(res, data, 'Operation completed successfully');
sendPaginatedResponse(res, items, pagination, 'Items retrieved successfully');
```

### 5. Logging and Monitoring

```typescript
// Log context resolution issues
if (!context?.systemEditionId) {
  logger.warn('Missing system edition ID in context', {
    userId: req.user?.id,
    role: req.user?.role,
    path: req.path,
  });
  return sendBadRequest(res, 'System edition ID is required');
}
```

## Postman Collection Integration

### 1. Collection Structure

```json
{
  "info": {
    "name": "Module Name",
    "description": "API endpoints for managing module resources",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Items",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/module?page=1&limit=10",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "module"],
          "query": [
            {
              "key": "page",
              "value": "1",
              "description": "Page number (default: 1)"
            },
            {
              "key": "limit",
              "value": "10",
              "description": "Items per page (default: 10)"
            },
            {
              "key": "search",
              "value": "",
              "description": "Search term",
              "disabled": true
            }
          ]
        },
        "description": "Get all items with filtering and pagination. Access is scoped by user role:\n- Super Admin: Can see all items\n- Edition Admin: Can see items in their edition\n- Company Admin: Can see items in their company\n- User: Can see items in their company"
      },
      "response": [
        {
          "name": "Success Response",
          "originalRequest": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/v1/module?page=1&limit=10"
            }
          },
          "status": "OK",
          "code": 200,
          "_postman_previewlanguage": "json",
          "header": [
            {
              "key": "Content-Type",
              "value": "application/json"
            }
          ],
          "body": {
            "success": true,
            "message": "Items retrieved successfully",
            "data": [
              {
                "id": "uuid",
                "systemEditionId": "uuid",
                "companyId": "uuid",
                "name": "Item Name",
                "description": "Item Description",
                "createdAt": "2024-01-01T00:00:00.000Z",
                "updatedAt": "2024-01-01T00:00:00.000Z"
              }
            ],
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
        }
      ]
    }
  ]
}
```

### 2. Environment Variables

```json
{
  "id": "environment-id",
  "name": "Module Environment",
  "values": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "type": "default",
      "enabled": true
    },
    {
      "key": "token",
      "value": "your-jwt-token-here",
      "type": "secret",
      "enabled": true
    },
    {
      "key": "systemEditionId",
      "value": "your-system-edition-id",
      "type": "default",
      "enabled": true
    },
    {
      "key": "companyId",
      "value": "your-company-id",
      "type": "default",
      "enabled": true
    }
  ]
}
```

### 3. Collection Generation Script

```typescript
// scripts/generate-postman-collection.ts
import fs from 'fs';
import path from 'path';

interface Endpoint {
  name: string;
  method: string;
  path: string;
  description: string;
  queryParams?: Array<{ key: string; description: string; required?: boolean }>;
  bodyParams?: Array<{ key: string; type: string; description: string; required?: boolean }>;
  responses?: Array<{ name: string; status: number; body: any }>;
}

function generatePostmanCollection(moduleName: string, endpoints: Endpoint[]): any {
  const items = endpoints.map(endpoint => ({
    name: endpoint.name,
    request: {
      method: endpoint.method,
      header: [
        {
          key: "Authorization",
          value: "Bearer {{token}}",
          type: "text"
        }
      ],
      url: {
        raw: `{{baseUrl}}${endpoint.path}`,
        host: ["{{baseUrl}}"],
        path: endpoint.path.split('/').filter(Boolean),
        query: endpoint.queryParams?.map(param => ({
          key: param.key,
          value: "",
          description: param.description,
          disabled: !param.required
        })) || []
      },
      description: endpoint.description
    },
    response: endpoint.responses || []
  }));

  return {
    info: {
      name: moduleName,
      description: `API endpoints for managing ${moduleName} resources`,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: items
  };
}

// Usage example
const moduleEndpoints: Endpoint[] = [
  {
    name: "Get All Items",
    method: "GET",
    path: "/api/v1/module",
    description: "Get all items with filtering and pagination",
    queryParams: [
      { key: "page", description: "Page number (default: 1)" },
      { key: "limit", description: "Items per page (default: 10)" },
      { key: "search", description: "Search term", required: false }
    ]
  }
  // Add more endpoints...
];

const collection = generatePostmanCollection("Module Name", moduleEndpoints);
fs.writeFileSync(
  path.join(__dirname, '../postman-collection/ModuleName.json'),
  JSON.stringify(collection, null, 2)
);
```

## Common Patterns and Examples

### 1. CRUD Operations Pattern

```typescript
// Complete CRUD implementation with resolveContext
export class CRUDController {
  static getAll = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    const filters = {
      page: parseInt(req.query['page'] as string) || 1,
      limit: parseInt(req.query['limit'] as string) || 10,
      search: req.query['search'] as string | undefined,
      systemEditionId: context.systemEditionId,
      companyId: context.companyId,
    };

    const result = await service.getAll(filters);
    sendPaginatedResponse(res, result.items, { page: filters.page, limit: filters.limit, total: result.total }, 'Items retrieved successfully');
  });

  static getById = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    const { id } = req.params;

    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    const item = await service.getById(id, context.systemEditionId, context.companyId);
    sendSuccess(res, item, 'Item retrieved successfully');
  });

  static create = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    
    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    const data = {
      ...req.body,
      systemEditionId: context.systemEditionId,
      companyId: context.companyId,
      createdBy: context.userId,
    };

    const newItem = await service.create(data);
    sendSuccess(res, newItem, 'Item created successfully', 201);
  });

  static update = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    const { id } = req.params;

    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    const updatedItem = await service.update(id, req.body, context.systemEditionId, context.companyId);
    sendSuccess(res, updatedItem, 'Item updated successfully');
  });

  static delete = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    const { id } = req.params;

    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    await service.delete(id, context.systemEditionId, context.companyId);
    sendSuccess(res, null, 'Item deleted successfully');
  });
}
```

### 2. Search and Filter Pattern

```typescript
// Advanced search and filtering with resolveContext
export class SearchController {
  static search = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    
    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    const filters = {
      page: parseInt(req.query['page'] as string) || 1,
      limit: parseInt(req.query['limit'] as string) || 10,
      search: req.query['search'] as string | undefined,
      category: req.query['category'] as string | undefined,
      status: req.query['status'] as string | undefined,
      dateFrom: req.query['dateFrom'] as string | undefined,
      dateTo: req.query['dateTo'] as string | undefined,
      systemEditionId: context.systemEditionId,
      companyId: context.companyId,
    };

    const result = await service.search(filters);
    sendPaginatedResponse(res, result.items, { page: filters.page, limit: filters.limit, total: result.total }, 'Search completed successfully');
  });
}
```

### 3. Bulk Operations Pattern

```typescript
// Bulk operations with resolveContext
export class BulkController {
  static bulkCreate = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    
    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    const items = req.body.items.map((item: any) => ({
      ...item,
      systemEditionId: context.systemEditionId,
      companyId: context.companyId,
      createdBy: context.userId,
    }));

    const createdItems = await service.bulkCreate(items);
    sendSuccess(res, createdItems, 'Items created successfully', 201);
  });

  static bulkUpdate = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    
    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    const { ids, updates } = req.body;
    const updatedItems = await service.bulkUpdate(ids, updates, context.systemEditionId, context.companyId);
    sendSuccess(res, updatedItems, 'Items updated successfully');
  });

  static bulkDelete = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    
    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    const { ids } = req.body;
    await service.bulkDelete(ids, context.systemEditionId, context.companyId);
    sendSuccess(res, null, 'Items deleted successfully');
  });
}
```

## Testing Guidelines

### 1. Unit Testing with Mocked Context

```typescript
// __tests__/moduleController.test.ts
import { ModuleController } from '../controllers/moduleController.js';
import { RequestWithContext } from '../../../shared/middleware/contextResolver.js';

describe('ModuleController', () => {
  let mockReq: Partial<RequestWithContext>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      resolvedContext: {
        systemEditionId: 'test-edition-id',
        companyId: 'test-company-id',
        role: 'company_admin',
        userId: 'test-user-id',
        isEmulating: false,
      },
      params: {},
      query: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getAll', () => {
    it('should return items with resolved context', async () => {
      mockReq.query = { page: '1', limit: '10' };
      
      await ModuleController.getAll(mockReq as RequestWithContext, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
        })
      );
    });

    it('should return error when system edition ID is missing', async () => {
      mockReq.resolvedContext = {
        ...mockReq.resolvedContext!,
        systemEditionId: undefined,
      };
      
      await ModuleController.getAll(mockReq as RequestWithContext, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'System edition ID is required',
        })
      );
    });
  });
});
```

### 2. Integration Testing

```typescript
// __tests__/module.integration.test.ts
import request from 'supertest';
import { app } from '../../core/app.js';
import { createTestUser, createTestToken } from '../testUtils.js';

describe('Module API Integration', () => {
  let superAdminToken: string;
  let editionAdminToken: string;
  let companyAdminToken: string;
  let userToken: string;

  beforeAll(async () => {
    superAdminToken = await createTestToken('super_admin');
    editionAdminToken = await createTestToken('edition_admin');
    companyAdminToken = await createTestToken('company_admin');
    userToken = await createTestToken('user');
  });

  describe('GET /api/v1/module', () => {
    it('should return items for super admin', async () => {
      const response = await request(app)
        .get('/api/v1/module')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return items for edition admin', async () => {
      const response = await request(app)
        .get('/api/v1/module')
        .set('Authorization', `Bearer ${editionAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return items for company admin', async () => {
      const response = await request(app)
        .get('/api/v1/module')
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return items for user', async () => {
      const response = await request(app)
        .get('/api/v1/module')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/v1/module')
        .expect(401);
    });
  });
});
```

### 3. Context Resolution Testing

```typescript
// __tests__/contextResolution.test.ts
import { resolveContext } from '../shared/middleware/contextResolver.js';
import { RequestWithContext } from '../shared/middleware/contextResolver.js';

describe('Context Resolution', () => {
  it('should resolve context for super admin', async () => {
    const req = {
      user: {
        id: 'user-id',
        role: 'super_admin',
        systemEditionId: null,
        companyId: null,
      },
      params: { systemEditionId: 'edition-id' },
      query: {},
      body: {},
    } as RequestWithContext;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    const next = jest.fn();

    await resolveContext(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.resolvedContext).toEqual({
      systemEditionId: 'edition-id',
      role: 'super_admin',
      userId: 'user-id',
      isEmulating: false,
    });
  });

  it('should resolve context for edition admin', async () => {
    const req = {
      user: {
        id: 'user-id',
        role: 'edition_admin',
        systemEditionId: 'edition-id',
        companyId: null,
      },
      params: {},
      query: {},
      body: {},
    } as RequestWithContext;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    const next = jest.fn();

    await resolveContext(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.resolvedContext).toEqual({
      systemEditionId: 'edition-id',
      role: 'edition_admin',
      userId: 'user-id',
      isEmulating: false,
    });
  });
});
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Missing System Edition ID

**Issue**: `System edition ID is required` error

**Solution**: Ensure the user has a valid `systemEditionId` in their JWT token or provide it in the request parameters for super admin.

```typescript
// Check user token
console.log('User token:', req.user);

// For super admin, provide systemEditionId in params/query
GET /api/v1/module?systemEditionId=edition-id
```

#### 2. Context Not Resolved

**Issue**: `req.resolvedContext` is undefined

**Solution**: Ensure `resolveContext` middleware is applied in the correct order.

```typescript
// Correct order
router.use(authenticateToken);
router.use(resolveContext);
router.get('/', authorize('super_admin'), handler);
```

#### 3. Authorization Conflicts

**Issue**: Authorization middleware conflicts with context resolution

**Solution**: Ensure proper middleware order and role definitions.

```typescript
// Check role definitions in acl/permissions/roleDefinitions.ts
// Ensure roles are properly defined for the endpoint
```

#### 4. Database Query Issues

**Issue**: Queries returning unexpected results

**Solution**: Verify context filters are applied correctly in service layer.

```typescript
// Debug service queries
console.log('Where clause:', whereClause);
console.log('Context:', context);
```

#### 5. TypeScript Errors

**Issue**: Type errors with `RequestWithContext`

**Solution**: Ensure proper imports and type definitions.

```typescript
// Correct import
import { RequestWithContext } from '../../../shared/middleware/contextResolver.js';

// Use in function signature
export const handler = asyncHandler(async (req: RequestWithContext, res: Response) => {
  // Implementation
});
```

### Debugging Tools

#### 1. Context Debugging Middleware

```typescript
// Add this middleware for debugging
export const debugContext = (req: RequestWithContext, res: Response, next: NextFunction) => {
  console.log('=== Context Debug ===');
  console.log('User:', req.user);
  console.log('Resolved Context:', req.resolvedContext);
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  console.log('===================');
  next();
};

// Use in routes for debugging
router.use(debugContext);
```

#### 2. Logging Context Resolution

```typescript
// Enhanced logging in contextResolver
export const resolveContext = async (req: RequestWithContext, res: Response, next: NextFunction) => {
  try {
    logger.info('Resolving context', {
      userId: req.user?.id,
      role: req.user?.role,
      path: req.path,
      method: req.method,
    });

    // ... context resolution logic ...

    logger.info('Context resolved', {
      userId: req.user?.id,
      resolvedContext: req.resolvedContext,
    });

    next();
  } catch (error) {
    logger.error('Context resolution failed', {
      userId: req.user?.id,
      error: error.message,
    });
    // ... error handling ...
  }
};
```

## Conclusion

This implementation guide provides a comprehensive approach to integrating `resolveContext` across all API modules. By following these patterns and best practices, you can ensure consistent, secure, and maintainable code across your entire codebase.

### Key Takeaways

1. **Consistency**: Use the same patterns across all modules
2. **Type Safety**: Always use proper TypeScript types
3. **Error Handling**: Implement consistent error handling
4. **Testing**: Write comprehensive tests for all scenarios
5. **Documentation**: Keep Postman collections updated
6. **Security**: Validate context at every layer

### Next Steps

1. Apply this pattern to existing modules
2. Update Postman collections for all modules
3. Implement comprehensive testing
4. Monitor and optimize performance
5. Document any deviations from the pattern

This guide serves as the foundation for automated refactoring and ensures reliable replication of the `resolveContext` pattern across your entire codebase. 