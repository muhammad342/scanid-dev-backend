import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { authenticateToken, authorize } from '../../../shared/middleware/auth.js';
import { resolveContext } from '../../../shared/middleware/contextResolver.js';

const router = Router();

// Public authentication routes (no auth required)
router.post('/login', UserController.loginValidation, UserController.login);
router.post('/register', UserController.registerValidation, UserController.register);

// Protected routes with context resolution
router.use(authenticateToken);
router.use(resolveContext);

// User profile routes (accessible by all authenticated users)
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateValidation, UserController.updateProfile);
router.put('/profile/password', UserController.changePasswordValidation, UserController.changePassword);

// User management routes (scoped by role and context)
router.post('/', authorize('super_admin', 'edition_admin', 'company_admin'), UserController.createUserValidation, UserController.createUser);
router.get('/', authorize('super_admin', 'edition_admin', 'company_admin'), UserController.getAllUsers);
router.get('/:id', authorize('super_admin', 'edition_admin', 'company_admin'), UserController.getUserById);
router.put('/:id', authorize('super_admin', 'edition_admin', 'company_admin'), UserController.updateValidation, UserController.updateUser);
router.delete('/:id', authorize('super_admin', 'edition_admin', 'company_admin'), UserController.deleteUser);

// System edition specific routes (for super admin and edition admin)
router.get('/system-edition/:systemEditionId', authorize('super_admin', 'edition_admin'), UserController.getUsersBySystemEdition);

// Emulation routes (supports multi-level emulation)
router.post('/emulate/:id', authorize('super_admin', 'edition_admin', 'company_admin'), UserController.startEmulation);
router.post('/end-emulation', UserController.endEmulation);

export default router; 