import { body } from 'express-validator';
import type { Request, Response } from 'express';
import { tagService } from '../../tags/services/TagService.js';
import { asyncHandler } from '../../../shared/middleware/errorHandler.js';
import { 
  sendSuccess, 
  sendCreated,
  sendNotFound, 
  sendNoContent,
  sendBadRequest,
  sendPaginatedResponse
} from '../../../shared/utils/response.js';

// Tag validation
export const tagValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Tag name must be between 1 and 100 characters')
    .trim(),
  body('type')
    .isIn(['document', 'note', 'certificate'])
    .withMessage('Type must be either "document", "note", or "certificate"'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('sortOrder must be a non-negative integer'),
];

// Get all tags
export const getAllTags = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const search = req.query['search'] as string;
  const type = req.query['type'] as 'document' | 'note' | 'certificate';
  const isActive = req.query['isActive'] === 'true' ? true : req.query['isActive'] === 'false' ? false : undefined;

  const filters: any = { page, limit };
  if (search) filters.search = search;
  if (type) filters.type = type;
  if (isActive !== undefined) filters.isActive = isActive;

  const result = await tagService.getAllTags(filters);

  sendPaginatedResponse(
    res,
    result.tags,
    { page, limit, total: result.total },
    'Tags retrieved successfully'
  );
});

// Get tags by system edition
export const getTagsBySystemEdition = asyncHandler(async (req: Request, res: Response) => {
  const { systemEditionId } = req.params;
  const type = req.query['type'] as 'document' | 'note' | 'certificate';

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const tags = await tagService.getTagsBySystemEdition(systemEditionId, type);
  
  sendSuccess(res, tags, 'Tags retrieved successfully');
});

// Get document tags for system edition
export const getDocumentTags = asyncHandler(async (req: Request, res: Response) => {
  const { systemEditionId } = req.params;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const tags = await tagService.getDocumentTags(systemEditionId);
  
  sendSuccess(res, tags, 'Document tags retrieved successfully');
});

// Get note tags for system edition
export const getNoteTags = asyncHandler(async (req: Request, res: Response) => {
  const { systemEditionId } = req.params;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID is required');
    return;
  }

  const tags = await tagService.getNoteTags(systemEditionId);
  
  sendSuccess(res, tags, 'Note tags retrieved successfully');
});

// Get certificate tags for system edition
export const getCertificateTags = asyncHandler(async (req: Request, res: Response) => {
  const { systemEditionId } = req.params;

  if (!systemEditionId) {
    sendBadRequest(res, 'System edition ID not found');
    return;
  }

  const tags = await tagService.getCertificateTags(systemEditionId);
  
  sendSuccess(res, tags, 'Certificate tags retrieved successfully');
});

// Create tag
export const createTag = asyncHandler(async (req: Request, res: Response) => {
  const tagData = req.body;

  try {
    const tag = await tagService.createTag(tagData);
    sendCreated(res, tag, 'Tag created successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Get tag by ID
export const getTagById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    sendBadRequest(res, 'Tag ID is required');
    return;
  }

  const tag = await tagService.getTagById(id);

  if (!tag) {
    sendNotFound(res, 'Tag not found');
    return;
  }

  sendSuccess(res, tag, 'Tag retrieved successfully');
});

// Update tag
export const updateTag = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id) {
    sendBadRequest(res, 'Tag ID is required');
    return;
  }

  try {
    const tag = await tagService.updateTag(id, updateData);

    if (!tag) {
      sendNotFound(res, 'Tag not found');
      return;
    }

    sendSuccess(res, tag, 'Tag updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Delete tag
export const deleteTag = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    sendBadRequest(res, 'Tag ID is required');
    return;
  }

  const success = await tagService.deleteTag(id);

  if (!success) {
    sendNotFound(res, 'Tag not found');
    return;
  }

  sendNoContent(res);
});

// Update tag order
export const updateTagOrder = asyncHandler(async (req: Request, res: Response) => {
  const { tagUpdates } = req.body;

  if (!Array.isArray(tagUpdates)) {
    sendBadRequest(res, 'tagUpdates must be an array');
    return;
  }

  try {
    await tagService.updateTagOrder(tagUpdates);
    sendSuccess(res, null, 'Tag order updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
});

// Merge tags
export const mergeTags = asyncHandler(async (req: Request, res: Response) => {
  const { sourceTagIds, targetTagId, newTagName } = req.body;

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
    sendSuccess(res, result, 'Tags merged successfully');
  } catch (error) {
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
    } else {
      throw error;
    }
  }
}); 