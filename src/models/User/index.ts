import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { UserTrigger } from './triggers/UserTrigger.js';
import UserRole from '../UserRole/index.js';
import Role from '../Role/index.js';

export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneNumber?: string;
  activeUserRoleId?: string;
  seatAssigned: boolean;
  licenseType: 'organizational_seat' | 'individual_parent' | 'individual_child' | 'none';
  delegateCount: number;
  lastLoginAt?: Date;
  expirationDate?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'seatAssigned' | 'licenseType' | 'delegateCount' | 'lastLoginAt' | 'expirationDate' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public isActive!: boolean;
  public emailVerified!: boolean;
  public phoneNumber?: string;
  public activeUserRoleId?: string;
  public seatAssigned!: boolean;
  public licenseType!: 'organizational_seat' | 'individual_parent' | 'individual_child' | 'none';
  public delegateCount!: number;
  public lastLoginAt?: Date;
  public expirationDate?: Date;
  public createdBy?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  // Associations
  public readonly activeUserRole?: any;
  public readonly createdEditions?: any[];
  public readonly managedCompanies?: any[];
  public readonly managedChannels?: any[];
  public readonly delegatedUsers?: any[];
  public readonly createdByUser?: any;
  public readonly createdUsers?: any[];
  public readonly userRoles?: any[];
  public readonly roles?: any[];

  // Helper methods for roles
  public async getRoles(options: {
    systemEditionId?: string;
    companyId?: string;
    channelId?: string;
    activeOnly?: boolean;
  } = {}): Promise<string[]> {
    const { systemEditionId, companyId, channelId, activeOnly = true } = options;
    const userData = this.getPlainData();
    
    const whereClause: any = {
      userId: userData.id,
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

    // Import models dynamically to avoid circular dependencies
    
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

  public async hasRole(roleName: string, options: {
    systemEditionId?: string;
    companyId?: string;
    channelId?: string;
  } = {}): Promise<boolean> {
    const roles = await this.getRoles({ ...options, activeOnly: true });
    return roles.includes(roleName);
  }

  public async isSuperAdmin(): Promise<boolean> {
    return this.hasRole('super_admin');
  }

  public async isEditionAdmin(systemEditionId?: string): Promise<boolean> {
    const options: any = {};
    if (systemEditionId) {
      options.systemEditionId = systemEditionId;
    }
    return this.hasRole('edition_admin', options);
  }

  public async isCompanyAdmin(companyId?: string): Promise<boolean> {
    const options: any = {};
    if (companyId) {
      options.companyId = companyId;
    }
    return this.hasRole('company_admin', options);
  }

  public async isChannelAdmin(channelId?: string): Promise<boolean> {
    const options: any = {};
    if (channelId) {
      options.channelId = channelId;
    }
    return this.hasRole('channel_admin', options);
  }

  // Helper methods for active role management
  public async getActiveRole(): Promise<any | null> {
    const userData = this.getPlainData();
    if (!userData.activeUserRoleId) return null;
    
    const activeRole = await UserRole.findByPk(userData.activeUserRoleId, {
      include: [{
        model: Role,
        as: 'role',
      }],
    });

    return activeRole ? activeRole.get({ plain: true }) : null;
  }

  public async getCurrentContext(): Promise<{
    roleId?: string;
    roleName?: string;
    systemEditionId?: string;
    companyId?: string;
    channelId?: string;
  }> {
    const activeRole = await this.getActiveRole();

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

  public async setActiveRole(userRoleId: string): Promise<boolean> {
    const userData = this.getPlainData();
    
    const userRole = await UserRole.findOne({
      where: {
        id: userRoleId,
        userId: userData.id,
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
    await this.update({ activeUserRoleId: userRoleId });
    return true;
  }

  public async clearActiveRole(): Promise<void> {
    await this.update({ activeUserRoleId: null as any });
  }
  public async getAvailableRoles(): Promise<any[]> {
    const userData = this.getPlainData();
    const availableRoles = await UserRole.findAll({
      where: {
        userId: userData.id,
        isActive: true,
        revokedAt: null,
      } as any,
      include: [{
        model: Role,
        as: 'role',
      }],
    });

    return availableRoles
      .filter((ur: any) => {
        const userRoleData = ur.get({ plain: true });
        // Filter out expired roles
        return !userRoleData.expiresAt || new Date() <= userRoleData.expiresAt;
      })
      .map((ur: any) => ur.get({ plain: true }));
  }

  public async hasActiveRole(): Promise<boolean> {
    const userData = this.getPlainData();
    return userData.activeUserRoleId !== null && userData.activeUserRoleId !== undefined;
  }

  /**
   * Get plain user data without Sequelize model methods
   * @returns Plain user object with all attributes
   */
  public getPlainData(): UserAttributes {
    const userData = this.get({ plain: true });
    return userData as UserAttributes;
  }

  public async validateActiveRole(): Promise<boolean> {
    const userData = this.getPlainData();
    if (!userData.activeUserRoleId) return false;
    
    const activeRole = await this.getActiveRole();
    if (!activeRole) {
      // Clear invalid active role
      await this.clearActiveRole();
      return false;
    }

    // Check if role is still valid
    if (!activeRole.isActive || activeRole.revokedAt) {
      await this.clearActiveRole();
      return false;
    }

    // Check if role is expired
    if (activeRole.expiresAt && new Date() > activeRole.expiresAt) {
      await this.clearActiveRole();
      return false;
    }

    return true;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [8, 255],
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50],
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50],
      },
    },

    activeUserRoleId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'user_roles',
        key: 'id',
      },
    },
    seatAssigned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    licenseType: {
      type: DataTypes.ENUM('organizational_seat', 'individual_parent', 'individual_child', 'none'),
      allowNull: false,
      defaultValue: 'none',
    },
    delegateCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [10, 20],
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },

      {
        fields: ['active_user_role_id'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['seat_assigned'],
      },
      {
        fields: ['license_type'],
      },
      {
        fields: ['last_login_at'],
      },
      {
        fields: ['expiration_date'],
      },
      {
        fields: ['created_by'],
      },
    ],
  }
);

// Add trigger hooks
User.addHook('afterCreate', async (user: User) => {
  try {
    await UserTrigger.onCreate(user);
  } catch (error) {
    // Log error but don't throw - user creation should succeed
    console.error('Failed to execute User onCreate trigger:', error);
  }
});

export default User; 