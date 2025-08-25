import { Router } from 'express';
import { authenticateToken, authorize } from '../../../shared/middleware/auth.js';
import { validateRequest } from '../../../shared/middleware/validation.js';
import { resolveContext } from '../../../shared/middleware/contextResolver.js';
import { 
  getAllCustomFields,
  getCustomFieldById,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  updateCustomFieldOrder,
  getCustomFieldStats,
  customFieldValidation
} from '../controllers/CustomFieldController.js';

const router = Router();

router.use(authenticateToken);
router.use(resolveContext);

router.get('/', authorize('super_admin', 'edition_admin', 'company_admin', 'user'), getAllCustomFields);
router.get('/stats', authorize('super_admin', 'edition_admin', 'company_admin', 'user'), getCustomFieldStats);
router.get('/:id', authorize('super_admin', 'edition_admin', 'company_admin', 'user'), getCustomFieldById);
router.post('/', authorize('super_admin', 'edition_admin'), customFieldValidation, validateRequest, createCustomField);
router.put('/:id', authorize('super_admin', 'edition_admin'), customFieldValidation, validateRequest, updateCustomField);
router.delete('/:id', authorize('super_admin', 'edition_admin'), deleteCustomField);

router.put('/order', authorize('super_admin', 'edition_admin'), updateCustomFieldOrder);

export default router; 