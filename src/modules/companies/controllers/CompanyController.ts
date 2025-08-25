import { Response } from 'express';
import { asyncHandler } from '../../../shared/middleware/errorHandler.js';
import { sendSuccess, sendBadRequest, sendPaginatedResponse, sendForbidden, sendNotFound } from '../../../shared/utils/response.js';
import { companyService } from '../services/CompanyService.js';
import { RequestWithContext } from '../../../shared/middleware/contextResolver.js';
import { config } from '../../../config/index.js';
import type { CompanyFilters, CreateCompanyData, PinManagementData } from '../types/index.js';

export class CompanyController {
  // Get all companies with filtering
  static getAllCompanies = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    
    const filters: CompanyFilters = {
      page,
      limit,
      search: req.query['search'] as string | undefined,
      systemEditionId: context.systemEditionId,
      companyId: context.companyId,
    };

    const result = await companyService.getAllCompanies(filters);

    sendPaginatedResponse(
      res,
      result.companies,
      { page, limit, total: result.total },
      'Companies retrieved successfully'
    );
  });

  // Create new company
  static createCompany = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    
    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    const data: CreateCompanyData = {
      ...req.body,
      systemEditionId: context.systemEditionId,
      companyId: context.companyId,
      createdBy: context.userId,
    };

    const newCompany = await companyService.createCompany(data);
    
    sendSuccess(res, newCompany, 'Company created successfully', 201);
  });

  // Get company by ID
  static getCompanyById = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    const { id } = req.params;

    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    if (!id) {
      return sendBadRequest(res, 'Company ID is required');
    }

    const company = await companyService.getCompanyById(id, context.systemEditionId, context.companyId);
    
    sendSuccess(res, company, 'Company retrieved successfully');
  });

  // Update company
  static updateCompany = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    const { id } = req.params;

    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    if (!id) {
      return sendBadRequest(res, 'Company ID is required');
    }

    const updatedCompany = await companyService.updateCompany(id, req.body, context.systemEditionId, context.companyId);
    
    sendSuccess(res, updatedCompany, 'Company updated successfully');
  });

  // Delete company
  static deleteCompany = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    const { id } = req.params;

    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    if (!id) {
      return sendBadRequest(res, 'Company ID is required');
    }

    await companyService.deleteCompany(id, context.systemEditionId, context.companyId);
    
    sendSuccess(res, null, 'Company deleted successfully');
  });

  // Get company users
  static getCompanyUsers = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    const { id } = req.params;

    if (!context?.companyId) {
      return sendBadRequest(res, 'Company ID is required');
    }

    if (!id) {
      return sendBadRequest(res, 'Company ID is required');
    }

    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const role = req.query['role'] as "company_admin" | "user" | "delegate" | undefined;
    
    const filters = {
      page,
      limit,
      search: req.query['search'] as string | undefined,
      companyId: context.companyId,
      role,
    };

    const result = await companyService.getCompanyUsers(filters);

    sendPaginatedResponse(
      res,
      result.users,
      { page, limit, total: result.total },
      'Company users retrieved successfully'
    );
  });

  // Update PIN management
  static updatePinManagement = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    const { id } = req.params;

    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    if (!id) {
      return sendBadRequest(res, 'Company ID is required');
    }

    // Only super_admin, edition_admin, and company_admin can update PIN settings
    if (!['super_admin', 'edition_admin', 'company_admin'].includes(context.roleName || '')) {
      return sendForbidden(res, 'Insufficient permissions to update PIN settings');
    }

    const pinData: PinManagementData = req.body;

    const company = await companyService.updatePinManagement(
      id,
      pinData,
      config.app.jwtSecret,
      context.systemEditionId,
      context.companyId
    );

    sendSuccess(res, {
      hasMasterPin: !!company.encryptedMasterPin,
      pinOptions: company.pinOptions,
      pinSettings: company.pinSettings,
    }, 'PIN management settings updated successfully');
  });

  // Validate company PIN
  static validateCompanyPin = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    const { id } = req.params;
    const { pin } = req.body;

    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    if (!id) {
      return sendBadRequest(res, 'Company ID is required');
    }

    if (!pin) {
      return sendBadRequest(res, 'PIN is required');
    }

    const isValid = await companyService.validateCompanyPin(
      id,
      pin,
      config.app.jwtSecret,
      context.systemEditionId,
      context.companyId
    );

    sendSuccess(res, { isValid }, isValid ? 'PIN is valid' : 'PIN is invalid');
  });

  // Get PIN configuration
  static getPinConfiguration = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;
    const { id } = req.params;

    if (!context?.systemEditionId) {
      return sendBadRequest(res, 'System edition ID is required');
    }

    if (!id) {
      return sendBadRequest(res, 'Company ID is required');
    }

    const config = await companyService.getPinConfiguration(id, context.systemEditionId, context.companyId);

    sendSuccess(res, config, 'PIN configuration retrieved successfully');
  });

  // Get logged-in user's company details
  static getMyCompany = asyncHandler(async (req: RequestWithContext, res: Response) => {
    const context = req.resolvedContext;

    if (!context?.companyId) {
      return sendBadRequest(res, 'Company ID is required');
    }

    try {
      // Use the resolved company ID from context instead of fetching by userId
      const company = await companyService.getCompanyById(context.companyId, context.systemEditionId || '');
      sendSuccess(res, company, 'Company details retrieved successfully');
    } catch (error) {
      if (error instanceof Error && error.message === 'Company not found') {
        return sendNotFound(res, 'No company found for the logged-in user');
      }
      throw error;
    }
  });
} 