import { Router } from 'express';
import { UserRoleController } from '../controllers/UserRoleController.js';
import { authenticateToken } from '../../../shared/middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get available roles for the authenticated user
router.get('/available', UserRoleController.getAvailableRoles);

// Get current active role
router.get('/active', UserRoleController.getCurrentActiveRole);

// Set active role
router.post('/active', UserRoleController.setActiveRole);

// Clear active role
router.delete('/active', UserRoleController.clearActiveRole);

// Validate current active role
router.get('/active/validate', UserRoleController.validateActiveRole);

// Switch role (quick role switching)
router.post('/switch', UserRoleController.switchRole);

export default router;
