import { body } from 'express-validator';
import type { Response } from 'express';
import { asyncHandler } from '../../../shared/middleware/errorHandler.js';
import { 
  sendSuccess, 
  sendCreated,
  sendNoContent,
  sendBadRequest,
  sendPaginatedResponse
} from '../../../shared/utils/response.js';
import { roleService } from '../services/RoleService.js';
import type { RoleFilters } from '../types/index.js';

// Role validation
export const roleValidation = [
  body('name')
    .isLength({ min: 1, max: 50 })
    .withMessage('Role name must be between 1 and 50 characters')
    .matches(/^[a-z_]+$/)
    .withMessage('Role name must contain only lowercase letters and underscores')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .trim(),
  body('accessScope')
    .isIn(['GLOBAL', 'EDITION', 'COMPANY', 'SELF'])
    .withMessage('Access scope must be one of: GLOBAL, EDITION, COMPANY, SELF'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

// Get all roles with filtering
export const getAllRoles = asyncHandler(async (req: any, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const search = req.query['search'] as string | undefined;
  const name = req.query['name'] as string | undefined;
  const accessScope = req.query['accessScope'] as 'GLOBAL' | 'EDITION' | 'COMPANY' | 'SELF' | undefined;
  const isActive = req.query['isActive'] === 'true' ? true : req.query['isActive'] === 'false' ? false : undefined;

  const filters: RoleFilters = {
    page,
    limit,
    search,
    name,
    accessScope,
    isActive,
  };

  const result = await roleService.getAllRoles(filters);

  sendPaginatedResponse(
    res,
    result.roles,
    { page, limit, total: result.total },
    'Roles retrieved successfully'
  );
});

// Get role by ID
export const getRoleById = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;

  const role = await roleService.getRoleById(id);

  sendSuccess(res, role, 'Role retrieved successfully');
});

// Create new role
export const createRole = asyncHandler(async (req: any, res: Response) => {
  const roleData = req.body;

  const role = await roleService.createRole(roleData);

  sendCreated(res, role, 'Role created successfully');
});

// Update role
export const updateRole = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const role = await roleService.updateRole(id, updateData);

  sendSuccess(res, role, 'Role updated successfully');
});

// Delete role
export const deleteRole = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;

  await roleService.deleteRole(id);

  sendNoContent(res);
});

// Get role statistics
export const getRoleStats = asyncHandler(async (_req: any, res: Response) => {
  const stats = await roleService.getRoleStats();

  sendSuccess(res, stats, 'Role statistics retrieved successfully');
});

// Get roles by access scope
export const getRolesByScope = asyncHandler(async (req: any, res: Response) => {
  const { scope } = req.params;

  if (!['GLOBAL', 'EDITION', 'COMPANY', 'SELF'].includes(scope)) {
    return sendBadRequest(res, 'Invalid access scope. Must be one of: GLOBAL, EDITION, COMPANY, SELF');
  }

  const roles = await roleService.getRolesByScope(scope as 'GLOBAL' | 'EDITION' | 'COMPANY' | 'SELF');

  sendSuccess(res, roles, `Roles with ${scope} access scope retrieved successfully`);
});

// Check if role name exists
export const checkRoleNameExists = asyncHandler(async (req: any, res: Response) => {
  const { name } = req.params;

  const exists = await roleService.roleExists(name);

  sendSuccess(res, { exists, name }, 'Role name check completed');
});
