import { Op, WhereOptions } from 'sequelize';
import { SystemEdition, Company, User, SeatManagement, DelegateAccess, AuditLog, Role, UserRole } from '../../../models/index.js';
import { config } from '../../../config/index.js';
import { logger } from '../../../shared/utils/logger.js';
import { MulterFile } from '../../../shared/types/common.js';
import { s3Service } from '../../../shared/utils/s3.js';
import bcrypt from 'bcryptjs';
import { UserAttributes } from '../../../models/User/index.js';
import { UserRoleAttributes } from '../../../models/UserRole/index.js';

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
  roleName?: string;
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
          attributes: ['id', 'name', 'status', 'type', 'totalSeats', 'usedSeats', 'createdAt'],
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
    const systemEditionData = await SystemEdition.findByPk(id, {
      include: [
        {
          model: Company,
          as: 'companies',
          attributes: ['id'],
        },
      ],
    });

    if (!systemEditionData) {
      throw new Error('System edition not found');
    }

    const systemEdition = systemEditionData?.get({ plain: true });

    // Count users with roles in this system edition
    const usersWithRoles = await UserRole.count({
      where: { 
        systemEditionId: id,
        isActive: true,
        revokedAt: null as any,
      },
    });

    // Count edition admins
    const editionAdminsCount = await UserRole.count({
      where: { 
        systemEditionId: id,
        isActive: true,
        revokedAt: null as any,
      },
      include: [{
        model: Role,
        as: 'role',
        where: { name: 'edition_admin' },
      }],
    });

    const companiesCount = (systemEdition as any).companies?.length || 0;
    const createdByUser = await User.findByPk(systemEdition.createdBy, {
      attributes: ['firstName', 'lastName', 'email']
    });

    const createdByUserData = createdByUser?.getPlainData();
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
      activeUsers: usersWithRoles.toString(),
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
          model: SystemEdition,
          as: 'systemEdition',
          attributes: ['name'],
        },
      ],
    });

    // Enrich companies with company admin information using role-based approach
    const enrichedCompanies = await Promise.all(
      companies.map(async (company) => {
        const companyData = company.get({ plain: true }) as any;
        
        // Find company admin through UserRole
        const companyAdminRole = await UserRole.findOne({
          where: {
            companyId: companyData.id,
            isActive: true,
            revokedAt: null as any,
          },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
            {
              model: Role,
              as: 'role',
              where: { name: 'company_admin' },
            },
          ],
        });

        return {
          ...companyData,
          companyAdmin: companyAdminRole?.user || null,
        };
      })
    );

    return {
      companies: enrichedCompanies,
      total,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  // Get system edition users
  async getSystemEditionUsers(id: string, filters: PaginationFilters) {
    const offset = (filters.page - 1) * filters.limit;
    
    console.log('Service - Filters received:', filters);
    console.log('Service - Initial whereClause for users');

    // Build the base query for users with roles in this system edition
    // First, get user IDs that have roles in this system edition
    const userRoleSubquery = await UserRole.findAll({
      where: {
        systemEditionId: id,
        isActive: true,
        revokedAt: null as any,
      },
      attributes: ['userId'],
      raw: true,
    });

    const userIds = userRoleSubquery.map(ur => ur.userId);

    if (userIds.length === 0) {
      return {
        users: [],
        total: 0,
        totalPages: 0,
      };
    }

    // Build the main query for users - simplified to avoid association issues
    const baseQuery: any = {
      where: {
        id: { [Op.in]: userIds },
      },
      limit: filters.limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'firstName', 'lastName', 'email', 'isActive', 'emailVerified', 'lastLoginAt', 'expirationDate', 'createdAt', 'updatedAt'],
    };

    // Add role filter if specified
    if (filters.roleName) {
      // Filter by role using a subquery approach
      const roleFilteredUserIds = await UserRole.findAll({
        where: {
          systemEditionId: id,
          isActive: true,
          revokedAt: null as any,
        },
        include: [{
          model: Role,
          as: 'role',
          where: { name: filters.roleName },
        }],
        attributes: ['userId'],
        raw: true,
      });
      
      const roleFilteredIds = roleFilteredUserIds.map(ur => ur.userId);
      baseQuery.where.id = { [Op.in]: roleFilteredIds };
      console.log('Service - Added role filter:', filters.roleName);
    }

    // Add search filter if specified
    if (filters.search) {
      baseQuery.where = {
        [Op.and]: [
          { id: { [Op.in]: userIds } },
          {
            [Op.or]: [
              { firstName: { [Op.iLike]: `%${filters.search}%` } },
              { lastName: { [Op.iLike]: `%${filters.search}%` } },
              { email: { [Op.iLike]: `%${filters.search}%` } },
            ],
          },
        ],
      };
    }

    console.log('Service - Final query:', JSON.stringify(baseQuery, null, 2));

    const { rows: users, count: total } = await User.findAndCountAll(baseQuery);

    console.log('Service - Query result count:', users.length);

    // Return raw users for now - the controller will handle formatting
    return {
      users,
      total,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  // Get system edition company admins
  async getSystemEditionCompanyAdmins(id: string, filters: PaginationFilters) {
    const offset = (filters.page - 1) * filters.limit;
    
    // First, get user IDs that have company_admin role in this system edition
    const userRoleSubquery = await UserRole.findAll({
      where: {
        systemEditionId: id,
        isActive: true,
        revokedAt: null as any,
      },
      include: [{
        model: Role,
        as: 'role',
        where: { name: 'company_admin' },
      }],
      attributes: ['userId'],
      raw: true,
    });

    const userIds = userRoleSubquery.map(ur => ur.userId);

    if (userIds.length === 0) {
      return {
        admins: [],
        total: 0,
        totalPages: 0,
      };
    }

    // Build the main query for company admins - simplified to avoid association issues
    const baseQuery: any = {
      where: {
        id: { [Op.in]: userIds },
      },
      limit: filters.limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'firstName', 'lastName', 'email', 'isActive', 'emailVerified', 'lastLoginAt', 'expirationDate', 'createdAt', 'updatedAt'],
    };

    // Add search filter if specified
    if (filters.search) {
      baseQuery.where = {
        [Op.and]: [
          { id: { [Op.in]: userIds } },
          {
            [Op.or]: [
              { firstName: { [Op.iLike]: `%${filters.search}%` } },
              { lastName: { [Op.iLike]: `%${filters.search}%` } },
              { email: { [Op.iLike]: `%${filters.search}%` } },
            ],
          },
        ],
      };
    }

    const { rows: admins, count: total } = await User.findAndCountAll(baseQuery);

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
    
    // First, get user IDs that have edition_admin role in this system edition
    const userRoleSubquery = await UserRole.findAll({
      where: {
        systemEditionId: id,
        isActive: true,
        revokedAt: null as any,
      },
      include: [{
        model: Role,
        as: 'role',
        where: { name: 'edition_admin' },
      }],
      attributes: ['userId'],
      raw: true,
    });

    const userIds = userRoleSubquery.map(ur => ur.userId);

    if (userIds.length === 0) {
      return {
        editionAdmins: [],
        total: 0,
        totalPages: 0,
      };
    }

    // Build the main query for edition admins - simplified to avoid association issues
    const baseQuery: any = {
      where: {
        id: { [Op.in]: userIds },
      },
      limit: filters.limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'firstName', 'lastName', 'email', 'isActive', 'emailVerified', 'lastLoginAt', 'expirationDate', 'createdAt', 'updatedAt'],
    };

    // Add search filter if specified
    if (filters.search) {
      baseQuery.where = {
        [Op.and]: [
          { id: { [Op.in]: userIds } },
          {
            [Op.or]: [
              { firstName: { [Op.iLike]: `%${filters.search}%` } },
              { lastName: { [Op.iLike]: `%${filters.search}%` } },
              { email: { [Op.iLike]: `%${filters.search}%` } },
            ],
          },
        ],
      };
    }

    const { rows: editionAdmins, count: total } = await User.findAndCountAll(baseQuery);

    // Add computed fields for frontend compatibility
    const enrichedEditionAdmins = editionAdmins.map(admin => ({
      ...admin.getPlainData(),
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
    // First verify the user has the edition_admin role for this system edition
    const userRole = await UserRole.findOne({
      where: {
        userId: adminId,
        systemEditionId,
        isActive: true,
        revokedAt: null as any,
      },
      include: [{
        model: Role,
        as: 'role',
        where: { name: 'edition_admin' },
      }],
    });

    if (!userRole) {
      throw new Error('Edition admin not found');
    }

    // Now fetch the user details
    const editionAdmin = await User.findByPk(adminId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'isActive', 'emailVerified', 'lastLoginAt', 'expirationDate', 'createdAt', 'updatedAt'],
    });

    if (!editionAdmin) {
      throw new Error('User not found');
    }

    // Add computed fields for frontend compatibility
    return {
      ...editionAdmin.getPlainData(),
      expiration: !!editionAdmin.expirationDate, // Boolean flag for frontend
    };
  }

  // Create system edition edition admin
  async createSystemEditionEditionAdmin(systemEditionId: string, adminData: {
    firstName: string;
    lastName: string;
    email: string;
    expirationDate?: Date;
    createdBy: string;
  }): Promise<{
    user: UserAttributes;
    userRole: UserRoleAttributes;
  }> {
    console.log('adminData', adminData);
    const { firstName, lastName, email, expirationDate, createdBy } = adminData;

    // Check if user already exists (including soft-deleted users)
    let user = await User.findOne({ 
      where: { email },
      paranoid: false // Include soft-deleted users
    });

    if (!user) {
      console.log('user not found');
      // Create new user
      const hashedPassword = await bcrypt.hash('temp_password_123', config.app.bcryptSaltRounds);
      
      user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        isActive: true,
        emailVerified: false,
        seatAssigned: false,
        licenseType: 'none',
        delegateCount: 0,
        createdBy,
      });
    } else if (user.deletedAt) {
      console.log('user found but soft-deleted, restoring and updating...');
      // User exists but is soft-deleted, restore and update
      await user.restore();
      await user.update({
        firstName,
        lastName,
        isActive: true,
        emailVerified: false,
        seatAssigned: false,
        licenseType: 'none',
        delegateCount: 0,
        createdBy,
      });
    }

    const userData = user.getPlainData();

    // Check if user already has edition_admin role for this system edition
    const existingRole = await UserRole.findOne({
      where: {
        userId: userData.id,
        systemEditionId,
        isActive: true,
        revokedAt: null as any,
      },
      include: [{
        model: Role,
        as: 'role',
        where: { name: 'edition_admin' },
      }],
    });

    if (existingRole) {
      throw new Error('User already has edition_admin role for this system edition');
    }

    // Find the edition_admin role
    const editionAdminRole = await Role.findOne({ where: { name: 'edition_admin' } });
    const editionAdminRoleData = editionAdminRole?.get({ plain: true });
    if (!editionAdminRoleData) {
      throw new Error('Edition admin role not found');
    }

    // Create user role assignment
    const userRoleData: any = {
      userId: userData.id,
      roleId: editionAdminRoleData.id,
      systemEditionId,
      isActive: true,
      grantedBy: createdBy,
      grantedAt: new Date(),
    };

    if (expirationDate) {
      userRoleData.expiresAt = expirationDate;
    }

    const userRole = await UserRole.create(userRoleData);
    const userRoleDataResponse = userRole.get({ plain: true });

    // Set this as the user's active role if they don't have one
    if (!userData.activeUserRoleId) {
      await user.update({ activeUserRoleId: userRoleDataResponse.id });
    }

    const updatedUser = await User.findByPk(userData.id);
    const updatedUserDataResponse = updatedUser?.getPlainData() as UserAttributes;

    return {
      user: updatedUserDataResponse,
      userRole: userRoleDataResponse,
    };
  }

  // Update system edition edition admin
  async updateSystemEditionEditionAdmin(systemEditionId: string, adminId: string, updateData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    expirationDate?: Date;
    lastUpdatedBy: string;
  }) {
    // First verify the user has the edition_admin role for this system edition
    const userRole = await UserRole.findOne({
      where: {
        userId: adminId,
        systemEditionId,
        isActive: true,
        revokedAt: null as any,
      },
      include: [{
        model: Role,
        as: 'role',
        where: { name: 'edition_admin' },
      }],
    });

    if (!userRole) {
      throw new Error('Edition admin not found');
    }

    // Now fetch the user details
    const editionAdmin = await User.findByPk(adminId);
    if (!editionAdmin) {
      throw new Error('User not found');
    }

    const editionAdminData = editionAdmin?.getPlainData();

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
    const updatedAdminData = updatedAdmin?.getPlainData();

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
      where: { id: adminId },
    });

    if (!editionAdmin) {
      throw new Error('Edition admin not found');
    }

    const editionAdminData = editionAdmin?.getPlainData();

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