import { Router } from 'express';

// Import routes from modules
import systemEditionRoutes from '../../modules/systemEditions/routes/systemEditionRoutes.js';
import companyRoutes from '../../modules/companies/routes/companyRoutes.js';
import userRoutes from '../../modules/users/routes/userRoutes.js';
import delegateAccessRoutes from '../../modules/delegates/routes/delegateAccessRoutes.js';
import customFieldRoutes from '../../modules/customFields/routes/customFieldRoutes.js';
import auditLogRoutes from '../../modules/auditLogs/routes/auditLogRoutes.js';
import tagRoutes from '../../modules/tags/routes/tagRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Super Admin API v1',
    version: '1.0.0'
  });
});

// Module routes
router.use('/system-editions', systemEditionRoutes);
router.use('/companies', companyRoutes);
router.use('/users', userRoutes);
router.use('/delegate-access', delegateAccessRoutes);
router.use('/custom-fields', customFieldRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/tags', tagRoutes);

export default router; 