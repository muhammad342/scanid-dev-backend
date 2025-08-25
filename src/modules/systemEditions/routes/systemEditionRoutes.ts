import { Router } from 'express';
import multer from 'multer';
import type { Request } from 'express';
import type { MulterFile } from '../../../shared/types/common.js';
import { authenticateToken, authorize } from '../../../shared/middleware/auth.js';
import { validateRequest } from '../../../shared/middleware/validation.js';
import { 
  getAllSystemEditions,
  getSystemEditionById,
  createSystemEdition,
  updateSystemEdition,
  deleteSystemEdition,
  getSystemEditionOverview,
  getSystemEditionCompanies,
  getSystemEditionUsers,
  updateSystemEditionUser,
  deleteSystemEditionUser,
  getSystemEditionCompanyAdmins,
  getSystemEditionEditionAdmins,
  getSystemEditionEditionAdmin,
  createSystemEditionEditionAdmin,
  updateSystemEditionEditionAdmin,
  deleteSystemEditionEditionAdmin,
  getSystemEditionDelegates,
  getSystemEditionSeatManagement,
  updateSystemEditionSeatManagement,
  getSystemEditionCoBranding,
  updateSystemEditionCoBranding,
  uploadSystemEditionLogo,
  getSystemEditionDocumentTags,
  createSystemEditionDocumentTag,
  createEditionAdminDocumentTag,
  getSystemEditionNotesTags,
  createSystemEditionNotesTag,
  getSystemEditionCertificateTags,
  getSystemEditionTags,
  createSystemEditionTag,
  updateSystemEditionTag,
  deleteSystemEditionTag,
  updateSystemEditionTagOrder,
  mergeSystemEditionTags,
  mergeTagsValidation,
  getSystemEditionDelegateAccess,
  createSystemEditionDelegateAccess,
  getSystemEditionAdminDocumentTags,
  getSystemEditionAdminCertificateTags,
  updateEditionAdminTag,
  deleteEditionAdminTag,
  mergeEditionAdminTags,
  updateEditionAdminSystemEdition,
  getEditionAdminSystemEdition,
  updateEditionAdminSystemEditionTagOrder,
  getEditionAdminSystemEditionTags,
  createEditionAdminSystemEditionTag,
  getEditionAdminSystemEditionCoBranding,
  updateEditionAdminSystemEditionCoBranding,
  uploadEditionAdminSystemEditionLogo
} from '../controllers/SystemEditionController.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req: Request, file: MulterFile, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Edition Admin system edition
router.put('/edition-admin', authorize('super_admin', 'edition_admin'), updateEditionAdminSystemEdition);
router.get('/edition-admin', authorize('super_admin', 'edition_admin'), getEditionAdminSystemEdition);


// System Edition CRUD (super_admin and edition_admin access)
router.get('/', authorize('super_admin', 'edition_admin'), getAllSystemEditions);
router.get('/:id', authorize('super_admin', 'edition_admin'), getSystemEditionById);
router.post('/', authorize('super_admin'), createSystemEdition);
router.put('/:id', authorize('super_admin', 'edition_admin'), updateSystemEdition);
router.delete('/:id', authorize('super_admin'), deleteSystemEdition);

// System Edition Overview
router.get('/:id/overview', authorize('super_admin', 'edition_admin'), getSystemEditionOverview);

// System Edition Companies
router.get('/:id/companies', authorize('super_admin', 'edition_admin'), getSystemEditionCompanies);

// System Edition Users
router.get('/:id/users', authorize('super_admin', 'edition_admin'), getSystemEditionUsers);
router.put('/:id/users/:userId', authorize('super_admin', 'edition_admin'), updateSystemEditionUser);
router.delete('/:id/users/:userId', authorize('super_admin', 'edition_admin'), deleteSystemEditionUser);
router.get('/:id/company-admins', authorize('super_admin', 'edition_admin'), getSystemEditionCompanyAdmins);
router.get('/:id/edition-admins', authorize('super_admin', 'edition_admin'), getSystemEditionEditionAdmins);
router.get('/:id/edition-admins/:adminId', authorize('super_admin', 'edition_admin'), getSystemEditionEditionAdmin);
router.post('/:id/edition-admins', authorize('super_admin', 'edition_admin'), createSystemEditionEditionAdmin);
router.put('/:id/edition-admins/:adminId', authorize('super_admin', 'edition_admin'), updateSystemEditionEditionAdmin);
router.delete('/:id/edition-admins/:adminId', authorize('super_admin'), deleteSystemEditionEditionAdmin);
router.get('/:id/delegates', authorize('super_admin', 'edition_admin'), getSystemEditionDelegates);

// System Edition Seat Management
router.get('/:id/seat-management', authorize('super_admin', 'edition_admin'), getSystemEditionSeatManagement);
router.put('/:id/seat-management', authorize('super_admin', 'edition_admin'), updateSystemEditionSeatManagement);

// Edition Admin Co-branding
router.get('/edition-admin/co-branding', authorize('super_admin', 'edition_admin'), getEditionAdminSystemEditionCoBranding);
router.put('/edition-admin/co-branding', authorize('super_admin', 'edition_admin'), updateEditionAdminSystemEditionCoBranding);
router.post('/edition-admin/co-branding/upload-logo', authorize('super_admin', 'edition_admin'), upload.single('logo'), uploadEditionAdminSystemEditionLogo);

// System Edition Co-branding
router.get('/:id/co-branding', authorize('super_admin', 'edition_admin'), getSystemEditionCoBranding);
router.put('/:id/co-branding', authorize('super_admin', 'edition_admin'), updateSystemEditionCoBranding);
router.post('/:id/co-branding/upload-logo', authorize('super_admin', 'edition_admin'), upload.single('logo'), uploadSystemEditionLogo);

// Edition Admin Tags
router.get('/edition-admin/tags', authorize('super_admin', 'edition_admin'), getEditionAdminSystemEditionTags);
router.delete('/edition-admin/tags/:tagId', authorize('super_admin', 'edition_admin'), deleteEditionAdminTag);
router.post('/edition-admin/tags', authorize('super_admin', 'edition_admin'), createEditionAdminSystemEditionTag);
router.post('/edition-admin/tags/merge', authorize('super_admin', 'edition_admin'), mergeTagsValidation, validateRequest, mergeEditionAdminTags);
router.put('/edition-admin/tags/order', authorize('super_admin', 'edition_admin'), updateEditionAdminSystemEditionTagOrder);
router.put('/edition-admin/tags/:tagId', authorize('super_admin', 'edition_admin'), updateEditionAdminTag);

// System Edition Tags
router.get('/:id/tags', authorize('super_admin', 'edition_admin'), getSystemEditionTags);
router.post('/:id/tags', authorize('super_admin', 'edition_admin'), createSystemEditionTag);
router.put('/:id/tags/:tagId', authorize('super_admin', 'edition_admin'), updateSystemEditionTag);
router.delete('/:id/tags/:tagId', authorize('super_admin', 'edition_admin'), deleteSystemEditionTag);
router.put('/:id/tags/order', authorize('super_admin', 'edition_admin'), updateSystemEditionTagOrder);
router.post('/:id/tags/merge', authorize('super_admin', 'edition_admin'), mergeTagsValidation, validateRequest, mergeSystemEditionTags);

// Edition Admin Document Tags
router.post('/edition-admin/document-tags', authorize('edition_admin'), createEditionAdminDocumentTag);
router.get('/edition-admin/document-tags', authorize('super_admin', 'edition_admin'), getSystemEditionAdminDocumentTags);

// Edition Admin Certificate Tags
router.get('/edition-admin/certificate-tags', authorize('super_admin', 'edition_admin'), getSystemEditionAdminCertificateTags);

// System Edition Document Tags (convenience routes)
router.get('/:id/document-tags', authorize('super_admin', 'edition_admin'), getSystemEditionDocumentTags);
router.post('/:id/document-tags', authorize('super_admin', 'edition_admin'), createSystemEditionDocumentTag);

// System Edition Notes Tags (convenience routes)
router.get('/:id/notes-tags', authorize('super_admin', 'edition_admin'), getSystemEditionNotesTags);
router.post('/:id/notes-tags', authorize('super_admin', 'edition_admin'), createSystemEditionNotesTag);

// System Edition Certificate Tags (convenience routes)
router.get('/:id/certificate-tags', authorize('super_admin', 'edition_admin'), getSystemEditionCertificateTags);

// System Edition Delegate Access
router.get('/:id/delegate-access', authorize('super_admin', 'edition_admin'), getSystemEditionDelegateAccess);
router.post('/:id/delegate-access', authorize('super_admin', 'edition_admin'), createSystemEditionDelegateAccess);

export default router; 