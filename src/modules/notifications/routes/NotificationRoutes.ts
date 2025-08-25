import express from 'express';
import { notificationController } from '../controllers/NotificationController.js';
import { validateRequest } from '../../../shared/middleware/validation.js';
import { body } from 'express-validator';
import { authenticateToken } from '../../../shared/middleware/auth.js';
import { requirePermission } from '../../../acl/middleware/authorization.js';
import { Permission } from '../../../acl/types/index.js';

const router = express.Router();

// Middleware to validate email
const validateEmail = [
  body('email').isEmail().withMessage('Invalid email address'),
];

// Middleware to validate welcome email request
const validateWelcomeEmail = [
  ...validateEmail,
  body('firstName').notEmpty().withMessage('First name is required'),
];

// Middleware to validate password reset email request
const validatePasswordResetEmail = [
  ...validateEmail,
  body('resetToken').notEmpty().withMessage('Reset token is required'),
];

// Middleware to validate new user notification request
const validateNewUserNotification = [
  body('adminEmails').isArray().withMessage('Admin emails must be an array'),
  body('adminEmails.*').isEmail().withMessage('Invalid admin email address'),
  body('newUser').isObject().withMessage('New user data is required'),
  body('newUser.email').isEmail().withMessage('Invalid user email address'),
  body('newUser.firstName').notEmpty().withMessage('User first name is required'),
  body('newUser.lastName').notEmpty().withMessage('User last name is required'),
  body('newUser.role').notEmpty().withMessage('User role is required'),
];

// Middleware to validate edition update notification request
const validateEditionUpdateNotification = [
  body('adminEmails').isArray().withMessage('Admin emails must be an array'),
  body('adminEmails.*').isEmail().withMessage('Invalid admin email address'),
  body('editionName').notEmpty().withMessage('Edition name is required'),
  body('changes').isObject().withMessage('Changes object is required'),
];

// Middleware to validate seat assignment notification request
const validateSeatAssignmentNotification = [
  ...validateEmail,
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('action').isIn(['assigned', 'removed']).withMessage('Invalid action'),
];

// Routes
router.post(
  '/test',
  authenticateToken,
  requirePermission(Permission.UPDATE_SYSTEM_SETTINGS),
  validateEmail,
  validateRequest,
  notificationController.sendTestEmail
);

router.post(
  '/welcome',
  authenticateToken,
  requirePermission(Permission.CREATE_USER),
  validateWelcomeEmail,
  validateRequest,
  notificationController.sendWelcomeEmail
);

router.post(
  '/password-reset',
  validatePasswordResetEmail,
  validateRequest,
  notificationController.sendPasswordResetEmail
);

router.post(
  '/new-user',
  authenticateToken,
  requirePermission(Permission.CREATE_USER),
  validateNewUserNotification,
  validateRequest,
  notificationController.sendNewUserNotification
);

router.post(
  '/edition-update',
  authenticateToken,
  requirePermission(Permission.UPDATE_EDITION),
  validateEditionUpdateNotification,
  validateRequest,
  notificationController.sendEditionUpdateNotification
);

router.post(
  '/seat-assignment',
  authenticateToken,
  requirePermission(Permission.UPDATE_SEAT_MANAGEMENT),
  validateSeatAssignmentNotification,
  validateRequest,
  notificationController.sendSeatAssignmentNotification
);

export default router; 