import { Router } from 'express';
import { authenticateToken, authorize } from '../../../shared/middleware/auth.js';
import SuperAdminController from '../controllers/SuperAdminController.js';

const router = Router();

// Dashboard metrics route - super admin only
router.get(
  '/dashboard-metrics',
  authenticateToken,
  authorize('super_admin'),
  SuperAdminController.getDashboardMetrics
);

export default router;
