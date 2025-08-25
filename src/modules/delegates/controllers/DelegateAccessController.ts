import { body } from 'express-validator';
import type { Request, Response } from 'express';
import { delegateAccessService } from '../services/DelegateAccessService.js';
import { asyncHandler } from '../../../shared/middleware/errorHandler.js';
import { 
  sendSuccess, 
  sendCreated,
  sendNotFound, 
  sendNoContent,
  sendBadRequest,
  sendPaginatedResponse
} from '../../../shared/utils/response.js';

// Delegate access validation
export const delegateAccessValidation = [
  body('delegatorId')
    .isUUID()
    .withMessage('Delegator ID must be a valid UUID'),
  body('delegateId')
    .isUUID()
    .withMessage('Delegate ID must be a valid UUID'),
  body('permissions')
    .isArray()
    .withMessage('Permissions must be an array'),
];

// Get all delegate access records
export const getAllDelegateAccess = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const search = req.query['search'] as string;

  const result = await delegateAccessService.getAllDelegateAccess({
    page,
    limit,
    search,
  });

  sendPaginatedResponse(
    res,
    result.delegateAccess,
    { page, limit, total: result.total },
    'Delegate access records retrieved successfully'
  );
});

// Get delegate access by ID
export const getDelegateAccessById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    sendBadRequest(res, 'Delegate access ID is required');
    return;
  }

  const delegateAccess = await delegateAccessService.getDelegateAccessById(id);

  if (!delegateAccess) {
    sendNotFound(res, 'Delegate access not found');
    return;
  }

  sendSuccess(res, delegateAccess, 'Delegate access retrieved successfully');
});

// Update delegate access
export const updateDelegateAccess = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id) {
    sendBadRequest(res, 'Delegate access ID is required');
    return;
  }

  try {
    const delegateAccess = await delegateAccessService.updateDelegateAccess(id, updateData);

    if (!delegateAccess) {
      sendNotFound(res, 'Delegate access not found');
      return;
    }

    sendSuccess(res, delegateAccess, 'Delegate access updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Delete delegate access
export const deleteDelegateAccess = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    sendBadRequest(res, 'Delegate access ID is required');
    return;
  }

  const success = await delegateAccessService.deleteDelegateAccess(id);

  if (!success) {
    sendNotFound(res, 'Delegate access not found');
    return;
  }

  sendNoContent(res);
});

// Invite delegate admin
export const inviteDelegateAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { email, firstName, lastName, systemEditionId, permissions, expirationDate } = req.body;

  if (!email || !firstName || !lastName || !systemEditionId) {
    sendBadRequest(res, 'Email, first name, last name, and system edition ID are required');
    return;
  }

  try {
    const result = await delegateAccessService.inviteDelegateAdmin({
      email,
      firstName,
      lastName,
      systemEditionId,
      permissions,
      expirationDate,
    });

    sendCreated(res, result, 'Delegate admin invited successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
}); 