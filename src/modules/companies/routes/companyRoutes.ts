import { Router } from 'express';
import { CompanyController } from '../controllers/CompanyController.js';
import { validateRequest } from '../../../shared/middleware/validation.js';
import { authenticateToken, authorize } from '../../../shared/middleware/auth.js';
import { resolveContext } from '../../../shared/middleware/contextResolver.js';
import { companyValidation, pinManagementValidation, validatePinValidation } from '../utils/compantValidation.js';

const router = Router();

router.use(authenticateToken);
router.use(resolveContext);

// Base routes
router.get('/', authorize('super_admin', 'edition_admin', 'company_admin'), CompanyController.getAllCompanies);
router.post('/', authorize('super_admin', 'edition_admin'), companyValidation, validateRequest, CompanyController.createCompany);

// Get logged-in user's company details (must come before /:id routes)
router.get('/me', authorize('super_admin', 'edition_admin', 'company_admin', 'user'), CompanyController.getMyCompany);

router.get('/:id', authorize('super_admin', 'edition_admin'), CompanyController.getCompanyById);
router.put('/:id', authorize('super_admin', 'edition_admin', 'company_admin'), companyValidation, validateRequest, CompanyController.updateCompany);
router.delete('/:id', authorize('super_admin', 'edition_admin'), CompanyController.deleteCompany);

// Company users routes
router.get('/:id/users', authorize('super_admin', 'edition_admin', 'company_admin'), CompanyController.getCompanyUsers);

// PIN management routes
router.put(
  '/:id/pin-management',
  authorize('super_admin', 'edition_admin', 'company_admin'),
  pinManagementValidation,
  validateRequest,
  CompanyController.updatePinManagement
);

router.post(
  '/:id/validate-pin',
  authorize('super_admin', 'edition_admin', 'company_admin', 'user'),
  validatePinValidation,
  validateRequest,
  CompanyController.validateCompanyPin
);

router.get(
  '/:id/pin-configuration',
  authorize('super_admin', 'edition_admin', 'company_admin', 'user'),
  CompanyController.getPinConfiguration
);

export default router; 