import { body } from 'express-validator';
import type { Request, Response } from 'express';
import type { RequestWithContext } from '../../../shared/middleware/contextResolver.js';
import { userService } from '../services/UserService.js';
import { asyncHandler } from '../../../shared/middleware/errorHandler.js';
import { 
  sendSuccess, 
  sendCreated, 
  sendNotFound, 
  sendPaginatedResponse,
  sendNoContent,
  sendBadRequest, 
  sendForbidden
} from '../../../shared/utils/response.js';
import type { CreateUserData } from '../types/index.js';

export class UserController {
  // User registration validation
  static registerValidation = [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .trim(),
    body('lastName')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .trim(),
    body('phoneNumber')
      .optional()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),
  ];

  // User login validation
  static loginValidation = [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ];

  // User update validation
  static updateValidation = [
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('firstName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .trim(),
    body('lastName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .trim(),
    // body('phoneNumber')
    //   .optional()
    //   .isMobilePhone('any')
    //   .withMessage('Please provide a valid phone number'),
  ];

  // Change password validation
  static changePasswordValidation = [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  ];

  // Create user validation (admin only)
  static createUserValidation = [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .trim(),
    body('lastName')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .trim(),
    // body('phoneNumber')
    //   .optional()
    //   .isMobilePhone('any')
    //   .withMessage('Please provide a valid phone number'),
    body('roles')
      .optional()
      .isArray()
      .withMessage('Roles must be an array of role objects'),
    body('roles.*.roleName')
      .optional()
      .isIn(['super_admin', 'edition_admin', 'company_admin', 'channel_admin', 'user', 'delegate'])
      .withMessage('Invalid role name. Must be one of: super_admin, edition_admin, company_admin, channel_admin, user, delegate'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value'),
    body('emailVerified')
      .optional()
      .isBoolean()
      .withMessage('emailVerified must be a boolean value'),
    body('expirationDate')
      .optional()
      .isISO8601()
      .withMessage('expirationDate must be a valid ISO 8601 date'),
    body('seatAssigned')
      .optional()
      .isBoolean()
      .withMessage('seatAssigned must be a boolean value'),
    body('licenseType')
      .optional()
      .isIn(['organizational_seat', 'individual_parent', 'individual_child', 'none'])
      .withMessage('Invalid license type. Must be one of: organizational_seat, individual_parent, individual_child, none'),
  ];

  // Register a new user
  static register = asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;
    
    try {
      const user = await userService.createUser(userData);
      sendCreated(res, user, 'User registered successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Login user
  static login = asyncHandler(async (req: Request, res: Response) => {
    const loginData = req.body;
    
    try {
      const result = await userService.loginUser(loginData);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Get current user profile
  static getProfile = asyncHandler(async (req: RequestWithContext, res: Response) => {
    if (!req.user) {
      sendBadRequest(res, 'User not authenticated');
      return;
    }
    const userContext = req.user?.getPlainData();

    const user = await userService.getUserById(userContext.id);
    
    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    sendSuccess(res, user, 'User profile retrieved successfully');
  });

  // Create user (admin only) - context-aware
  static createUser = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    
    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    // Role-based validation for user creation
    const requestedRoles = req.body.roles || [{ roleName: 'user' }];
    const currentUserRole = context.roleName;

    // Validate role hierarchy for each requested role
    for (const roleData of requestedRoles) {
      const requestedRole = roleData.roleName;
      
      if (currentUserRole === 'company_admin' && (requestedRole === 'super_admin' || requestedRole === 'edition_admin')) {
        return sendForbidden(res, 'Company admins can not create super admins and edition admins');
      }

      if (currentUserRole === 'edition_admin' && requestedRole === 'super_admin') {
        return sendForbidden(res, 'Edition admins cannot create super admins');
      }
    }

    // Prepare user data with context
    const userData: CreateUserData = {
      ...req.body,
      createdBy: context.userId,
      roles: requestedRoles.map((role: any) => ({
        ...role,
        systemEditionId: role.systemEditionId || context.systemEditionId,
        companyId: role.companyId || context.companyId,
      })),
    };

    // Set defaults based on role
    if (requestedRoles.length === 1 && requestedRoles[0].roleName === 'user') {
      userData.isActive = userData.isActive !== undefined ? userData.isActive : true;
      userData.emailVerified = userData.emailVerified !== undefined ? userData.emailVerified : false;
      userData.seatAssigned = userData.seatAssigned !== undefined ? userData.seatAssigned : false;
      userData.licenseType = userData.licenseType || 'none';
    }

    try {
      const newUser = await userService.createUserWithContext(userData, context);
      sendCreated(res, newUser, 'User created successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Create user with userRoles (super admin only)
  static createUserWithUserRoles = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    
    if (!context) {
      return sendBadRequest(res, 'Context resolution failed');
    }

    const userData = req.body;
    const { userRoles, ...userCreateData } = userData;

    try {
      const newUser = await userService.createUserWithUserRoles(userCreateData, userRoles, context);
      sendCreated(res, newUser, 'User created successfully with userRoles');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Get all users (admin only) - context-aware
  static getAllUsers = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req?.resolvedContext;
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const search = req.query['search'] as string;
    const roleName = req.query['roleName'] as string;
    const roleId = req.query['roleId'] as string;
    const isActive = req.query['isActive'] === 'true' ? true : req.query['isActive'] === 'false' ? false : undefined;
    const emailVerified = req.query['emailVerified'] === 'true' ? true : req.query['emailVerified'] === 'false' ? false : undefined;

    if (!context) {
      sendBadRequest(res, 'Context resolution failed');
      return;
    }

    try {
      const filters = {
        ...(search && { search }),
        ...(roleName && { roleName }),
        ...(isActive !== undefined && { isActive }),
        ...(emailVerified !== undefined && { emailVerified }),
        ...(roleId && { roleId }),
      };

      const result = await userService.getAllUsers(page, limit, filters, context);
      
      sendPaginatedResponse(
        res,
        result.users,
        { page, limit, total: result.total },
        'Users retrieved successfully'
      );
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Get user by ID (admin only) - context-aware
  static getUserById = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req?.resolvedContext;
    const { id } = req.params;
    
    if (!id) {
      sendBadRequest(res, 'User ID is required');
      return;
    }

    if (!context) {
      sendBadRequest(res, 'Context resolution failed');
      return;
    }
    
    try {
      const user = await userService.getUserById(id, context);
      
      if (!user) {
        sendNotFound(res, 'User not found');
        return;
      }

      sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Get users by system edition ID - context-aware
  static getUsersBySystemEdition = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req?.resolvedContext;
    const systemEditionId = context?.systemEditionId || req.params['systemEditionId'];
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const search = req.query['search'] as string;
    const role = req.query['role'] as string;

    if (!systemEditionId) {
      sendBadRequest(res, 'System edition ID is required');
      return;
    }

    if (!context) {
      sendBadRequest(res, 'Context resolution failed');
      return;
    }

    try {
      const filters = {
        page,
        limit,
        search,
        role: role || 'user', // Default to 'user' role
        ...(context.companyId && { companyId: context.companyId }),
      };

      const result = await userService.getUsersBySystemEdition(systemEditionId, filters, context);
      sendPaginatedResponse(res, result.users, { page, limit, total: result.total }, 'Users retrieved successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Update user profile
  static updateProfile = asyncHandler(async (req: RequestWithContext, res: Response) => {
    if (!req.user) {
      sendBadRequest(res, 'User not authenticated');
      return;
    }

    const updateData = req.body;
    
    try {
      const user = await userService.updateUser(req.user.id, updateData);
      
      if (!user) {
        sendNotFound(res, 'User not found');
        return;
      }

      sendSuccess(res, user, 'User profile updated successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Change user password
  static changePassword = asyncHandler(async (req: RequestWithContext, res: Response) => {
    if (!req.user) {
      sendBadRequest(res, 'User not authenticated');
      return;
    }

    const { currentPassword, newPassword } = req.body;
    
    try {
      await userService.changePassword(req.user.id, currentPassword, newPassword);
      sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Update user by ID (admin only) - context-aware
  static updateUser = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req?.resolvedContext;
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id) {
      sendBadRequest(res, 'User ID is required');
      return;
    }

    if (!context) {
      sendBadRequest(res, 'Context resolution failed');
      return;
    }
    
    try {
      const user = await userService.updateUser(id, updateData, context);
      
      if (!user) {
        sendNotFound(res, 'User not found');
        return;
      }

      sendSuccess(res, user, 'User updated successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Delete user by ID (admin only) - context-aware
  static deleteUser = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req?.resolvedContext;
    const { id } = req.params;
    
    if (!id) {
      sendBadRequest(res, 'User ID is required');
      return;
    }

    if (!context) {
      sendBadRequest(res, 'Context resolution failed');
      return;
    }

    // Check if the current user has permission to delete users
    const currentUserRole = context.roleName;
    
    if (currentUserRole === 'user' || currentUserRole === 'delegate') {
      return sendForbidden(res, 'Users and delegates cannot delete other users');
    }

    // Get the target user to check permissions
    try {
      const targetUser = await userService.getUserById(id, context);
      
      if (!targetUser) {
        sendNotFound(res, 'User not found');
        return;
      }

      // Role-based permission checks
      if (currentUserRole === 'company_admin') {
        // Company admins can only delete users from their own company
        if (targetUser.activeRole?.companyId !== context.companyId) {
          return sendForbidden(res, 'Company admins can only delete users from their own company');
        }
        // Company admins cannot delete other company admins or higher roles
        if (targetUser.activeRole?.roleName && ['edition_admin', 'super_admin'].includes(targetUser.activeRole.roleName)) {
          return sendForbidden(res, 'Company admins cannot delete users with edition_admin or super_admin role');
        }
      } else if (currentUserRole === 'edition_admin') {
        // Edition admins can only delete users from their system edition
        if (targetUser.activeRole?.systemEditionId !== context.systemEditionId) {
          return sendForbidden(res, 'Edition admins can only delete users from their system edition');
        }
        // Edition admins cannot delete other edition admins or super admins
        if (targetUser.activeRole?.roleName && ['edition_admin', 'super_admin'].includes(targetUser.activeRole.roleName)) {
          return sendForbidden(res, 'Edition admins cannot delete users with edition_admin role or higher');
        }
      }
      // Super admins can delete any user (no additional checks needed)

      const deleted = await userService.deleteUser(id, context);
      
      if (!deleted) {
        sendNotFound(res, 'User not found');
        return;
      }

      sendNoContent(res);
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // Start emulating a user (super admin only)
  static startEmulation = asyncHandler(async (req: RequestWithContext, res: Response) => {
    if (!req.user) {
      sendBadRequest(res, 'User not authenticated');
      return;
    }
    const user = req.user.getPlainData();

    const { id: targetUserId } = req.params;
    
    if (!targetUserId) {
      sendBadRequest(res, 'Target user ID is required');
      return;
    }

    try {
      const result = await userService.startEmulation(user.id, targetUserId, req.user);
      sendSuccess(res, result, 'Emulation started successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });

  // End current emulation and return to original user
  static endEmulation = asyncHandler(async (req: RequestWithContext, res: Response) => {
    if (!req.user) {
      sendBadRequest(res, 'User not authenticated');
      return;
    }

    if (!req.user.isEmulating || !req.user.originalUser) {
      sendBadRequest(res, 'Not currently in emulation mode');
      return;
    }

    try {
      const result = await userService.endEmulation(req.user);
      sendSuccess(res, result, 'Emulation ended successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
      } else {
        throw error;
      }
    }
  });


}

export default UserController; 