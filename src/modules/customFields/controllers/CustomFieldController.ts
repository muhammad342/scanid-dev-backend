import { body } from 'express-validator';
import type { Response } from 'express';
import { asyncHandler } from '../../../shared/middleware/errorHandler.js';
import { 
  sendSuccess, 
  sendCreated,
  sendNotFound, 
  sendNoContent,
  sendBadRequest,
  sendPaginatedResponse
} from '../../../shared/utils/response.js';
import { customFieldService } from '../services/CustomFieldService.js';
import type { CustomFieldFilters, CreateCustomFieldData } from '../types/index.js';
import { RequestWithContext } from '../../../shared/middleware/contextResolver.js';

// Custom field validation
export const customFieldValidation = [
  body('fieldName')
    .isLength({ min: 1, max: 100 })
    .withMessage('Field name must be between 1 and 100 characters')
    .trim(),
  body('fieldType')
    .isIn(['Number', 'Text', 'Date', 'Dropdown', 'Checkbox'])
    .withMessage('Field type must be one of: Number, Text, Date, Dropdown, Checkbox'),
  body('helpText')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Help text must not exceed 1000 characters')
    .trim(),
  body('isMandatory')
    .optional()
    .isBoolean()
    .withMessage('isMandatory must be a boolean'),
  body('useDecimals')
    .optional()
    .isBoolean()
    .withMessage('useDecimals must be a boolean'),
  body('dropdownOptions')
    .optional()
    .custom((value, { req }) => {
      if (req.body.fieldType === 'Dropdown') {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error('Dropdown field type must have at least one option');
        }
        if (value.some((option: any) => typeof option !== 'string' || option.trim().length === 0)) {
          throw new Error('All dropdown options must be non-empty strings');
        }
      } else if (value !== null && value !== undefined) {
        throw new Error('dropdownOptions can only be set for Dropdown field type');
      }
      return true;
    }),
  body('fieldOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('fieldOrder must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

// Get all custom fields with filtering
export const getAllCustomFields = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const search = req.query['search'] as string | undefined;
  const fieldType = req.query['fieldType'] as 'Number' | 'Text' | 'Date' | 'Dropdown' | 'Checkbox' | undefined;
  const isActive = req.query['isActive'] === 'true' ? true : req.query['isActive'] === 'false' ? false : undefined;

  const filters: CustomFieldFilters = {
    page,
    limit,
    search,
    fieldType,
    isActive,
    systemEditionId: context.systemEditionId,
    companyId: context.companyId,
  };

  const result = await customFieldService.getAllCustomFields(filters);

  sendPaginatedResponse(
    res,
    result.customFields,
    { page, limit, total: result.total },
    'Custom fields retrieved successfully'
  );
});

// Get custom field by ID
export const getCustomFieldById = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  const { id } = req.params;

  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  if (!id) {
    return sendBadRequest(res, 'Custom field ID is required');
  }

  try {
    const customField = await customFieldService.getCustomFieldById(id, context.systemEditionId, context.companyId);
    sendSuccess(res, customField, 'Custom field retrieved successfully');
  } catch (error: any) {
    if (error.message === 'Custom field not found') {
      sendNotFound(res, 'Custom field not found');
    } else {
      throw error;
    }
  }
});

// Create custom field
export const createCustomField = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  
  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  const data: CreateCustomFieldData = {
    ...req.body,
    systemEditionId: context.systemEditionId,
    companyId: context.companyId,
    createdBy: context.userId,
  };

  try {
    const customField = await customFieldService.createCustomField(data);
    sendCreated(res, customField, 'Custom field created successfully');
  } catch (error: any) {
    if (error.message.includes('already exists') || error.message.includes('not found')) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Update custom field
export const updateCustomField = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  const { id } = req.params;

  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  if (!id) {
    return sendBadRequest(res, 'Custom field ID is required');
  }

  try {
    const updatedCustomField = await customFieldService.updateCustomField(id, req.body, context.systemEditionId, context.companyId);
    sendSuccess(res, updatedCustomField, 'Custom field updated successfully');
  } catch (error: any) {
    if (error.message === 'Custom field not found') {
      sendNotFound(res, 'Custom field not found');
    } else if (error.message.includes('already exists')) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Delete custom field
export const deleteCustomField = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  const { id } = req.params;

  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  if (!id) {
    return sendBadRequest(res, 'Custom field ID is required');
  }

  try {
    await customFieldService.deleteCustomField(id, context.systemEditionId, context.companyId);
    sendNoContent(res);
  } catch (error: any) {
    if (error.message === 'Custom field not found') {
      sendNotFound(res, 'Custom field not found');
    } else {
      throw error;
    }
  }
});

// Update custom field order
export const updateCustomFieldOrder = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  const { fieldOrders } = req.body;

  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  if (!Array.isArray(fieldOrders)) {
    return sendBadRequest(res, 'fieldOrders must be an array');
  }

  // Validate fieldOrders structure
  const isValidStructure = fieldOrders.every(
    (item: any) => 
      typeof item === 'object' && 
      typeof item.id === 'string' && 
      typeof item.fieldOrder === 'number' && 
      item.fieldOrder >= 0
  );

  if (!isValidStructure) {
    return sendBadRequest(res, 'Each field order item must have id (string) and fieldOrder (non-negative number)');
  }

  try {
    const result = await customFieldService.updateCustomFieldOrder(context.systemEditionId, fieldOrders, context.companyId);
    sendSuccess(res, result, 'Custom field order updated successfully');
  } catch (error: any) {
    if (error.message.includes('not found')) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Get custom field statistics
export const getCustomFieldStats = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  
  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  const stats = await customFieldService.getCustomFieldStats(context.systemEditionId, context.companyId);
  sendSuccess(res, stats, 'Custom field statistics retrieved successfully');
}); 