import { Router } from 'express';
import { authenticateToken, authorize } from '../../../shared/middleware/auth.js';
import { validateRequest } from '../../../shared/middleware/validation.js';
import { 
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getRoleStats,
  getRolesByScope,
  checkRoleNameExists,
  roleValidation
} from '../controllers/RoleController.js';

const router = Router();

router.use(authenticateToken);

// Public role endpoints (all authenticated users can read)
router.get('/', authorize('super_admin', 'edition_admin', 'company_admin', 'user'), getAllRoles);
router.get('/stats', authorize('super_admin', 'edition_admin', 'company_admin', 'user'), getRoleStats);
router.get('/scope/:scope', authorize('super_admin', 'edition_admin', 'company_admin', 'user'), getRolesByScope);
router.get('/check-name/:name', authorize('super_admin', 'edition_admin', 'company_admin', 'user'), checkRoleNameExists);
router.get('/:id', authorize('super_admin', 'edition_admin', 'company_admin', 'user'), getRoleById);

// Admin-only endpoints (super admin and edition admin can manage)
router.post('/', authorize('super_admin', 'edition_admin'), roleValidation, validateRequest, createRole);
router.put('/:id', authorize('super_admin', 'edition_admin'), roleValidation, validateRequest, updateRole);
router.delete('/:id', authorize('super_admin', 'edition_admin'), deleteRole);

export default router;
