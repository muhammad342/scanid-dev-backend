import { WhereOptions, Op } from 'sequelize';
import { Company } from '../../../models/Company/index.js';
import { User } from '../../../models/User/index.js';
import { SystemEdition } from '../../../models/SystemEdition/index.js';
import { logger } from '../../../shared/utils/logger.js';
import type { 
  CompanyFilters, 
  CreateCompanyData, 
  UpdateCompanyData, 
  PinManagementData, 
  PinConfiguration,
  CompanyUserFilters 
} from '../types/index.js';

export class CompanyService {
  // Get all companies with filtering and context
  async getAllCompanies(filters: CompanyFilters): Promise<{ companies: any[]; total: number; totalPages: number }> {
    const offset = ((filters.page || 1) - 1) * (filters.limit || 10);
    const whereClause: WhereOptions = {};

    // Apply context filters
    if (filters.systemEditionId) {
      whereClause['systemEditionId'] = filters.systemEditionId;
    }

    if (filters.companyId) {
      whereClause['companyId'] = filters.companyId;
    }

    // Apply search filter
    if (filters.search) {
      whereClause['name'] = { [Op.iLike]: `%${filters.search}%` };
    }

    const { rows: companies, count: total } = await Company.findAndCountAll({
      where: whereClause,
      limit: filters.limit || 10,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'companyAdmin',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: SystemEdition,
          as: 'systemEdition',
          attributes: ['id', 'name'],
        },
      ],
    });

    return {
      companies: companies.map(company => company.get({ plain: true })),
      total,
      totalPages: Math.ceil(total / (filters.limit || 10)),
    };
  }

  // Get company by ID with context validation
  async getCompanyById(id: string, systemEditionId: string, companyId?: string): Promise<any> {
    const whereClause: WhereOptions = {
      id,
      systemEditionId,
    };

    if (companyId) {
      whereClause['companyId'] = companyId;
    }

    const company = await Company.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'companyAdmin',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: SystemEdition,
          as: 'systemEdition',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!company) {
      throw new Error('Company not found');
    }

    return company.get({ plain: true });
  }

  // Create new company
  async createCompany(data: CreateCompanyData): Promise<any> {
    try {
      const newCompany = await Company.create(data);
      return newCompany.get({ plain: true });
    } catch (error) {
      logger.error('Failed to create company:', error);
      throw error;
    }
  }

  // Update company with context validation
  async updateCompany(id: string, data: UpdateCompanyData, systemEditionId: string, companyId?: string): Promise<any> {
    const whereClause: WhereOptions = {
      id,
      systemEditionId,
    };

    if (companyId) {
      whereClause['companyId'] = companyId;
    }

    const company = await Company.findOne({ where: whereClause });
    
    if (!company) {
      throw new Error('Company not found');
    }

    await company.update(data);
    return company.get({ plain: true });
  }

  // Delete company with context validation
  async deleteCompany(id: string, systemEditionId: string, companyId?: string): Promise<void> {
    const whereClause: WhereOptions = {
      id,
      systemEditionId,
    };

    if (companyId) {
      whereClause['companyId'] = companyId;
    }

    const deletedCount = await Company.destroy({ where: whereClause });
    
    if (deletedCount === 0) {
      throw new Error('Company not found');
    }
  }

  // Get company users with context validation
  async getCompanyUsers(filters: CompanyUserFilters): Promise<{ users: any[]; total: number; totalPages: number }> {
    const offset = ((filters.page || 1) - 1) * (filters.limit || 10);
    const whereClause: WhereOptions = {
      companyId: filters.companyId,
    };

    if (filters.search) {
      (whereClause as any)[Op.or] = [
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    if (filters.role) {
      whereClause['role'] = filters.role;
    }

    const { rows: users, count: total } = await User.findAndCountAll({
      where: whereClause,
      limit: filters.limit || 10,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      users: users.map(user => user.get({ plain: true })),
      total,
      totalPages: Math.ceil(total / (filters.limit || 10)),
    };
  }

  // PIN Management Methods

  async updatePinManagement(id: string, data: PinManagementData, encryptionKey: string, systemEditionId: string, companyId?: string): Promise<any> {
    const whereClause: WhereOptions = {
      id,
      systemEditionId,
    };

    if (companyId) {
      whereClause['companyId'] = companyId;
    }

    const company = await Company.findOne({ where: whereClause });
    
    if (!company) {
      throw new Error('Company not found');
    }

    const updateData: any = {};

    // Update master PIN if provided
    if (data.masterPin) {
      company.setMasterPin(data.masterPin, encryptionKey);
      updateData.encryptedMasterPin = company.encryptedMasterPin;
    }

    // Update PIN options if provided
    if (data.pinOptions) {
      updateData.pinOptions = {
        ...company.pinOptions,
        ...data.pinOptions,
      };
    }

    // Update PIN settings if provided
    if (data.pinSettings) {
      updateData.pinSettings = {
        ...company.pinSettings,
        ...data.pinSettings,
      };
    }

    await company.update(updateData);
    return company.get({ plain: true });
  }

  async validateCompanyPin(id: string, pin: string, encryptionKey: string, systemEditionId: string, companyId?: string): Promise<boolean> {
    const whereClause: WhereOptions = {
      id,
      systemEditionId,
    };

    if (companyId) {
      whereClause['companyId'] = companyId;
    }

    const company = await Company.findOne({ where: whereClause });
    
    if (!company) {
      throw new Error('Company not found');
    }

    return company.validateMasterPin(pin, encryptionKey);
  }

  async getPinConfiguration(id: string, systemEditionId: string, companyId?: string): Promise<PinConfiguration> {
    const whereClause: WhereOptions = {
      id,
      systemEditionId,
    };

    if (companyId) {
      whereClause['companyId'] = companyId;
    }

    const company = await Company.findOne({ where: whereClause });
    
    if (!company) {
      throw new Error('Company not found');
    }

    return {
      hasMasterPin: !!company.encryptedMasterPin,
      pinOptions: company.pinOptions,
      pinSettings: company.pinSettings,
    };
  }
}

export const companyService = new CompanyService(); 