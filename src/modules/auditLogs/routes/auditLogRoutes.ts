import { Router } from 'express';
import { authenticateToken, authorize } from '../../../shared/middleware/auth.js';
import { getAuditLogs, exportAuditLogs } from '../controllers/auditLogController.js';
import { resolveContext } from '../../../shared/middleware/contextResolver.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(resolveContext);

// Get audit logs (accessible by all authenticated users, but scoped by role)
router.get('/', authorize('super_admin', 'edition_admin', 'company_admin', 'user'), getAuditLogs);

// Export audit logs as CSV (accessible by all authenticated users, but scoped by role)
router.get('/export', authorize('super_admin', 'edition_admin', 'company_admin', 'user'), exportAuditLogs);

export default router; 