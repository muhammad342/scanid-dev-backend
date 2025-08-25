import bcrypt from 'bcryptjs';
import { User } from '../../../models/User/index.js';
import { config } from '../../../config/index.js';
import { generateToken } from '../../../shared/middleware/auth.js';
import { AuthenticatedUser } from '../../../shared/types/common.js';
import { Op } from 'sequelize';
import { Company } from '../../../models/Company/index.js';
import { SystemEdition } from '../../../models/SystemEdition/index.js';
import { UserRole } from '../../../models/UserRole/index.js';
import { Role } from '../../../models/Role/index.js';
import type { ResolvedContext } from '../../../shared/middleware/contextResolver.js';
import type { CreateUserData } from '../types/index.js';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles?: Array<{
    roleName: 'super_admin' | 'edition_admin' | 'company_admin' | 'channel_admin' | 'user' | 'delegate';
    systemEditionId?: string;
    companyId?: string;
    channelId?: string;
    expiresAt?: Date;
  }>;
  isActive?: boolean;
  emailVerified?: boolean;
  createdBy?: string;
}

export interface CreateCompanyAdminDto {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  companyId: string;
  systemEditionId?: string;
  expirationDate?: Date;
  createdBy: string;
}

export interface CreateCompanyUserDto {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  companyId: string;
  systemEditionId?: string;
  expirationDate?: Date;
  createdBy: string;
  seatAssigned?: boolean;
  licenseType?: 'organizational_seat' | 'individual_parent' | 'individual_child' | 'none';
  roles?: Array<{
    roleName: 'user' | 'delegate' | 'company_admin' | 'edition_admin' | 'super_admin';
    systemEditionId?: string;
    companyId?: string;
    channelId?: string;
    expiresAt?: Date;
  }>;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  activeRole?: {
    id: string;
    roleName: string;
    systemEditionId?: string;
    companyId?: string;
    channelId?: string;
    expiresAt?: Date;
  };
  availableRoles?: Array<{
    id: string;
    roleName: string;
    systemEditionId?: string;
    companyId?: string;
    channelId?: string;
    expiresAt?: Date;
    isActive: boolean;
  }>;
  isActive: boolean;
  emailVerified: boolean;
  phoneNumber?: string | undefined;
  expirationDate?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
  seatAssigned?: boolean;
  licenseType?: string;
  delegateCount?: number;
  lastLoginAt?: Date | undefined;
  company?: {
    id: string;
    name: string;
    email?: string;
  };
  systemEdition?: {
    id: string;
    name: string;
    organizationName?: string;
  };
  companyAssociations?: string[]; // Array of company IDs the user is associated with
}

export class UserService {

  async createUser(userData: CreateUserDto): Promise<UserResponse> {
    const existingUser = await User.findOne({ where: { email: userData.email } });
    
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(userData.password, config.app.bcryptSaltRounds);

    // Create user without role field
    const userCreateData: any = {
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : false,
    };

    if (userData.phoneNumber) {
      userCreateData.phoneNumber = userData.phoneNumber;
    }

    if (userData.createdBy) {
      userCreateData.createdBy = userData.createdBy;
    }

    const user = await User.create(userCreateData);
    const userDataResponse = user.get({ plain: true });

    // Create user roles if specified, otherwise default to 'user' role
    const rolesToCreate = userData.roles || [{ roleName: 'user' }];

    
    for (const roleData of rolesToCreate) {
      // Find the role by name
      const role = await Role.findOne({ where: { name: roleData.roleName } });
      const roleDataResponse = role?.get({ plain: true });
      if (!role) {
        throw new Error(`Role '${roleData.roleName}' not found`);
      }

      // Create user role assignment
      const userRoleData: any = {
        userId: userDataResponse.id,
        roleId: roleDataResponse?.id,
        isActive: true,
      };

      if (roleData.systemEditionId) {
        userRoleData.systemEditionId = roleData.systemEditionId;
      }

      if (roleData.companyId) {
        userRoleData.companyId = roleData.companyId;
      }

      if (roleData.channelId) {
        userRoleData.channelId = roleData.channelId;
      }

      if (roleData.expiresAt) {
        userRoleData.expiresAt = roleData.expiresAt;
      }

      if (userData.createdBy) {
        userRoleData.grantedBy = userData.createdBy;
      }

      await UserRole.create(userRoleData);
    }

    // Set the first role as active if any roles were created
    if (rolesToCreate.length > 0) {
      const firstUserRole = await UserRole.findOne({
        where: { userId: userDataResponse.id },
        include: [{ model: Role, as: 'role' }],
      });
      const firstUserRoleData = firstUserRole?.get({ plain: true });
      if (firstUserRoleData) {
        await this.setUserActiveRole(userDataResponse.id, firstUserRoleData.id);
      } 
    }

    return await this.formatUserResponse(user);
  }

  async createUserWithContext(userData: CreateUserData, context: ResolvedContext): Promise<UserResponse> {
    const existingUser = await User.findOne({ where: { email: userData.email } });
    
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Validate context-based constraints
    if (context.roleName === 'company_admin') {
      // Check if trying to create users with higher privileges
      const rolesToCreate = userData.roles || [{ roleName: 'user' }];
      for (const role of rolesToCreate) {
        if (['super_admin', 'edition_admin'].includes(role.roleName)) {
          throw new Error('Company admins can not create super admins and edition admins');
        }
      }
    }

    if (context.roleName === 'edition_admin') {
      // Check if trying to create super admin
      const rolesToCreate = userData.roles || [{ roleName: 'user' }];
      for (const role of rolesToCreate) {
        if (role.roleName === 'super_admin') {
          throw new Error('Edition admins cannot create super admins');
        }
      }
    }

    // Note: Password generation is now handled by the UserTrigger
    // The trigger will generate a secure password and update the user record
    // For now, we'll use a placeholder password that will be replaced
    let password = userData.password || 'placeholder_password_will_be_replaced';

    const hashedPassword = await bcrypt.hash(password, config.app.bcryptSaltRounds);

    const userCreateData: any = {
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : false,
      createdBy: userData.createdBy,
      seatAssigned: userData.seatAssigned !== undefined ? userData.seatAssigned : false,
      licenseType: userData.licenseType || 'none',
    };

    // Add optional fields if provided
    if (userData.phoneNumber) {
      userCreateData.phoneNumber = userData.phoneNumber;
    }
    if (userData.expirationDate) {
      userCreateData.expirationDate = userData.expirationDate;
    }

    const user = await User.create(userCreateData);

    // Create user roles if specified, otherwise default to 'user' role
    const rolesToCreate = userData.roles || [{ roleName: 'user' }];
    
    for (const roleData of rolesToCreate) {
      // Find the role by name
      const role = await Role.findOne({ where: { name: roleData.roleName } });
      if (!role) {
        throw new Error(`Role '${roleData.roleName}' not found`);
      }

      // Create user role assignment
      const userRoleData: any = {
        userId: user.id,
        roleId: role.id,
        isActive: true,
      };

      if (roleData.systemEditionId) {
        userRoleData.systemEditionId = roleData.systemEditionId;
      } else if (context.systemEditionId) {
        userRoleData.systemEditionId = context.systemEditionId;
      }

      if (roleData.companyId) {
        userRoleData.companyId = roleData.companyId;
      } else if (context.companyId && context.roleName !== 'super_admin') {
        userRoleData.companyId = context.companyId;
      }

      if (roleData.channelId) {
        userRoleData.channelId = roleData.channelId;
      }

      if (roleData.expiresAt) {
        userRoleData.expiresAt = roleData.expiresAt;
      }

      if (userData.createdBy) {
        userRoleData.grantedBy = userData.createdBy;
      }

      await UserRole.create(userRoleData);
    }

    // Set the first role as active if any roles were created
    if (rolesToCreate.length > 0) {
      const firstUserRole = await UserRole.findOne({
        where: { userId: user.id },
        include: [{ model: Role, as: 'role' }],
      });
      if (firstUserRole) {
        await this.setUserActiveRole(user.id, firstUserRole.id);
      }
    }

    // Update company used seats if seat is assigned and company context is available
    if (userData.seatAssigned && context.companyId) {
      try {
        const company = await Company.findByPk(context.companyId);
        if (company) {
          const currentUsedSeats = company.usedSeats || 0;
          await company.update({ usedSeats: currentUsedSeats + 1 });
        }
      } catch (error) {
        console.error('Error updating company used seats:', error);
      }
    }

    return await this.formatUserResponse(user);
  }

  async createCompanyAdmin(adminData: CreateCompanyAdminDto): Promise<UserResponse> {
    const existingUser = await User.findOne({ where: { email: adminData.email } });
    
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Note: Password generation is now handled by the UserTrigger
    // The trigger will generate a secure password and update the user record
    // For now, we'll use a placeholder password that will be replaced
    const tempPassword = 'placeholder_password_will_be_replaced';
    const hashedPassword = await bcrypt.hash(tempPassword, config.app.bcryptSaltRounds);

    const userCreateData: any = {
      email: adminData.email,
      password: hashedPassword,
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      isActive: adminData.isActive !== undefined ? adminData.isActive : true,
      emailVerified: adminData.emailVerified !== undefined ? adminData.emailVerified : false,
      createdBy: adminData.createdBy,
    };

    const user = await User.create(userCreateData);

    // Create company_admin role assignment
    const companyAdminRole = await Role.findOne({ where: { name: 'company_admin' } });
    if (!companyAdminRole) {
      throw new Error('Company admin role not found');
    }

    const userRoleData: any = {
      userId: user.id,
      roleId: companyAdminRole.id,
      isActive: true,
      grantedBy: adminData.createdBy,
      grantedAt: new Date(),
    };

    if (adminData.companyId) {
      userRoleData.companyId = adminData.companyId;
    }

    await UserRole.create(userRoleData);

    // Set this as the user's active role
    const userRole = await UserRole.findOne({
      where: { userId: user.id },
      include: [{ model: Role, as: 'role' }],
    });
    if (userRole) {
      await this.setUserActiveRole(user.id, userRole.id);
    }

    return await this.formatUserResponse(user);
  }

  async createCompanyUser(userData: CreateCompanyUserDto): Promise<UserResponse> {
    const existingUser = await User.findOne({ where: { email: userData.email } });
    
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Note: Password generation is now handled by the UserTrigger
    // The trigger will generate a secure password and update the user record
    // For now, we'll use a placeholder password that will be replaced
    const tempPassword = 'placeholder_password_will_be_replaced';
    const hashedPassword = await bcrypt.hash(tempPassword, config.app.bcryptSaltRounds);

    const userCreateData: any = {
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      // Note: role field removed from User model - now handled through UserRole table
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : false,
      companyId: userData.companyId,
      createdBy: userData.createdBy,
      seatAssigned: userData.seatAssigned !== undefined ? userData.seatAssigned : false,
      systemEditionId: userData.systemEditionId || '',
      licenseType: userData.licenseType || 'none',
    };

    if (userData.phoneNumber) {
      userCreateData.phoneNumber = userData.phoneNumber;
    }
    if (userData.systemEditionId) {
      userCreateData.systemEditionId = userData.systemEditionId;
    }
    if (userData.expirationDate) {
      userCreateData.expirationDate = userData.expirationDate;
    }
console.log("userDataResponse before", userData)
    const user = await User.create(userCreateData);
    const userDataResponse = user.get({ plain: true });

    console.log("userDataResponse", userDataResponse)

    // Update company used seats if seat is assigned
    if (userData.seatAssigned && userData.companyId) {
      try {
        const company = await Company.findByPk(userData.companyId);
        if (company) {
          const currentUsedSeats = company.usedSeats || 0;
          await company.update({ usedSeats: currentUsedSeats + 1 });
        }
      } catch (error) {
        console.error('Error updating company used seats:', error);
      }
    }

    return await this.formatUserResponse(userDataResponse as User);
  }

  async createUserWithUserRoles(userData: any, userRoles: Array<{
    editionId?: string;
    channelId?: string;
    companyId?: string;
    roleId: string;
  }>, context: ResolvedContext): Promise<UserResponse> {
    const existingUser = await User.findOne({ where: { email: userData.email } });
    
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Note: Password generation is now handled by the UserTrigger
    // The trigger will generate a secure password and update the user record
    // For now, we'll use a placeholder password that will be replaced
    let password = userData.password || 'placeholder_password_will_be_replaced';

    const hashedPassword = await bcrypt.hash(password, config.app.bcryptSaltRounds);

    const userCreateData: any = {
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : false,
      createdBy: context.userId,
      seatAssigned: userData.seatAssigned !== undefined ? userData.seatAssigned : false,
      licenseType: userData.licenseType || 'none',
    };

    // Add optional fields if provided
    if (userData.phoneNumber) {
      userCreateData.phoneNumber = userData.phoneNumber;
    }
    if (userData.expirationDate) {
      userCreateData.expirationDate = userData.expirationDate;
    }

    const user = await User.create(userCreateData);
    const createdUser = user.getPlainData();

    // Create user roles from the provided userRoles array
    for (const userRoleData of userRoles) {
      // Validate that the role exists
      const role = await Role.findByPk(userRoleData.roleId);
      if (!role) {
        throw new Error(`Role with ID '${userRoleData.roleId}' not found`);
      }

      // Create user role assignment
      const userRoleCreateData: any = {
        userId: createdUser.id,
        roleId: userRoleData.roleId,
        isActive: true,
        grantedBy: context.userId,
        grantedAt: new Date(),
      };

      // Add optional context fields
      if (userRoleData.editionId) {
        userRoleCreateData.systemEditionId = userRoleData.editionId;
      }
      if (userRoleData.companyId) {
        userRoleCreateData.companyId = userRoleData.companyId;
      }
      if (userRoleData.channelId) {
        userRoleCreateData.channelId = userRoleData.channelId;
      }

      await UserRole.create(userRoleCreateData);
    }

    // Set the first role as active if any roles were created
    if (userRoles.length > 0) {
      const firstUserRole = await UserRole.findOne({
        where: { userId: createdUser.id },
        include: [{ model: Role, as: 'role' }],
      });
      const firstUserRoleResponse = firstUserRole?.get({ plain: true });
      if (firstUserRoleResponse) {
        await this.setUserActiveRole(createdUser.id, firstUserRoleResponse.id);
      }
    }

    // Update company used seats if seat is assigned and company context is available
    if (userData.seatAssigned && userRoles.some(ur => ur.companyId)) {
      try {
        const companyId = userRoles.find(ur => ur.companyId)?.companyId;
        if (companyId) {
          const company = await Company.findByPk(companyId);
          if (company) {
            const currentUsedSeats = company.usedSeats || 0;
            await company.update({ usedSeats: currentUsedSeats + 1 });
          }
        }
      } catch (error) {
        console.error('Error updating company used seats:', error);
      }
    }

    return await this.formatUserResponse(user);
  }

  async getUserByEmail(email: string): Promise<UserResponse | null> {
    const user = await User.findOne({ where: { email } });
    return user ? await this.formatUserResponse(user) : null;
  }

  async loginUser(loginData: LoginDto): Promise<{ user: UserResponse; token: string }> {
    const user = await User.findOne({ where: { email: loginData.email } });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const userData = user?.get({ plain: true });

    const isPasswordValid = await bcrypt.compare(loginData.password, userData.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if (!userData.isActive) {
      throw new Error('Account is deactivated');
    }

    await user.update({ lastLoginAt: new Date() });

    // Get user's active role for token payload
    await this.validateUserActiveRole(userData.id); // Ensure active role is valid
    
    const tokenPayload: any = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
    };

    console.log("userData.activeUserRoleId", userData.activeUserRoleId)

    if (userData.activeUserRoleId) {
      tokenPayload.activeUserRoleId = userData.activeUserRoleId;
    }

    const token = generateToken(tokenPayload);

    return {
      user: await this.formatUserResponse(userData as User),
      token,
    };
  }

  async getUserById(id: string, context?: ResolvedContext): Promise<UserResponse | null> {
    if (context) {
      const whereClause: any = { id };

      // Apply context-based filtering
      if (context.systemEditionId) {
        whereClause['systemEditionId'] = context.systemEditionId;
      }

      if (context.companyId) {
        whereClause['companyId'] = context.companyId;
      }

      const user = await User.findOne({ 
        where: whereClause,
      });
      return user ? await this.formatUserResponse(user) : null;
    } else {
      const user = await User.findByPk(id);
      console.log('user-0-0-0-', user)
      return user ? await this.formatUserResponse(user) : null;
    }
  }

  async getAllUsers(page = 1, limit = 10, filters: {
    search?: string;
    roleName?: string;
    roleId?: string;
    isActive?: boolean;
    emailVerified?: boolean;
  } = {}, context?: ResolvedContext): Promise<{ users: UserResponse[]; total: number }> {
    console.log("filters", filters)
    const offset = (page - 1) * limit;
    
    const whereClause: any = {};
    const userRoleInclude: any = {
      model: UserRole,
      as: 'userRoles',
      required: false,
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['name', 'id'],
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name'],
          required: false,
        }
      ],
      where: {
        isActive: true,
        revokedAt: null,
      },
    };

    // Apply context-based filtering through user roles
    if (context?.systemEditionId || context?.companyId || filters.roleName || filters.roleId) {
      userRoleInclude.required = true;
      
      if (context?.systemEditionId) {
        userRoleInclude.where.systemEditionId = context.systemEditionId;
      }

      if (context?.companyId) {
        userRoleInclude.where.companyId = context.companyId;
      }

      // Apply role filter through user roles (roleName actually filters by role ID)
      if (filters.roleName) {
        userRoleInclude.include[0].where = { id: filters.roleName };
        userRoleInclude.include[0].required = true;
      }

      // Apply roleId filter through user roles
      console.log("filters.roleId", filters.roleId)
      if (filters.roleId) {
        userRoleInclude.where.roleId = filters.roleId;
      }
    }

    // Apply search filters
    if (filters.search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    // Apply isActive filter
    if (filters.isActive !== undefined) {
      whereClause['isActive'] = filters.isActive;
    }

    // Apply emailVerified filter
    if (filters.emailVerified !== undefined) {
      whereClause['emailVerified'] = filters.emailVerified;
    }

    console.log("userRoleInclude", userRoleInclude)
    
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        userRoleInclude,
      ],
      distinct: true, // Important for accurate count with joins
    });

    const formattedUsers = await Promise.all(
      rows.map(user => this.formatUserResponse(user))
    );

    return {
      users: formattedUsers,
      total: count,
    };
  }

  async getUsersByCompany(companyId: string, filters: {
    page?: number;
    limit?: number;
    search?: string;
    roleName?: string;
    isActive?: boolean;
    emailVerified?: boolean;
  } = {}): Promise<{ users: UserResponse[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    
    const whereClause: any = {};
    const userRoleInclude: any = {
      model: UserRole,
      as: 'userRoles',
      required: true, // Users must have roles in this company
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['name'],
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name'],
          required: false,
        }
      ],
      where: {
        companyId,
        isActive: true,
        revokedAt: null,
      },
    };

    // Apply role filter
    if (filters.roleName) {
      userRoleInclude.include[0].where = { name: filters.roleName };
      userRoleInclude.include[0].required = true;
    }

    if (filters.search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    // Apply isActive filter
    if (filters.isActive !== undefined) {
      whereClause['isActive'] = filters.isActive;
    }

    // Apply emailVerified filter
    if (filters.emailVerified !== undefined) {
      whereClause['emailVerified'] = filters.emailVerified;
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        userRoleInclude,
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: SystemEdition,
          as: 'systemEdition',
          attributes: ['id', 'name', 'organizationName'],
          required: false,
        },
      ],
      distinct: true, // Important for accurate count with joins
    });

    const formattedUsers = await Promise.all(
      rows.map(user => this.formatUserResponse(user))
    );

    return {
      users: formattedUsers,
      total: count,
    };
  }

  async getUsersBySystemEdition(systemEditionId: string, filters: {
    page?: number;
    limit?: number;
    search?: string;
    roleName?: string;
    companyId?: string;
    isActive?: boolean;
    emailVerified?: boolean;
  } = {}, context?: ResolvedContext): Promise<{ users: UserResponse[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    
    const whereClause: any = {};
    const userRoleInclude: any = {
      model: UserRole,
        as: 'userRoles',
        required: true, // Users must have roles in this system edition
        include: [
          {
            model: Role,
            as: 'role',
            attributes: ['name'],
          },
          {
            model: Company,
            as: 'company',
            attributes: ['id', 'name'],
            required: false,
          }
        ],
        where: {
          systemEditionId,
          isActive: true,
          revokedAt: null,
        },
      };

    // Apply context-based filtering through user roles
    if (context?.companyId || filters.companyId) {
      userRoleInclude.where.companyId = context?.companyId || filters.companyId;
    }

    // Apply role filter
    if (filters.roleName) {
      userRoleInclude.include[0].where = { name: filters.roleName };
      userRoleInclude.include[0].required = true;
    }

    if (filters.search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    // Apply isActive filter
    if (filters.isActive !== undefined) {
      whereClause['isActive'] = filters.isActive;
    }

    // Apply emailVerified filter
    if (filters.emailVerified !== undefined) {
      whereClause['emailVerified'] = filters.emailVerified;
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        userRoleInclude,
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: SystemEdition,
          as: 'systemEdition',
          attributes: ['id', 'name', 'organizationName'],
          required: false,
        },
      ],
      distinct: true, // Important for accurate count with joins
    });

    const formattedUsers = await Promise.all(
      rows.map(user => this.formatUserResponse(user))
    );

    return {
      users: formattedUsers,
      total: count,
    };
  }

  async assignUserToCompany(_userId: string, _companyId: string): Promise<UserResponse | null> {
    // Note: Direct company assignment no longer supported.
    // Use role-based assignment through UserRole table instead.
    throw new Error('Direct company assignment not supported. Use role-based assignment through UserRole table.');
  }

  async assignUserToSystemEdition(_userId: string, _systemEditionId: string): Promise<UserResponse | null> {
    // Note: Direct system edition assignment no longer supported.
    // Use role-based assignment through UserRole table instead.
    throw new Error('Direct system edition assignment not supported. Use role-based assignment through UserRole table.');
  }

  async assignSeatToUser(userId: string, seatAssigned: boolean = true): Promise<UserResponse | null> {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return null;
    }

    await user.update({ seatAssigned });
    return this.formatUserResponse(user);
  }

  async updateUserLicenseType(userId: string, licenseType: 'organizational_seat' | 'individual_parent' | 'individual_child' | 'none'): Promise<UserResponse | null> {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return null;
    }

    await user.update({ licenseType });
    return this.formatUserResponse(user);
  }

  async updateUser(id: string, updateData: Partial<CreateUserDto> & { expirationDate?: Date; seatAssigned?: boolean; companyId?: string }, context?: ResolvedContext): Promise<UserResponse | null> {
    let user;
    
    if (context) {
      const whereClause: any = { id };

      // Apply context-based filtering
      if (context.systemEditionId) {
        whereClause['systemEditionId'] = context.systemEditionId;
      }

      if (context.companyId) {
        whereClause['companyId'] = context.companyId;
      }

      user = await User.findOne({ where: whereClause });
    } else {
      user = await User.findByPk(id);
    }
    
    if (!user) {
      return null;
    }

    // Handle password hashing if password is being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, config.app.bcryptSaltRounds);
    }

    // Handle seat assignment changes
    if (updateData.seatAssigned !== undefined) {
      const previousSeatAssigned = user.seatAssigned;
      const newSeatAssigned = updateData.seatAssigned;
      // Note: companyId now comes from active role, not directly from user
      const activeRole = await this.getUserActiveRole(id);
      const companyId = updateData.companyId || activeRole?.companyId;

      // If seat assignment is changing and company exists
      if (previousSeatAssigned !== newSeatAssigned && companyId) {
        try {
          const company = await Company.findByPk(companyId);
          if (company) {
            const currentUsedSeats = company.usedSeats || 0;
            let newUsedSeats = currentUsedSeats;

            if (newSeatAssigned && !previousSeatAssigned) {
              // Adding a seat
              newUsedSeats = currentUsedSeats + 1;
            } else if (!newSeatAssigned && previousSeatAssigned) {
              // Removing a seat
              newUsedSeats = Math.max(0, currentUsedSeats - 1);
            }

            await company.update({ usedSeats: newUsedSeats });
          }
        } catch (error) {
          console.error('Error updating company used seats:', error);
        }
      }
    }

    // Only update fields that are provided and match the User model
    const updateFields: any = {};
    if (updateData.email) updateFields.email = updateData.email;
    if (updateData.password) updateFields.password = updateData.password;
    if (updateData.firstName) updateFields.firstName = updateData.firstName;
    if (updateData.lastName) updateFields.lastName = updateData.lastName;
    if (updateData.phoneNumber) updateFields.phoneNumber = updateData.phoneNumber;
    // Note: role field removed from User model - now handled through UserRole table
    if (updateData.isActive !== undefined) updateFields.isActive = updateData.isActive;
    if (updateData.emailVerified !== undefined) updateFields.emailVerified = updateData.emailVerified;
    if (updateData.expirationDate) updateFields.expirationDate = updateData.expirationDate;
    if (updateData.seatAssigned !== undefined) updateFields.seatAssigned = updateData.seatAssigned;
    if (updateData.companyId) updateFields.companyId = updateData.companyId;

    await user.update(updateFields);
    return this.formatUserResponse(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const userData = user.get({ plain: true });

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);
    
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Check if new password is the same as current password
    const isSamePassword = await bcrypt.compare(newPassword, userData.password);
    
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, config.app.bcryptSaltRounds);

    // Update the password
    await user.update({ password: hashedNewPassword });
  }

  async deleteUser(id: string, context?: ResolvedContext): Promise<boolean> {
    let user;
    
    if (context) {
      const whereClause: any = { id };

      // Apply context-based filtering
      if (context.systemEditionId) {
        whereClause['systemEditionId'] = context.systemEditionId;
      }

      if (context.companyId) {
        whereClause['companyId'] = context.companyId;
      }

      user = await User.findOne({ where: whereClause });
    } else {
      user = await User.findByPk(id);
    }
    
    if (!user) {
      return false;
    }

    await UserRole.destroy({
      where: { userId: id }
    });

    await user.destroy();
    return true;
  }

  async startEmulation(originalUserId: string, targetUserId: string, currentUserContext?: AuthenticatedUser): Promise<{ user: UserResponse; token: string; originalUser: { id: string; email: string; roleName?: string; firstName: string; lastName: string } }> {
    // Get the original user (can be super_admin, edition_admin, or company_admin)
    const originalUser = await User.findByPk(originalUserId);
    if (!originalUser) {
      throw new Error('Original user not found');
    }

    const originalUserData = originalUser.get({ plain: true });

    // Get the target user to emulate
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      throw new Error('Target user not found');
    }

    const targetUserData = targetUser.get({ plain: true });

    if (!targetUserData.isActive) {
      throw new Error('Cannot emulate inactive user');
    }

    // Validate emulation permissions based on role hierarchy
    // Get active roles for permission checking
    const originalActiveRole = await this.getUserActiveRole(originalUserId);
    const targetActiveRole = await this.getUserActiveRole(targetUserId);
    
    if (!originalActiveRole || !targetActiveRole) {
      throw new Error('Users must have active roles to perform emulation');
    }

    let effectiveRole: string;
    if (currentUserContext?.isEmulating) {
      const currentActiveRole = await this.getUserActiveRole(currentUserContext.id);
      effectiveRole = currentActiveRole?.role?.name || '';
    } else {
      effectiveRole = originalActiveRole.role?.name || '';
    }
      
    const canEmulate = this.validateEmulationPermissions(effectiveRole, targetActiveRole.role?.name || '');
    if (!canEmulate) {
      throw new Error(`Cannot emulate ${targetActiveRole.role?.name} users from ${effectiveRole} role`);
    }

    // Create token with emulation data
    const tokenPayload: any = {
      id: targetUserData.id,
      email: targetUserData.email,
      firstName: targetUserData.firstName,
      lastName: targetUserData.lastName,
      isEmulating: true,
      originalUser: {
        id: originalUserData.id,
        email: originalUserData.email,
        firstName: originalUserData.firstName,
        lastName: originalUserData.lastName,
        // Preserve nested emulation context if original user was already emulating
        ...(currentUserContext?.isEmulating && currentUserContext?.originalUser && {
          originalUser: currentUserContext.originalUser,
          isEmulating: true,
        }),
      },
    };

    if (targetUser.activeUserRoleId) {
      tokenPayload.activeUserRoleId = targetUser.activeUserRoleId;
    }

    const token = generateToken(tokenPayload);

    return {
      user: await this.formatUserResponse(targetUserData as User),
      token,
      originalUser: {
        id: originalUserData.id,
        email: originalUserData.email,
        firstName: originalUserData.firstName,
        lastName: originalUserData.lastName,
        roleName: originalActiveRole?.role?.name,
      },
    };
  }

  /**
   * Validates if a user can emulate another user based on role hierarchy
   * Role hierarchy: super_admin > edition_admin > company_admin > user
   */
  private validateEmulationPermissions(originalRole: string, targetRole: string): boolean {
    const roleHierarchy: Record<string, string[]> = {
      'super_admin': ['edition_admin', 'company_admin', 'user'],
      'edition_admin': ['company_admin', 'user'],
      'company_admin': ['user'],
      'user': []
    };

    const allowedTargets = roleHierarchy[originalRole];
    return allowedTargets ? allowedTargets.includes(targetRole) : false;
  }

  async endEmulation(currentUser: AuthenticatedUser): Promise<{ user: UserResponse; token: string }> {
    if (!currentUser.originalUser) {
      throw new Error('No original user found in emulation data');
    }

    // Get the original user data
    const originalUser = await User.findByPk(currentUser.originalUser.id);
    if (!originalUser) {
      throw new Error('Original user not found');
    }

    const originalUserData = originalUser.get({ plain: true });

    if (!originalUserData.isActive) {
      throw new Error('Original user account is deactivated');
    }

    // Create token for original user without emulation
    const tokenPayload: any = {
      id: originalUserData.id,
      email: originalUserData.email,
      firstName: originalUserData.firstName,
      lastName: originalUserData.lastName,
    };

    if (originalUser.activeUserRoleId) {
      tokenPayload.activeUserRoleId = originalUser.activeUserRoleId;
    }

    const token = generateToken(tokenPayload);

    return {
      user: await this.formatUserResponse(originalUserData as User),
      token,
    };
  }

  // Role management methods moved from User model
  async getUserRoles(userId: string, options: {
    systemEditionId?: string;
    companyId?: string;
    channelId?: string;
    activeOnly?: boolean;
  } = {}): Promise<string[]> {
    const { systemEditionId, companyId, channelId, activeOnly = true } = options;
    
    const whereClause: any = {
      userId: userId,
    };

    if (activeOnly) {
      whereClause.isActive = true;
      whereClause.revokedAt = null;
    }

    if (systemEditionId !== undefined) {
      whereClause.systemEditionId = systemEditionId;
    }
    if (companyId !== undefined) {
      whereClause.companyId = companyId;
    }
    if (channelId !== undefined) {
      whereClause.channelId = channelId;
    }

    const userRoles = await UserRole.findAll({
      where: whereClause,
      include: [{
        model: Role,
        as: 'role',
        attributes: ['name'],
      }],
    });

    return userRoles.map((ur: any) => ur.get({ plain: true }).role.name);
  }

  async userHasRole(userId: string, roleName: string, options: {
    systemEditionId?: string;
    companyId?: string;
    channelId?: string;
  } = {}): Promise<boolean> {
    const roles = await this.getUserRoles(userId, { ...options, activeOnly: true });
    return roles.includes(roleName);
  }

  async isUserSuperAdmin(userId: string): Promise<boolean> {
    return this.userHasRole(userId, 'super_admin');
  }

  async isUserEditionAdmin(userId: string, systemEditionId?: string): Promise<boolean> {
    const options: any = {};
    if (systemEditionId) {
      options.systemEditionId = systemEditionId;
    }
    return this.userHasRole(userId, 'edition_admin', options);
  }

  async isUserCompanyAdmin(userId: string, companyId?: string): Promise<boolean> {
    const options: any = {};
    if (companyId) {
      options.companyId = companyId;
    }
    return this.userHasRole(userId, 'company_admin', options);
  }

  async isUserChannelAdmin(userId: string, channelId?: string): Promise<boolean> {
    const options: any = {};
    if (channelId) {
      options.channelId = channelId;
    }
    return this.userHasRole(userId, 'channel_admin', options);
  }

  async getUserActiveRole(userId: string): Promise<any | null> {
    const user = await User.findByPk(userId);
    const userData = user?.get({ plain: true });
    if (!userData || !userData?.activeUserRoleId) return null;
    
    const activeRole = await UserRole.findByPk(userData.activeUserRoleId, {
      include: [{
        model: Role,
        as: 'role',
      }],
    });

    return activeRole ? activeRole.get({ plain: true }) : null;
  }

  async getUserAvailableRoles(userId: string): Promise<any[]> {
    const userRoles = await UserRole.findAll({
      where: {
        userId: userId,
        isActive: true,
        revokedAt: null as any,
      },
      include: [{
        model: Role,
        as: 'role',
      }],
    });

    return userRoles
      .map(ur => ur.get({ plain: true }))
      .filter(ur => !ur.expiresAt || new Date() < ur.expiresAt);
  }

  async userHasActiveRole(userId: string): Promise<boolean> {
    const user = await User.findByPk(userId);
    return !!(user?.activeUserRoleId);
  }

  async validateUserActiveRole(userId: string): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user || !user.activeUserRoleId) return false;
    
    const activeRole = await this.getUserActiveRole(userId);
    if (!activeRole) return false;
    
    // Check if role is expired
    if (activeRole.expiresAt && new Date() > activeRole.expiresAt) {
      await this.clearUserActiveRole(userId);
      return false;
    }
    
    // Check if role is revoked
    if (activeRole.revokedAt) {
      await this.clearUserActiveRole(userId);
      return false;
    }
    
    return true;
  }

  async getUserCurrentContext(userId: string): Promise<{
    roleId?: string;
    roleName?: string;
    systemEditionId?: string;
    companyId?: string;
    channelId?: string;
  }> {
    const activeRole = await this.getUserActiveRole(userId);
    
    if (!activeRole) {
      return {};
    }

    return {
      roleId: activeRole.roleId,
      roleName: activeRole.role?.name,
      systemEditionId: activeRole.systemEditionId,
      companyId: activeRole.companyId,
      channelId: activeRole.channelId,
    };
  }

  async setUserActiveRole(userId: string, userRoleId: string): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const userRole = await UserRole.findOne({
      where: {
        id: userRoleId,
        userId: userId,
        isActive: true,
        revokedAt: null,
      } as any,
    });

    if (!userRole) {
      throw new Error('Invalid user role: Role not found, inactive, or does not belong to user');
    }

    // Check if role is expired
    const userRoleData = userRole.get({ plain: true });
    if (userRoleData.expiresAt && new Date() > userRoleData.expiresAt) {
      throw new Error('Cannot set active role: Role has expired');
    }

    // Update the active role
    await user.update({ activeUserRoleId: userRoleId });
    return true;
  }

  async clearUserActiveRole(userId: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (user) {
      await user.update({ activeUserRoleId: null as any });
    }
  }

  private async formatUserResponse(user: User): Promise<UserResponse> {
    const userData = user.get ? user.get({ plain: true }) : user;
    
    const response: UserResponse = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isActive: userData.isActive,
      emailVerified: userData.emailVerified,
      phoneNumber: userData.phoneNumber || undefined,
      expirationDate: userData.expirationDate,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      seatAssigned: userData.seatAssigned || false,
      licenseType: userData.licenseType || 'none',
      delegateCount: userData.delegateCount || 0,
      lastLoginAt: userData.lastLoginAt || undefined,
    };

    // Get active role if user has one
    if (userData.activeUserRoleId) {
      const activeRole = await this.getUserActiveRole(userData.id);
      if (activeRole) {
        response.activeRole = {
          id: activeRole.id,
          roleName: activeRole.role?.name,
          systemEditionId: activeRole.systemEditionId,
          companyId: activeRole.companyId,
          channelId: activeRole.channelId,
          expiresAt: activeRole.expiresAt,
        };
      }
    }

    // Get all available roles for the user
    try {
      const availableRoles = await this.getUserAvailableRoles(userData.id);
      response.availableRoles = availableRoles.map(ur => ({
        id: ur.id,
        roleName: ur.role?.name,
        systemEditionId: ur.systemEditionId,
        companyId: ur.companyId,
        channelId: ur.channelId,
        expiresAt: ur.expiresAt,
        isActive: ur.isActive,
      }));
    } catch (error) {
      // If we can't get roles, set empty array
      response.availableRoles = [];
    }

    // Extract company associations from user roles
    if ((userData as any).userRoles && Array.isArray((userData as any).userRoles)) {
      const companyIds = new Set<string>();
      
      (userData as any).userRoles.forEach((userRole: any) => {
        if (userRole.companyId) {
          companyIds.add(userRole.companyId);
        }
        // Also check if company data is included in the userRole
        if (userRole.company && userRole.company.id) {
          companyIds.add(userRole.company.id);
        }
      });
      
      response.companyAssociations = Array.from(companyIds);
    } else {
      response.companyAssociations = [];
    }

    // Add company data if available from active role
    if (response.activeRole?.companyId && (userData as any).company) {
      response.company = {
        id: (userData as any).company.id,
        name: (userData as any).company.name,
      };
    }

    // Add system edition data if available from active role
    if (response.activeRole?.systemEditionId && (userData as any).systemEdition) {
      response.systemEdition = {
        id: (userData as any).systemEdition.id,
        name: (userData as any).systemEdition.name,
        organizationName: (userData as any).systemEdition.organizationName,
      };
    }

    return response;
  }


}

export const userService = new UserService(); 