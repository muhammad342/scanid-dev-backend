import { Op, WhereOptions } from 'sequelize';
import { SystemEdition, Company, User, SeatManagement, DelegateAccess, AuditLog } from '../../../models/index.js';
import { logger } from '../../../shared/utils/logger.js';
import { MulterFile } from '../../../shared/types/common.js';
import { s3Service } from '../../../shared/utils/s3.js';
import bcrypt from 'bcryptjs';
import { config } from '../../../config/index.js';
import { notificationService } from '../../notifications/services/NotificationService.js';

export interface SystemEditionFilters {
  page: number;
  limit: number;
  editionName?: string;
  archived?: boolean;
}

export interface PaginationFilters {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}

export class SystemEditionService {
  // Get all system editions with filtering
  async getAllSystemEditions(filters: SystemEditionFilters) {
    const offset = (filters.page - 1) * filters.limit;
    const whereClause: WhereOptions = {};

    if (filters.editionName) {
      whereClause['name'] = {
        [Op.iLike]: `%${filters.editionName}%`,
      };
    }

    if (filters.archived !== undefined) {
      whereClause['archived'] = filters.archived;
    }

    const { rows: systemEditions, count: total } = await SystemEdition.findAndCountAll({
      where: whereClause,
      limit: filters.limit,
      offset,
      order: [['createdAt', 'DESC']],
             include: [
         {
           model: User,
           as: 'createdByUser',
           attributes: ['id', 'firstName', 'lastName', 'email'],
         },
       ],
    });

    return {
      systemEditions,
      total,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  // Get system edition by ID
  async getSystemEditionById(id: string) {
    const systemEdition = await SystemEdition.findByPk(id, {
             include: [
         {
           model: User,
           as: 'createdByUser',
           attributes: ['id', 'firstName', 'lastName', 'email'],
         },
         {
           model: SeatManagement,
           as: 'seatManagement',
         },
        {
          model: Company,
          as: 'companies',
          include: [
            {
              model: User,
              as: 'companyAdmin',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
          ],
        },
      ],
    });

    return systemEdition;
  }

  // Create system edition
  async createSystemEdition(systemEditionData: any) {
    const systemEdition = await SystemEdition.create({
      ...systemEditionData,
    });
    const createdSystemEditionData = systemEdition?.get({ plain: true });

    // Log the creation
    await this.logActivity(
      createdSystemEditionData.id,
      createdSystemEditionData.createdBy,
      'create',
      'system_edition',
      `Created system edition: ${createdSystemEditionData?.name || ''}`
    );

    return createdSystemEditionData;
  }

  // Update system edition
  async updateSystemEdition(id: string, updateData: any) {
    const systemEdition = await SystemEdition.findByPk(id);

    if (!systemEdition) {
      return null;
    }

    const updatedSystemEdition = await systemEdition.update(updateData);

    const updatedSystemEditionData = updatedSystemEdition?.get({ plain: true });

    // Log the update
    await this.logActivity(
      updatedSystemEditionData.id,
      updatedSystemEditionData.lastUpdatedBy,
      'update',
      'system_edition',
      `Updated system edition: ${updatedSystemEditionData?.name || ''}`
    );

    return updatedSystemEditionData;
  }

  // Delete system edition (soft delete)
  async deleteSystemEdition(id: string, deletedById: string) {
    const systemEdition = await SystemEdition.findByPk(id);
    const systemEditionData = systemEdition?.get({ plain: true });

    if (!systemEdition) {
      return false;
    }

    await systemEdition.destroy();

    // Log the deletion
    await this.logActivity(
      id,
      deletedById,
      'delete',
      'system_edition',
      `Deleted system edition: ${systemEditionData?.name || ''}`
    );

    return true;
  }

  // Get system edition overview
  async getSystemEditionOverview(id: string) {
    const systemEditionData = await SystemEdition.findByPk(id);

    if (!systemEditionData) {
      return null;
    }

    const systemEdition = systemEditionData?.get({ plain: true });

    const [companiesCount, usersCount, editionAdminsCount, createdByUser] = await Promise.all([
      Company.count({ where: { systemEditionId: id } }),
      User.count({ where: { systemEditionId: id } }),
      User.count({ where: { systemEditionId: id, role: 'edition_admin' } }),
      User.findByPk(systemEdition.createdBy, {
        attributes: ['firstName', 'lastName', 'email']
      }),
    ]);

    const createdByUserData = createdByUser?.get({ plain: true });
    const featuresEnabled = Object.keys(systemEdition.modules || {}).filter(
      (key) => (systemEdition.modules as any)?.[key] === true
    );
    
    const featuresEnabledText = featuresEnabled.length > 0 
      ? featuresEnabled.join(', ') 
      : 'None';

    return {
      dateCreated: systemEdition.createdAt,
      createdBy: createdByUserData?.firstName + ' ' + createdByUserData?.lastName,
      lastUpdate: systemEdition.updatedAt,
      editionName: systemEdition.name,
      editionAdmins: editionAdminsCount.toString(),
      companies: companiesCount.toString(),
      activeUsers: usersCount.toString(),
      featuresEnabled: featuresEnabledText,
    };
  }

  // Get system edition companies
  async getSystemEditionCompanies(id: string, filters: PaginationFilters) {
    const offset = (filters.page - 1) * filters.limit;
    const whereClause: WhereOptions = { systemEditionId: id };

    if (filters.search) {
      whereClause['name'] = {
        [Op.iLike]: `%${filters.search}%`,
      };
    }

    const { rows: companies, count: total } = await Company.findAndCountAll({
      where: whereClause,
      limit: filters.limit,
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
          attributes: ['name'],
        },
      ],
    });

    return {
      companies,
      total,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  // Get system edition users
  async getSystemEditionUsers(id: string, filters: PaginationFilters) {
    const offset = (filters.page - 1) * filters.limit;
    const whereClause: WhereOptions = { systemEditionId: id };

    console.log('Service - Filters received:', filters);
    console.log('Service - Initial whereClause:', whereClause);

    if (filters.role) {
      whereClause['role'] = filters.role;
      console.log('Service - Added role filter:', filters.role);
    }

    if (filters.search) {
      (whereClause as any)[Op.or] = [
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    console.log('Service - Final whereClause:', whereClause);

    const { rows: users, count: total } = await User.findAndCountAll({
      where: whereClause,
      limit: filters.limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name'],
        },
      ],
    });

    console.log('Service - Query result count:', users.length);
    console.log('Service - User roles found:', users.map(u => u.role));

    return {
      users,
      total,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  // Get system edition company admins
  async getSystemEditionCompanyAdmins(id: string, filters: PaginationFilters) {
    const offset = (filters.page - 1) * filters.limit;
    const whereClause: WhereOptions = { 
      systemEditionId: id,
      role: 'company_admin',
    };

    if (filters.search) {
      (whereClause as any)[Op.or] = [
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    const { rows: admins, count: total } = await User.findAndCountAll({
      where: whereClause,
      limit: filters.limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name'],
        },
      ],
    });

    return {
      admins,
      total,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  // Get system edition delegates
  async getSystemEditionDelegates(id: string, filters: PaginationFilters) {
    const offset = (filters.page - 1) * filters.limit;
    const whereClause: WhereOptions = { systemEditionId: id };

    if (filters.search) {
      // We'll need to search in related User models
    }

    const { rows: delegateAccess, count: total } = await DelegateAccess.findAndCountAll({
      where: whereClause,
      limit: filters.limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'delegate',
          attributes: ['id', 'firstName', 'lastName', 'email', 'lastLoginAt'],
        },
        {
          model: User,
          as: 'delegator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    return {
      delegates: delegateAccess,
      total,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  // Get system edition seat management
  async getSystemEditionSeatManagement(id: string) {
    const seatManagement = await SeatManagement.findOne({
      where: { systemEditionId: id },
    });

    return seatManagement;
  }

  // Update system edition seat management
  async updateSystemEditionSeatManagement(id: string, updateData: any) {
    const seatManagement = await SeatManagement.findOne({
      where: { systemEditionId: id },
    });

    if (!seatManagement) {
      return null;
    }

    const updatedSeatManagement = await seatManagement.update(updateData);

    // Log the update
    await this.logActivity(
      id,
      updateData.lastUpdatedBy,
      'update',
      'seat_management',
      'Updated seat management configuration'
    );

    return updatedSeatManagement;
  }

  // Get system edition co-branding (from SystemEdition)
  async getSystemEditionCoBranding(id: string) {
    const systemEdition = await SystemEdition.findByPk(id, {
      attributes: ['organizationName', 'slogan', 'logoUrl', 'primaryBrandColor', 'secondaryBrandColor']
    });
    const systemEditionData = systemEdition?.dataValues;

    if (!systemEditionData) {
      return null;
    }

    return {
      organizationName: systemEditionData.organizationName || '',
      slogan: systemEditionData.slogan || '',
      logoUrl: systemEditionData.logoUrl || '',
      primaryBrandColor: systemEditionData.primaryBrandColor || '',
      secondaryBrandColor: systemEditionData.secondaryBrandColor || '',
    };
  }

  // Update system edition co-branding
  async updateSystemEditionCoBranding(id: string, updateData: any) {
    const systemEdition = await SystemEdition.findByPk(id);

    if (!systemEdition) {
      return null;
    }

    // Extract co-branding fields from updateData
    const coBrandingData: any = {};
    if (updateData.organizationName !== undefined) {
      coBrandingData.organizationName = updateData.organizationName;
    }
    if (updateData.slogan !== undefined) {
      coBrandingData.slogan = updateData.slogan;
    }
    if (updateData.logoUrl !== undefined) {
      coBrandingData.logoUrl = updateData.logoUrl;
    }
    if (updateData.primaryBrandColor !== undefined) {
      coBrandingData.primaryBrandColor = updateData.primaryBrandColor;
    }
    if (updateData.secondaryBrandColor !== undefined) {
      coBrandingData.secondaryBrandColor = updateData.secondaryBrandColor;
    }

    // Update the system edition with co-branding data
    const updatedSystemEdition = await systemEdition.update(coBrandingData);
    const updatedSystemEditionData = updatedSystemEdition?.get({ plain: true });

    // Log the update
    await this.logActivity(
      id,
      updateData.lastUpdatedBy,
      'update',
      'co_branding',
      'Updated co-branding configuration',
      coBrandingData
    );

    return {
      organizationName: updatedSystemEditionData.organizationName || '',
      slogan: updatedSystemEditionData.slogan || '',
      logoUrl: updatedSystemEditionData.logoUrl || '',
      primaryBrandColor: updatedSystemEditionData.primaryBrandColor || '',
      secondaryBrandColor: updatedSystemEditionData.secondaryBrandColor || '',
    };
  }
  // Get system edition delegate access
  async getSystemEditionDelegateAccess(id: string, filters: PaginationFilters) {
    const offset = (filters.page - 1) * filters.limit;
    const whereClause: WhereOptions = { systemEditionId: id };

    const { rows: delegateAccess, count: total } = await DelegateAccess.findAndCountAll({
      where: whereClause,
      limit: filters.limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'delegate',
          attributes: ['id', 'firstName', 'lastName', 'email', 'lastLoginAt'],
        },
        {
          model: User,
          as: 'delegator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    return {
      delegateAccess,
      total,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  // Create system edition delegate access
  async createSystemEditionDelegateAccess(id: string, delegateData: any) {
    const delegateAccess = await DelegateAccess.create({
      ...delegateData,
      systemEditionId: id,
    });

    // Log the creation
    await this.logActivity(
      id,
      delegateData.createdBy,
      'create',
      'delegate_access',
      `Created delegate access for user: ${delegateData.delegateId}`
    );

    return delegateAccess;
  }

  // Upload system edition logo
  async uploadSystemEditionLogo(id: string, file: MulterFile, updatedBy: string): Promise<string> {
    const systemEdition = await SystemEdition.findByPk(id);

    if (!systemEdition) {
      throw new Error('System edition not found');
    }

    try {
      // Get current logo URL to delete old logo if exists
      const currentLogoUrl = systemEdition.logoUrl;

      // Upload the new logo to S3
      const uploadResult = await s3Service.uploadSystemEditionLogo(id, file);

      // Update the system edition with the new logo URL
      await systemEdition.update({
        logoUrl: uploadResult.url,
      });

      // Delete the old logo if it exists and is different from the new one
      if (currentLogoUrl && currentLogoUrl !== uploadResult.url) {
        try {
          await s3Service.deleteSystemEditionLogo(currentLogoUrl);
        } catch (deleteError) {
          // Log but don't fail the upload if old logo deletion fails
          logger.warn('Failed to delete old logo', {
            systemEditionId: id,
            oldLogoUrl: currentLogoUrl,
            error: deleteError instanceof Error ? deleteError.message : 'Unknown error',
          });
        }
      }

      // Log the update
      await this.logActivity(
        id,
        updatedBy,
        'update',
        'co_branding',
        'Updated system edition logo',
        { 
          logoUrl: uploadResult.url,
          s3Key: uploadResult.key,
          originalname: uploadResult.originalname,
          size: uploadResult.size,
        }
      );

      logger.info('System edition logo uploaded successfully', {
        systemEditionId: id,
        logoUrl: uploadResult.url,
        uploadedBy: updatedBy,
      });

      return uploadResult.url;
    } catch (error) {
      logger.error('Failed to upload system edition logo', {
        systemEditionId: id,
        filename: file.originalname,
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedBy,
      });

      throw new Error(`Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get system edition edition admins
  async getSystemEditionEditionAdmins(id: string, filters: PaginationFilters) {
    const offset = (filters.page - 1) * filters.limit;
    const whereClause: WhereOptions = { 
      systemEditionId: id,
      role: 'edition_admin',
    };

    if (filters.search) {
      (whereClause as any)[Op.or] = [
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    const { rows: editionAdmins, count: total } = await User.findAndCountAll({
      where: whereClause,
      limit: filters.limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name'],
        },
      ],
    });

    // Add computed fields for frontend compatibility
    const enrichedEditionAdmins = editionAdmins.map(admin => ({
      ...admin.toJSON(),
      expiration: !!admin.expirationDate, // Boolean flag for frontend
    }));

    return {
      editionAdmins: enrichedEditionAdmins,
      total,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  // Get single system edition edition admin
  async getSystemEditionEditionAdmin(systemEditionId: string, adminId: string) {
    const editionAdmin = await User.findOne({
      where: {
        id: adminId,
        systemEditionId: systemEditionId,
        role: 'edition_admin',
      },
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!editionAdmin) {
      throw new Error('Edition admin not found');
    }

    // Add computed fields for frontend compatibility
    return {
      ...editionAdmin.toJSON(),
      expiration: !!editionAdmin.expirationDate, // Boolean flag for frontend
    };
  }

  // Create system edition edition admin
  async createSystemEditionEditionAdmin(id: string, adminData: {
    firstName: string;
    lastName: string;
    email: string;
    expirationDate?: Date;
    createdBy: string;
  }) {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: adminData.email } });
    
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Get the system edition name
    const systemEdition = await SystemEdition.findByPk(id);
    if (!systemEdition) {
      throw new Error('System edition not found');
    }

    // Generate a random password
    const generateRandomPassword = () => {
      const length = 12;
      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      let password = "";
      
      // Ensure at least one character from each required category
      password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
      password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
      password += "0123456789"[Math.floor(Math.random() * 10)]; // number
      password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // special
      
      // Fill the rest
      for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
      }
      
      // Shuffle the password
      return password.split('').sort(() => 0.5 - Math.random()).join('');
    };

    const randomPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, config.app.bcryptSaltRounds);

    // Create the edition admin user
    const editionAdmin = await User.create({
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      email: adminData.email,
      password: hashedPassword,
      role: 'edition_admin',
      systemEditionId: id,
      isActive: true,
      emailVerified: false,
      seatAssigned: false,
      licenseType: 'none',
      delegateCount: 0,
      createdBy: adminData.createdBy,
      ...(adminData.expirationDate && { expirationDate: adminData.expirationDate }),
    });

    // Send welcome email with credentials
    try {
      await notificationService.sendEditionAdminWelcomeEmail(
        adminData.email,
        adminData.firstName,
        systemEdition.name,
        randomPassword,
        adminData.expirationDate
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw error here as the user was created successfully
    }

    // Log the creation
    await AuditLog.create({
      systemEditionId: id,
      userId: adminData.createdBy,
      action: 'create',
      module: 'users',  // Changed from 'edition_admin' to 'users' as it's a user-related action
      description: `Created edition admin: ${adminData.firstName} ${adminData.lastName} (${adminData.email})`,
    });

    return {
      user: {
        ...editionAdmin.toJSON(),
        expiration: !!editionAdmin.expirationDate, // Boolean flag for frontend
      },
      tempPassword: randomPassword, // Return the temporary password for communication to the admin
      message: 'Edition admin created successfully',
    };
  }

  // Update system edition edition admin
  async updateSystemEditionEditionAdmin(systemEditionId: string, adminId: string, updateData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    expirationDate?: Date;
    lastUpdatedBy?: string;
  }) {
    // Find the edition admin
    const editionAdmin = await User.findOne({
      where: {
        id: adminId,
        systemEditionId: systemEditionId,
        role: 'edition_admin',
      },
    });

    if (!editionAdmin) {
      throw new Error('Edition admin not found');
    }

    const editionAdminData = editionAdmin?.get({ plain: true });

    // Check if email is being changed and if it's already taken by another user
    if (updateData.email && updateData.email !== editionAdminData.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email: updateData.email,
          id: { [Op.ne]: adminId } // Exclude the current admin from the check
        } 
      });
      if (existingUser) {
        throw new Error('Email already exists');
      }
    }

    // Update the edition admin
    const updatedAdmin = await editionAdmin.update(updateData);
    const updatedAdminData = updatedAdmin?.get({ plain: true });

    await this.logActivity(
      systemEditionId,
      updateData.lastUpdatedBy || '',
      'update',
      'edition_admin',
      `Updated edition admin: (${updatedAdminData.email})`
    );

    // Add computed fields for frontend compatibility
    return {
      ...updatedAdminData,
      expiration: !!updatedAdminData.expirationDate, // Boolean flag for frontend
    };
  }

  // Delete system edition edition admin
  async deleteSystemEditionEditionAdmin(systemEditionId: string, adminId: string, deletedBy: string) {
    // Find the edition admin
    const editionAdmin = await User.findOne({
      where: {
        id: adminId,
        systemEditionId: systemEditionId,
        role: 'edition_admin',
      },
    });

    if (!editionAdmin) {
      throw new Error('Edition admin not found');
    }

    const editionAdminData = editionAdmin?.get({ plain: true });

    // Soft delete the edition admin
    await editionAdmin.destroy();

    // Log the deletion
    await this.logActivity(
      systemEditionId,
      deletedBy,
      'delete',
      'edition_admin',
      `Deleted edition admin: (${editionAdminData.email})`
    );

    return true;
  }

  // Helper method to log activities
  private async logActivity(
    systemEditionId: string,
    userId: string,
    action: string,
    module: string,
    description: string,
    metadata?: Record<string, any>
  ) {
    try {
      const logData: any = {
        systemEditionId,
        userId,
        action,
        module: module as any, // Cast to any to avoid type mismatch
        description,
      };

      if (metadata) {
        logData.metadata = metadata;
      }

      await AuditLog.create(logData);
    } catch (error) {
      logger.error('Failed to log activity:', error);
    }
  }
}

export const systemEditionService = new SystemEditionService(); 