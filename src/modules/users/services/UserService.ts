import bcrypt from 'bcryptjs';
import { User } from '../../../models/User/index.js';
import { config } from '../../../config/index.js';
import { generateToken } from '../../../shared/middleware/auth.js';
import { AuthenticatedUser } from '../../../shared/types/common.js';
import { Op } from 'sequelize';
import { Company } from '../../../models/Company/index.js';
import { SystemEdition } from '../../../models/SystemEdition/index.js';
import type { ResolvedContext } from '../../../shared/middleware/contextResolver.js';
import type { CreateUserData } from '../types/index.js';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: 'super_admin' | 'edition_admin' | 'company_admin' | 'user' | 'delegate';
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
  role?: 'user' | 'delegate' | 'company_admin' | 'edition_admin' | 'super_admin';
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
  role: 'super_admin' | 'edition_admin' | 'company_admin' | 'user' | 'delegate';
  isActive: boolean;
  emailVerified: boolean;
  phoneNumber?: string | undefined;
  expirationDate?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
  systemEditionId?: string | undefined;
  companyId?: string | undefined;
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
}

export class UserService {


  async createUser(userData: CreateUserDto): Promise<UserResponse> {
    const existingUser = await User.findOne({ where: { email: userData.email } });
    
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(userData.password, config.app.bcryptSaltRounds);

    const user = await User.create({
      ...userData,
      password: hashedPassword,
      role: userData.role || 'user',
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : false,
    });

    return this.formatUserResponse(user);
  }

  async createUserWithContext(userData: CreateUserData, context: ResolvedContext): Promise<UserResponse> {
    const existingUser = await User.findOne({ where: { email: userData.email } });
    
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Validate context-based constraints
    if (context.role === 'company_admin' && (userData.role === 'super_admin' || userData.role === 'edition_admin')) {
      throw new Error('Company admins can not create super admins and edition admins');
    }

    if (context.role === 'edition_admin' && userData.role === 'super_admin') {
      throw new Error('Edition admins cannot create super admins');
    }

    // Ensure system edition ID is set from context
    if (!userData.systemEditionId && context.systemEditionId) {
      userData.systemEditionId = context.systemEditionId;
    }

    // Ensure company ID is set from context for non-super admins
    if (context.role !== 'super_admin' && !userData.companyId && context.companyId) {
      userData.companyId = context.companyId;
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
      role: userData.role || 'user',
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : false,
      systemEditionId: userData.systemEditionId,
      companyId: userData.companyId,
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
    const userDataResponse = user.get({ plain: true });

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

    return this.formatUserResponse(userDataResponse as User);
  }

  async createSuperAdmin(userData: CreateUserDto): Promise<UserResponse> {
    const existingUser = await User.findOne({ where: { email: userData.email } });
    
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(userData.password, config.app.bcryptSaltRounds);

    const userCreateData: any = {
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'super_admin',
      isActive: true,
      emailVerified: true,
    };

    // Only add phoneNumber if it's provided
    if (userData.phoneNumber) {
      userCreateData.phoneNumber = userData.phoneNumber;
    }

    // Only add createdBy if it's provided
    if (userData.createdBy) {
      userCreateData.createdBy = userData.createdBy;
    }

    const user = await User.create(userCreateData);
    const userDataResponse = user.get({ plain: true });

    return this.formatUserResponse(userDataResponse as User);
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
      role: 'company_admin',
      isActive: adminData.isActive !== undefined ? adminData.isActive : true,
      emailVerified: adminData.emailVerified !== undefined ? adminData.emailVerified : false,
      companyId: adminData.companyId,
      createdBy: adminData.createdBy,
    };

    if (adminData.phoneNumber) {
      userCreateData.phoneNumber = adminData.phoneNumber;
    }
    if (adminData.systemEditionId) {
      userCreateData.systemEditionId = adminData.systemEditionId;
    }
    if (adminData.expirationDate) {
      userCreateData.expirationDate = adminData.expirationDate;
    }

    const user = await User.create(userCreateData);
    const userDataResponse = user.get({ plain: true });

    return this.formatUserResponse(userDataResponse as User);
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
      role: userData.role || 'user', // Use provided role or default to 'user'
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

    return this.formatUserResponse(userDataResponse as User);
  }

  async getUserByEmail(email: string): Promise<UserResponse | null> {
    const user = await User.findOne({ where: { email } });
    return user ? this.formatUserResponse(user) : null;
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

    const tokenPayload: AuthenticatedUser = {
      id: userData.id,
      email: userData.email,
      role: userData.role
    };

    if (userData.systemEditionId) {
      tokenPayload.systemEditionId = userData.systemEditionId;
    }

    if (userData.companyId) {
      tokenPayload.companyId = userData.companyId;
    }

    const token = generateToken(tokenPayload);

    return {
      user: this.formatUserResponse(userData as User),
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
        include: [
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
      });
      return user ? this.formatUserResponse(user) : null;
    } else {
      const user = await User.findByPk(id, {
        include: [
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
      });
      console.log('user-0-0-0-', user)
      return user ? this.formatUserResponse(user) : null;
    }
  }



  async getAllUsers(page = 1, limit = 10, filters: {
    search?: string;
    role?: string;
    isActive?: boolean;
    emailVerified?: boolean;
  } = {}, context?: ResolvedContext): Promise<{ users: UserResponse[]; total: number }> {
    const offset = (page - 1) * limit;
    
    const whereClause: any = {};

    // Apply context-based filtering
    if (context?.systemEditionId) {
      whereClause['systemEditionId'] = context.systemEditionId;
    }

    if (context?.companyId) {
      whereClause['companyId'] = context.companyId;
    }

    // Apply search filters
    if (filters.search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    // Apply role filter
    if (filters.role) {
      whereClause['role'] = filters.role;
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
    });

    return {
      users: rows.map(user => this.formatUserResponse(user)),
      total: count,
    };
  }

  async getUsersByCompany(companyId: string, filters: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    emailVerified?: boolean;
  } = {}): Promise<{ users: UserResponse[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    
    const whereClause: any = {
      companyId,
    };

    // Apply role filter (default to 'user' if not specified)
    if (filters.role) {
      whereClause['role'] = filters.role;
    } else {
      whereClause['role'] = 'user';
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
    });

    return {
      users: rows.map(user => this.formatUserResponse(user)),
      total: count,
    };
  }

  async getUsersBySystemEdition(systemEditionId: string, filters: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    companyId?: string;
    isActive?: boolean;
    emailVerified?: boolean;
  } = {}, context?: ResolvedContext): Promise<{ users: UserResponse[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    
    const whereClause: any = {
      systemEditionId,
    };

    // Apply context-based filtering
    if (context?.companyId) {
      whereClause['companyId'] = context.companyId;
    }

    if (filters.role) {
      whereClause['role'] = filters.role;
    } else {
      whereClause['role'] = 'user'; // Default to 'user' role
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
    });

    return {
      users: rows.map(user => this.formatUserResponse(user)),
      total: count,
    };
  }

  async assignUserToCompany(userId: string, companyId: string): Promise<UserResponse | null> {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return null;
    }

    await user.update({ companyId });
    return this.formatUserResponse(user);
  }

  async assignUserToSystemEdition(userId: string, systemEditionId: string): Promise<UserResponse | null> {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return null;
    }

    await user.update({ systemEditionId });
    return this.formatUserResponse(user);
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
      const companyId = updateData.companyId || user.companyId;

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
    if (updateData.role) updateFields.role = updateData.role;
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

    await user.destroy();
    return true;
  }

  async startEmulation(originalUserId: string, targetUserId: string, currentUserContext?: AuthenticatedUser): Promise<{ user: UserResponse; token: string; originalUser: { id: string; email: string; role: string; firstName: string; lastName: string } }> {
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
    // If we're already emulating, use the current emulated user's role for validation
    const effectiveRole = currentUserContext?.isEmulating ? currentUserContext.role : originalUserData.role;
    const canEmulate = this.validateEmulationPermissions(effectiveRole, targetUserData.role);
    if (!canEmulate) {
      throw new Error(`Cannot emulate ${targetUserData.role} users from ${effectiveRole} role`);
    }

    // Create token with emulation data
    const tokenPayload: AuthenticatedUser = {
      id: targetUserData.id,
      email: targetUserData.email,
      role: targetUserData.role,
      isEmulating: true,
      originalUser: {
        id: originalUserData.id,
        email: originalUserData.email,
        role: originalUserData.role,
        firstName: originalUserData.firstName,
        lastName: originalUserData.lastName,
        // Preserve nested emulation context if original user was already emulating
        ...(currentUserContext?.isEmulating && currentUserContext?.originalUser && {
          originalUser: currentUserContext.originalUser,
          isEmulating: true,
        }),
      },
    };

    if (targetUserData.systemEditionId) {
      tokenPayload.systemEditionId = targetUserData.systemEditionId;
    }

    if (targetUserData.companyId) {
      tokenPayload.companyId = targetUserData.companyId;
    }

    const token = generateToken(tokenPayload);

    return {
      user: this.formatUserResponse(targetUserData as User),
      token,
      originalUser: {
        id: originalUserData.id,
        email: originalUserData.email,
        role: originalUserData.role,
        firstName: originalUserData.firstName,
        lastName: originalUserData.lastName,
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
    const tokenPayload: AuthenticatedUser = {
      id: originalUserData.id,
      email: originalUserData.email,
      role: originalUserData.role,
    };

    if (originalUserData.systemEditionId) {
      tokenPayload.systemEditionId = originalUserData.systemEditionId;
    }

    if (originalUserData.companyId) {
      tokenPayload.companyId = originalUserData.companyId;
    }

    const token = generateToken(tokenPayload);

    return {
      user: this.formatUserResponse(originalUserData as User),
      token,
    };
  }

  private formatUserResponse(user: User): UserResponse {
    const userData = user.get ? user.get({ plain: true }) : user;
    
    const response: UserResponse = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      isActive: userData.isActive,
      emailVerified: userData.emailVerified,
      phoneNumber: userData.phoneNumber || undefined,
      expirationDate: userData.expirationDate,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      systemEditionId: userData.systemEditionId || undefined,
      companyId: userData.companyId || undefined,
      seatAssigned: userData.seatAssigned || false,
      licenseType: userData.licenseType || 'none',
      delegateCount: userData.delegateCount || 0,
      lastLoginAt: userData.lastLoginAt || undefined,
    };

    // Add company data if available
    if ((userData as any).company) {
      response.company = {
        id: (userData as any).company.id,
        name: (userData as any).company.name,
      };
    }

    // Add system edition data if available
    if ((userData as any).systemEdition) {
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