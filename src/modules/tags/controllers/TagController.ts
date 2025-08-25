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
import { tagService } from '../services/TagService.js';
import type { TagFilters, CreateTagData, TagOrderUpdate, TagMergeData } from '../types/index.js';
import { RequestWithContext } from '../../../shared/middleware/contextResolver.js';

// Tag validation
export const tagValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Tag name must be between 1 and 100 characters')
    .trim(),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code (e.g., #FF0000)'),
  body('type')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Type must be between 1 and 50 characters')
    .isIn(['document', 'note', 'certificate'])
    .withMessage('Type must be one of: document, note, certificate'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('sortOrder must be a non-negative integer'),
];

// Tag order update validation
export const tagOrderValidation = [
  body('tagUpdates')
    .isArray({ min: 1 })
    .withMessage('tagUpdates must be a non-empty array'),
  body('tagUpdates.*.id')
    .isUUID()
    .withMessage('Each tag ID must be a valid UUID'),
  body('tagUpdates.*.sortOrder')
    .isInt({ min: 0 })
    .withMessage('Each sortOrder must be a non-negative integer'),
];

// Tag merge validation
export const tagMergeValidation = [
  body('sourceTagIds')
    .isArray({ min: 1 })
    .withMessage('sourceTagIds must be a non-empty array'),
  body('sourceTagIds.*')
    .isUUID()
    .withMessage('Each source tag ID must be a valid UUID'),
  body('targetTagId')
    .optional()
    .isUUID()
    .withMessage('targetTagId must be a valid UUID'),
  body('newTagName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('newTagName must be between 1 and 100 characters')
    .trim(),
];

// Get all tags with filtering
export const getAllTags = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  const filters: TagFilters = {
    page: parseInt(req.query['page'] as string) || 1,
    limit: parseInt(req.query['limit'] as string) || 10,
    search: req.query['search'] as string | undefined,
    type: req.query['type'] as 'document' | 'note' | 'certificate' | undefined,
    isActive: req.query['isActive'] === 'true' ? true : req.query['isActive'] === 'false' ? false : undefined,
    systemEditionId: context.systemEditionId,
    companyId: context.companyId,
  };

  const result = await tagService.getAllTags(filters);

  sendPaginatedResponse(
    res,
    result.tags.map(tag => tag.get({ plain: true })),
    { page: filters.page || 1, limit: filters.limit || 10, total: result.total },
    'Tags retrieved successfully'
  );
});

// Get tag by ID
export const getTagById = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  const { id } = req.params;

  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  if (!id) {
    return sendBadRequest(res, 'Tag ID is required');
  }

  const tag = await tagService.getTagById(id);
  
  if (!tag) {
    return sendNotFound(res, 'Tag not found');
  }

  // Verify the tag belongs to the user's context
  const plainTag = tag.get({ plain: true });
  if (plainTag.systemEditionId !== context.systemEditionId) {
    return sendNotFound(res, 'Tag not found');
  }

  sendSuccess(res, plainTag, 'Tag retrieved successfully');
});

// Create new tag
export const createTag = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  
  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  const data: CreateTagData = {
    ...req.body,
    systemEditionId: context.systemEditionId,
    companyId: context.companyId,
    createdBy: context.userId,
  };

  const newTag = await tagService.createTag(data);
  
  sendCreated(res, newTag.get({ plain: true }), 'Tag created successfully');
});

// Update tag
export const updateTag = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  const { id } = req.params;

  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  if (!id) {
    return sendBadRequest(res, 'Tag ID is required');
  }

  // First get the tag to verify ownership
  const existingTag = await tagService.getTagById(id);
  if (!existingTag) {
    return sendNotFound(res, 'Tag not found');
  }

  const plainTag = existingTag.get({ plain: true });
  if (plainTag.systemEditionId !== context.systemEditionId) {
    return sendNotFound(res, 'Tag not found');
  }

  const updatedTag = await tagService.updateTag(id, req.body);
  
  if (!updatedTag) {
    return sendNotFound(res, 'Tag not found');
  }

  sendSuccess(res, updatedTag.get({ plain: true }), 'Tag updated successfully');
});

// Delete tag
export const deleteTag = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  const { id } = req.params;

  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  if (!id) {
    return sendBadRequest(res, 'Tag ID is required');
  }

  // First get the tag to verify ownership
  const existingTag = await tagService.getTagById(id);
  if (!existingTag) {
    return sendNotFound(res, 'Tag not found');
  }

  const plainTag = existingTag.get({ plain: true });
  if (plainTag.systemEditionId !== context.systemEditionId) {
    return sendNotFound(res, 'Tag not found');
  }

  const deleted = await tagService.deleteTag(id);
  
  if (!deleted) {
    return sendNotFound(res, 'Tag not found');
  }

  sendNoContent(res);
});

// Update tag order
export const updateTagOrder = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  
  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  const { tagUpdates }: { tagUpdates: TagOrderUpdate[] } = req.body;

  // Verify all tags belong to the user's context
  for (const update of tagUpdates) {
    const tag = await tagService.getTagById(update.id);
    if (!tag) {
      return sendNotFound(res, `Tag with ID ${update.id} not found`);
    }

    const plainTag = tag.get({ plain: true });
    if (plainTag.systemEditionId !== context.systemEditionId) {
      return sendBadRequest(res, `Tag with ID ${update.id} does not belong to your system edition`);
    }
  }

  await tagService.updateTagOrder(tagUpdates);
  
  sendSuccess(res, null, 'Tag order updated successfully');
});

// Merge tags
export const mergeTags = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  
  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  const { sourceTagIds, targetTagId, newTagName }: TagMergeData = req.body;

  // Verify all source tags belong to the user's context
  for (const tagId of sourceTagIds) {
    const tag = await tagService.getTagById(tagId);
    if (!tag) {
      return sendNotFound(res, `Tag with ID ${tagId} not found`);
    }

    const plainTag = tag.get({ plain: true });
    if (plainTag.systemEditionId !== context.systemEditionId) {
      return sendBadRequest(res, `Tag with ID ${tagId} does not belong to your system edition`);
    }
  }

  // Verify target tag if provided
  if (targetTagId) {
    const tag = await tagService.getTagById(targetTagId);
    if (!tag) {
      return sendNotFound(res, `Target tag with ID ${targetTagId} not found`);
    }

    const plainTag = tag.get({ plain: true });
    if (plainTag.systemEditionId !== context.systemEditionId) {
      return sendBadRequest(res, `Target tag with ID ${targetTagId} does not belong to your system edition`);
    }
  }

  const result = await tagService.mergeTags(sourceTagIds, targetTagId, newTagName);
  
  sendSuccess(res, result, 'Tags merged successfully');
});

// Get tags by type
export const getTagsByType = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  const { type } = req.params;

  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  if (!type) {
    return sendBadRequest(res, 'Tag type is required');
  }

  if (!['document', 'note', 'certificate'].includes(type)) {
    return sendBadRequest(res, 'Invalid tag type. Must be one of: document, note, certificate');
  }

  const tags = await tagService.getTagsBySystemEdition(context.systemEditionId, type as 'document' | 'note' | 'certificate');
  
  sendSuccess(res, tags.map(tag => tag.get({ plain: true })), `${type.charAt(0).toUpperCase() + type.slice(1)} tags retrieved successfully`);
});

// Get tag statistics
export const getTagStats = asyncHandler(async (req: RequestWithContext, res: Response) => {
  const context = req.resolvedContext;
  
  if (!context?.systemEditionId) {
    return sendBadRequest(res, 'System edition ID is required');
  }

  const [documentTags, noteTags, certificateTags] = await Promise.all([
    tagService.getDocumentTags(context.systemEditionId),
    tagService.getNoteTags(context.systemEditionId),
    tagService.getCertificateTags(context.systemEditionId),
  ]);

  const stats = {
    total: documentTags.length + noteTags.length + certificateTags.length,
    byType: {
      document: documentTags.length,
      note: noteTags.length,
      certificate: certificateTags.length,
    },
    active: {
      document: documentTags.filter(tag => tag.get({ plain: true }).isActive).length,
      note: noteTags.filter(tag => tag.get({ plain: true }).isActive).length,
      certificate: certificateTags.filter(tag => tag.get({ plain: true }).isActive).length,
    },
  };

  sendSuccess(res, stats, 'Tag statistics retrieved successfully');
}); 