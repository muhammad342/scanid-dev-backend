import { body } from 'express-validator';
import type { Request, Response } from 'express';
import type { RequestWithUser } from '../../../shared/types/common.js';
import { systemEditionService } from '../services/SystemEditionService.js';
import { tagService } from '../../tags/services/TagService.js';
import { asyncHandler } from '../../../shared/middleware/errorHandler.js';
import { 
  sendSuccess, 
  sendCreated, 
  sendNotFound, 
  sendPaginatedResponse,
  sendNoContent,
  sendBadRequest 
} from '../../../shared/utils/response.js';
import { userService } from '../../users/services/UserService.js';
import { Company } from '../../../models/Company/index.js';

// System Edition validation
export const systemEditionValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Edition name must be between 2 and 100 characters')
    .trim(),
  body('modules')
    .isObject()
    .withMessage('Modules must be an object')
    .optional(),
  body('archived')
    .isBoolean()
    .withMessage('Archived must be a boolean')
    .optional(),
];

// Merge tags validation
export const mergeTagsValidation = [
  body('sourceTagIds')
    .isArray({ min: 2 })
    .withMessage('sourceTagIds must be an array with at least 2 tags')
    .custom((value) => {
      if (!value.every((id: any) => typeof id === 'string' && id.length > 0)) {
        throw new Error('All sourceTagIds must be non-empty strings');
      }
      return true;
    }),
  body('targetTagId')
    .optional()
    .isUUID()
    .withMessage('targetTagId must be a valid UUID'),
  body('newTagName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('newTagName must be between 1 and 100 characters')
    .trim(),
  body()
    .custom((value) => {
      if (!value.targetTagId && !value.newTagName) {
        throw new Error('Either targetTagId or newTagName must be provided');
      }
      return true;
    }),
];

// Get all system editions with filtering
export const getAllSystemEditions = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const editionName = req.query['editionName'] as string;
  const archived = req.query['archived'] === 'true';

  const result = await systemEditionService.getAllSystemEditions({
    page,
    limit,
    editionName,
    archived,
  });

  sendPaginatedResponse(
    res,
    result.systemEditions,
    { page, limit, total: result.total },
    'System editions retrieved successfully'
  );
});

// Get system edition by ID
export const getSystemEditionById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const systemEdition = await systemEditionService.getSystemEditionById(id);

  if (!systemEdition) {
    sendNotFound(res, 'System edition not found');
    return;
  }

  sendSuccess(res, systemEdition, 'System edition retrieved successfully');
});

export const getEditionAdminSystemEdition = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const systemEditionId = req.user?.systemEditionId;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const systemEdition = await systemEditionService.getSystemEditionById(systemEditionId);

  if (!systemEdition) {
    sendNotFound(res, 'System edition not found');
    return;
  }

  sendSuccess(res, systemEdition, 'System edition retrieved successfully');
});

// Create system edition
export const createSystemEdition = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  
  const systemEditionData = {
    ...req.body,
    createdBy: userId,
    lastUpdatedBy: userId
  };

  try {
    const systemEdition = await systemEditionService.createSystemEdition(systemEditionData);
    sendCreated(res, systemEdition, 'System edition created successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Update system edition
export const updateSystemEdition = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const userId = req.user?.id;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  try {
    const systemEditionData = {
      ...updateData,
      lastUpdatedBy: userId
    };
    const systemEdition = await systemEditionService.updateSystemEdition(id, systemEditionData);

    if (!systemEdition) {
      sendNotFound(res, 'System edition not found');
      return;
    }

    sendSuccess(res, systemEdition, 'System edition updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Edition Admin Update system edition
export const updateEditionAdminSystemEdition = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const updateData = req.body;
  const userId = req.user?.id;

  const systemEditionId = req.user?.systemEditionId;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found');
    return;
  }

  try {
    const systemEditionData = {
      ...updateData,
      lastUpdatedBy: userId
    };
    const systemEdition = await systemEditionService.updateSystemEdition(systemEditionId, systemEditionData);

    if (!systemEdition) {
      sendNotFound(res, 'System edition not found');
      return;
    }

    sendSuccess(res, systemEdition, 'System edition updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Delete system edition
export const deleteSystemEdition = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const success = await systemEditionService.deleteSystemEdition(id, userId || '');

  if (!success) {
    sendNotFound(res, 'System edition not found');
    return;
  }

  sendNoContent(res);
});

// Get system edition overview
export const getSystemEditionOverview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const overview = await systemEditionService.getSystemEditionOverview(id);

  if (!overview) {
    sendNotFound(res, 'System edition not found');
    return;
  }

  sendSuccess(res, overview, 'System edition overview retrieved successfully');
});

// Get system edition companies
export const getSystemEditionCompanies = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const search = req.query['search'] as string;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const result = await systemEditionService.getSystemEditionCompanies(id, {
    page,
    limit,
    search,
  });

  sendPaginatedResponse(
    res,
    result.companies,
    { page, limit, total: result.total },
    'System edition companies retrieved successfully'
  );
});

// Get system edition users
export const getSystemEditionUsers = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const search = req.query['search'] as string;
  const role = req.query['role'] as string;

  console.log('Backend - System Edition ID:', id);
  console.log('Backend - Role parameter:', role);
  console.log('Backend - All query params:', req.query);

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const result = await systemEditionService.getSystemEditionUsers(id, {
    page,
    limit,
    search,
    role,
  });

  console.log('Backend - Result users count:', result.users.length);
  console.log('Backend - Result users roles:', result.users.map(u => u.role));

  sendPaginatedResponse(
    res,
    result.users,
    { page, limit, total: result.total },
    'System edition users retrieved successfully'
  );
});

// Get system edition company admins
export const getSystemEditionCompanyAdmins = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const search = req.query['search'] as string;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const result = await systemEditionService.getSystemEditionCompanyAdmins(id, {
    page,
    limit,
    search,
  });

  sendPaginatedResponse(
    res,
    result.admins,
    { page, limit, total: result.total },
    'System edition company admins retrieved successfully'
  );
});

// Get system edition delegates
export const getSystemEditionDelegates = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const search = req.query['search'] as string;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const result = await systemEditionService.getSystemEditionDelegates(id, {
    page,
    limit,
    search,
  });

  sendPaginatedResponse(
    res,
    result.delegates,
    { page, limit, total: result.total },
    'System edition delegates retrieved successfully'
  );
});

// Get system edition seat management
export const getSystemEditionSeatManagement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const seatManagement = await systemEditionService.getSystemEditionSeatManagement(id);

  if (!seatManagement) {
    sendNotFound(res, 'System edition seat management not found');
    return;
  }

  sendSuccess(res, seatManagement, 'System edition seat management retrieved successfully');
});

// Update system edition seat management
export const updateSystemEditionSeatManagement = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const userId = req.user?.id;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  try {
    const seatManagementData = {
      ...updateData,
      lastUpdatedBy: userId
    };
    const seatManagement = await systemEditionService.updateSystemEditionSeatManagement(id, seatManagementData);

    if (!seatManagement) {
      sendNotFound(res, 'System edition seat management not found');
      return;
    }

    sendSuccess(res, seatManagement, 'System edition seat management updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Get system edition co-branding
export const getSystemEditionCoBranding = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const coBranding = await systemEditionService.getSystemEditionCoBranding(id);

  if (!coBranding) {
    sendNotFound(res, 'System edition co-branding not found');
    return;
  }

  sendSuccess(res, coBranding, 'System edition co-branding retrieved successfully');
});

// Get Edition Admin system edition co-branding
export const getEditionAdminSystemEditionCoBranding = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const systemEditionId = req.user?.systemEditionId;
  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found');
    return;
  }

  const coBranding = await systemEditionService.getSystemEditionCoBranding(systemEditionId);

  if (!coBranding) {
    sendNotFound(res, 'System edition co-branding not found');
    return;
  }

  sendSuccess(res, coBranding, 'System edition co-branding retrieved successfully');
});

// Update Edition Admin system edition co-branding
export const updateEditionAdminSystemEditionCoBranding = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const systemEditionId = req.user?.systemEditionId;
  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found');
    return;
  }
  const updateData = req.body;
  const userId = req.user?.id;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  try {
    const coBrandingData = {
      ...updateData,
      lastUpdatedBy: userId
    };
    const coBranding = await systemEditionService.updateSystemEditionCoBranding(systemEditionId, coBrandingData);

    if (!coBranding) {
      sendNotFound(res, 'System edition co-branding not found');
      return;
    }

    sendSuccess(res, coBranding, 'System edition co-branding updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Update system edition co-branding
export const updateSystemEditionCoBranding = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const userId = req.user?.id;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  try {
    const coBrandingData = {
      ...updateData,
      lastUpdatedBy: userId
    };
    const coBranding = await systemEditionService.updateSystemEditionCoBranding(id, coBrandingData);

    if (!coBranding) {
      sendNotFound(res, 'System edition co-branding not found');
      return;
    }

    sendSuccess(res, coBranding, 'System edition co-branding updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Upload system edition logo
export const uploadSystemEditionLogo = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const file = (req as any).file;
  const userId = req.user?.id;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  if (!file) {
    sendBadRequest(res, 'Logo file is required');
    return;
  }

  try {
    const logoUrl = await systemEditionService.uploadSystemEditionLogo(id, file, userId || '');
    sendSuccess(res, { logoUrl }, 'System edition logo uploaded successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Upload edition admin system edition logo
export const uploadEditionAdminSystemEditionLogo = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const file = (req as any).file;
  const userId = req.user?.id;
  const systemEditionId = req.user?.systemEditionId;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found');
    return;
  }

  if (!file) {
    sendBadRequest(res, 'Logo file is required');
    return;
  }

  try {
    const logoUrl = await systemEditionService.uploadSystemEditionLogo(systemEditionId, file, userId || '');
    sendSuccess(res, { logoUrl }, 'System edition logo uploaded successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Get system edition delegate access
export const getSystemEditionDelegateAccess = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const search = req.query['search'] as string;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const result = await systemEditionService.getSystemEditionDelegateAccess(id, {
    page,
    limit,
    search,
  });

  sendPaginatedResponse(
    res,
    result.delegateAccess,
    { page, limit, total: result.total },
    'System edition delegate access retrieved successfully'
  );
});

// Create system edition delegate access
export const createSystemEditionDelegateAccess = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const delegateData = req.body;
  const userId = req.user?.id;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  try {
    const delegateAccessData = {
      ...delegateData,
      createdBy: userId
    };
    const delegateAccess = await systemEditionService.createSystemEditionDelegateAccess(id, delegateAccessData);
    sendCreated(res, delegateAccess, 'System edition delegate access created successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Get system edition edition admins
export const getSystemEditionEditionAdmins = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const search = req.query['search'] as string;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const result = await systemEditionService.getSystemEditionEditionAdmins(id, {
    page,
    limit,
    search,
  });

  sendPaginatedResponse(
    res,
    result.editionAdmins,
    { page, limit, total: result.total },
    'System edition edition admins retrieved successfully'
  );
});

// Get single system edition edition admin
export const getSystemEditionEditionAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id, adminId } = req.params;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  if (!adminId) {
    sendBadRequest(res, 'Admin ID is required');
    return;
  }

  try {
    const editionAdmin = await systemEditionService.getSystemEditionEditionAdmin(id, adminId);
    sendSuccess(res, editionAdmin, 'System edition edition admin retrieved successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Create system edition edition admin
export const createSystemEditionEditionAdmin = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, email, expirationDate } = req.body;
  const userId = req.user?.id;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  if (!firstName || !lastName || !email) {
    sendBadRequest(res, 'First name, last name, and email are required');
    return;
  }

  try {
    const adminData: {
      firstName: string;
      lastName: string;
      email: string;
      expirationDate?: Date;
      createdBy: string;
    } = {
      firstName,
      lastName,
      email,
      createdBy: userId || ''
    };

    if (expirationDate) {
      adminData.expirationDate = new Date(expirationDate);
    }

    const result = await systemEditionService.createSystemEditionEditionAdmin(id, adminData);

    sendCreated(res, result, 'System edition edition admin created successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
}); 

// Update system edition edition admin
export const updateSystemEditionEditionAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id, adminId } = req.params;
  const { firstName, lastName, email, expirationDate } = req.body;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  if (!adminId) {
    sendBadRequest(res, 'Admin ID is required');
    return;
  }

  try {
    const updateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      expirationDate?: Date;
    } = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (expirationDate) updateData.expirationDate = new Date(expirationDate);

    const updatedAdmin = await systemEditionService.updateSystemEditionEditionAdmin(id, adminId, updateData);

    sendSuccess(res, updatedAdmin, 'System edition edition admin updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Delete system edition edition admin
export const deleteSystemEditionEditionAdmin = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { id, adminId } = req.params;
  const userId = req.user?.id;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  if (!adminId) {
    sendBadRequest(res, 'Admin ID is required');
    return;
  }

  try {
    await systemEditionService.deleteSystemEditionEditionAdmin(id, adminId, userId || '');
    sendNoContent(res);
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Update system edition user
export const updateSystemEditionUser = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { userId } = req.params;
  const updateData = req.body;
  const user = req.user;

  if (!user) {
    sendBadRequest(res, 'User authentication required');
    return;
  }

  // Get systemEditionId from the authenticated user
  const systemEditionId = user.systemEditionId;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found in user context');
    return;
  }

  if (!userId) {
    sendBadRequest(res, 'User ID is required');
    return;
  }

  try {
    // Verify the user belongs to the system edition
    const targetUser = await userService.getUserById(userId);
    if (!targetUser || targetUser.systemEditionId !== systemEditionId) {
      sendBadRequest(res, 'User does not belong to your system edition');
      return;
    }

    const updatedUser = await userService.updateUser(userId, updateData);

    if (!updatedUser) {
      sendNotFound(res, 'User not found');
      return;
    }

    sendSuccess(res, updatedUser, 'User updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Delete system edition user
export const deleteSystemEditionUser = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { userId } = req.params;
  const user = req.user;

  if (!user) {
    sendBadRequest(res, 'User authentication required');
    return;
  }

  // Get systemEditionId from the authenticated user
  const systemEditionId = user.systemEditionId;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found in user context');
    return;
  }

  if (!userId) {
    sendBadRequest(res, 'User ID is required');
    return;
  }

  try {
    // Verify the user belongs to the system edition
    const targetUser = await userService.getUserById(userId);
    if (!targetUser || targetUser.systemEditionId !== systemEditionId) {
      sendBadRequest(res, 'User does not belong to your system edition');
      return;
    }

    // Handle seat assignment - decrement company used seats if user had a seat assigned
    if (targetUser.seatAssigned && targetUser.companyId) {
      try {
        const company = await Company.findByPk(targetUser.companyId);
        if (company) {
          const currentUsedSeats = company.usedSeats || 0;
          const newUsedSeats = Math.max(0, currentUsedSeats - 1);
          await company.update({ usedSeats: newUsedSeats });
        }
      } catch (error) {
        console.error('Error updating company used seats:', error);
      }
    }

    const deleted = await userService.deleteUser(userId);

    if (!deleted) {
      sendNotFound(res, 'User not found');
      return;
    }

    sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Tag Management Methods

// Get system edition tags
export const getSystemEditionTags = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const type = req.query['type'] as 'document' | 'note' | 'certificate';

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const tags = await tagService.getTagsBySystemEdition(id, type);
  
  sendSuccess(res, tags, 'System edition tags retrieved successfully');
});

// Get system edition tags
export const getEditionAdminSystemEditionTags = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const systemEditionId = req.user?.systemEditionId;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found');
    return;
  }

  const type = req.query['type'] as 'document' | 'note' | 'certificate';

  const tags = await tagService.getTagsBySystemEdition(systemEditionId, type);
  
  sendSuccess(res, tags, 'System edition tags retrieved successfully');
});

// Get system edition document tags
export const getSystemEditionDocumentTags = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const tags = await tagService.getDocumentTags(id);
  
  sendSuccess(res, tags, 'System edition document tags retrieved successfully');
});

// Get system edition document tags for edition admin
export const getSystemEditionAdminDocumentTags = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const systemEditionId = req.user?.systemEditionId;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found');
    return;
  }

  const tags = await tagService.getDocumentTags(systemEditionId);
  
  sendSuccess(res, tags, 'System edition document tags retrieved successfully');
});

// Get system edition certificate tags for edition admin
export const getSystemEditionAdminCertificateTags = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const systemEditionId = req.user?.systemEditionId;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found');
    return;
  }

  const tags = await tagService.getCertificateTags(systemEditionId);
  
  sendSuccess(res, tags, 'System edition certificate tags retrieved successfully');
});

// Get system edition notes tags
export const getSystemEditionNotesTags = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const tags = await tagService.getNoteTags(id);
  
  sendSuccess(res, tags, 'System edition notes tags retrieved successfully');
});

// Get system edition certificate tags
export const getSystemEditionCertificateTags = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const tags = await tagService.getCertificateTags(id);
  
  sendSuccess(res, tags, 'System edition certificate tags retrieved successfully');
});

// Create system edition tag
export const createSystemEditionTag = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tagData = { ...req.body, systemEditionId: id };

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  try {
    const tag = await tagService.createTag(tagData);
    sendCreated(res, tag, 'System edition tag created successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

export const createEditionAdminSystemEditionTag = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const systemEditionId = req.user?.systemEditionId;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found');
    return;
  }

  const tagData = { ...req.body, systemEditionId: systemEditionId };

  try {
    const tag = await tagService.createTag(tagData);
    sendCreated(res, tag, 'System edition tag created successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Create system edition document tag
export const createSystemEditionDocumentTag = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tagData = { ...req.body, systemEditionId: id, type: 'document' as const };

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  try {
    const tag = await tagService.createTag(tagData);
    sendCreated(res, tag, 'System edition document tag created successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Create edition admin document tag (gets user from request)
export const createEditionAdminDocumentTag = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const systemEditionId = req.user?.systemEditionId;
  const userId = req.user?.id;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found');
    return;
  }

  if (!userId) {
    sendBadRequest(res, 'Please login to continue');
    return;
  }

  const { name, color, isActive, sortOrder } = req.body;

  if (!name) {
    sendBadRequest(res, 'Tag name is required');
    return;
  }

  const tagData = { 
    systemEditionId: systemEditionId,
    name,
    color,
    isActive,
    sortOrder,
    type: 'document' as const,
    createdBy: userId
  };

  try {
    const tag = await tagService.createTag(tagData);
    sendCreated(res, tag, 'Edition admin document tag created successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Create system edition notes tag
export const createSystemEditionNotesTag = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tagData = { ...req.body, systemEditionId: id, type: 'note' as const };

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  try {
    const tag = await tagService.createTag(tagData);
    sendCreated(res, tag, 'System edition notes tag created successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Update system edition tag
export const updateSystemEditionTag = asyncHandler(async (req: Request, res: Response) => {
  const { id, tagId } = req.params;
  const updateData = req.body;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  if (!tagId) {
    sendBadRequest(res, 'Tag ID is required');
    return;
  }

  try {
    const tag = await tagService.updateTag(tagId, updateData);

    if (!tag) {
      sendNotFound(res, 'Tag not found');
      return;
    }

    sendSuccess(res, tag, 'System edition tag updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Update system edition tag
export const updateEditionAdminTag = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { tagId } = req.params;
  const updateData = req.body;

  const systemEditionId = req.user?.systemEditionId;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found');
    return;
  }

  if (!tagId) {
    sendBadRequest(res, 'Tag ID is required');
    return;
  }
  updateData.systemEditionId = systemEditionId;
  try {
    const tag = await tagService.updateTag(tagId, updateData);

    if (!tag) {
      sendNotFound(res, 'Tag not found');
      return;
    }

    sendSuccess(res, tag, 'System edition tag updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Delete system edition tag
export const deleteSystemEditionTag = asyncHandler(async (req: Request, res: Response) => {
  const { id, tagId } = req.params;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  if (!tagId) {
    sendBadRequest(res, 'Tag ID is required');
    return;
  }

  const success = await tagService.deleteTag(tagId);

  if (!success) {
    sendNotFound(res, 'Tag not found');
    return;
  }

  sendNoContent(res);
});

// Delete system edition tag
export const deleteEditionAdminTag = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { tagId } = req.params;

  const systemEditionId = req.user?.systemEditionId;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found');
    return;
  }

  if (!tagId) {
    sendBadRequest(res, 'Tag ID is required');
    return;
  }

  const success = await tagService.deleteTag(tagId);

  if (!success) {
    sendNotFound(res, 'Tag not found');
    return;
  }

  sendNoContent(res);
});

// Update system edition tag order
export const updateSystemEditionTagOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tagUpdates } = req.body;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  if (!Array.isArray(tagUpdates)) {
    sendBadRequest(res, 'tagUpdates must be an array');
    return;
  }

  try {
    await tagService.updateTagOrder(tagUpdates);
    sendSuccess(res, null, 'System edition tag order updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

export const updateEditionAdminSystemEditionTagOrder = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { tagUpdates } = req.body;

  const systemEditionId = req.user?.systemEditionId;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found');
    return;
  }

  if (!Array.isArray(tagUpdates)) {
    sendBadRequest(res, 'tagUpdates must be an array');
    return;
  }

  try {
    await tagService.updateTagOrder(tagUpdates);
    sendSuccess(res, null, 'System edition tag order updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Merge system edition tags
export const mergeSystemEditionTags = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { sourceTagIds, targetTagId, newTagName } = req.body;

  if (!id) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  if (!Array.isArray(sourceTagIds) || sourceTagIds.length === 0) {
    sendBadRequest(res, 'sourceTagIds must be a non-empty array');
    return;
  }

  if (!targetTagId && !newTagName) {
    sendBadRequest(res, 'Either targetTagId or newTagName must be provided');
    return;
  }

  try {
    const result = await tagService.mergeTags(sourceTagIds, targetTagId, newTagName);
    sendSuccess(res, result, 'System edition tags merged successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Merge edition admin system edition tags
export const mergeEditionAdminTags = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { sourceTagIds, targetTagId, newTagName } = req.body;

  const systemEditionId = req.user?.systemEditionId;
  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found');
    return;
  }

  if (!Array.isArray(sourceTagIds) || sourceTagIds.length === 0) {
    sendBadRequest(res, 'sourceTagIds must be a non-empty array');
    return;
  }

  if (!targetTagId && !newTagName) {
    sendBadRequest(res, 'Either targetTagId or newTagName must be provided');
    return;
  }

  try {
    const result = await tagService.mergeTags(sourceTagIds, targetTagId, newTagName);
    sendSuccess(res, result, 'System edition tags merged successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});
