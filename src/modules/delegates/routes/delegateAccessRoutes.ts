import { Router } from 'express';
import { authenticateToken, authorize } from '../../../shared/middleware/auth.js';
import {
  getAllDelegateAccess,
  getDelegateAccessById,
  updateDelegateAccess,
  deleteDelegateAccess,
  inviteDelegateAdmin
} from '../controllers/DelegateAccessController.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Delegate Access CRUD (super_admin and edition_admin access)
router.get('/', authorize('super_admin', 'edition_admin'), getAllDelegateAccess);
router.get('/:id', authorize('super_admin', 'edition_admin', 'delegate'), getDelegateAccessById);
router.put('/:id', authorize('super_admin', 'edition_admin'), updateDelegateAccess);
router.delete('/:id', authorize('super_admin', 'edition_admin'), deleteDelegateAccess);

// Delegate Access Operations (super_admin and edition_admin access)
router.post('/invite', authorize('super_admin', 'edition_admin'), inviteDelegateAdmin);

export default router; 