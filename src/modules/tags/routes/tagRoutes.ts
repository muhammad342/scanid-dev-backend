import { Router } from 'express';
import { authenticateToken, authorize } from '../../../shared/middleware/auth.js';
import { validateRequest } from '../../../shared/middleware/validation.js';
import { resolveContext } from '../../../shared/middleware/contextResolver.js';
import { 
  getAllTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  updateTagOrder,
  mergeTags,
  getTagsByType,
  getTagStats,
  tagValidation,
  tagOrderValidation,
  tagMergeValidation
} from '../controllers/TagController.js';

const router = Router();

// Apply authentication and context resolution to all routes
router.use(authenticateToken);
router.use(resolveContext);

// Read operations - All authenticated users can read tags
router.get('/', authorize('super_admin', 'edition_admin', 'company_admin', 'user'), getAllTags);
router.get('/stats', authorize('super_admin', 'edition_admin', 'company_admin', 'user'), getTagStats);
router.get('/:id', authorize('super_admin', 'edition_admin', 'company_admin', 'user'), getTagById);
router.get('/type/:type', authorize('super_admin', 'edition_admin', 'company_admin', 'user'), getTagsByType);

// Write operations - Only super admin and edition admin can modify tags
router.post('/', authorize('super_admin', 'edition_admin'), tagValidation, validateRequest, createTag);
router.put('/:id', authorize('super_admin', 'edition_admin'), tagValidation, validateRequest, updateTag);
router.delete('/:id', authorize('super_admin', 'edition_admin'), deleteTag);

// Special operations - Only super admin and edition admin
router.put('/order', authorize('super_admin', 'edition_admin'), tagOrderValidation, validateRequest, updateTagOrder);
router.post('/merge', authorize('super_admin', 'edition_admin'), tagMergeValidation, validateRequest, mergeTags);

export default router; 