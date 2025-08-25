import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

export interface UserRoleAttributes {
  id: string;
  userId: string;
  roleId: string;
  systemEditionId?: string;
  companyId?: string;
  channelId?: string;
  isActive: boolean;
  grantedBy?: string;
  grantedAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  revokedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserRoleCreationAttributes extends Optional<UserRoleAttributes, 'id' | 'systemEditionId' | 'companyId' | 'channelId' | 'isActive' | 'grantedBy' | 'grantedAt' | 'expiresAt' | 'revokedAt' | 'revokedBy' | 'createdAt' | 'updatedAt'> {}

export class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
  public id!: string;
  public userId!: string;
  public roleId!: string;
  public systemEditionId?: string;
  public companyId?: string;
  public channelId?: string;
  public isActive!: boolean;
  public grantedBy?: string;
  public grantedAt!: Date;
  public expiresAt?: Date;
  public revokedAt?: Date;
  public revokedBy?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: any;
  public readonly role?: any;
  public readonly systemEdition?: any;
  public readonly company?: any;
  public readonly channel?: any;
  public readonly grantor?: any;
  public readonly revoker?: any;

  // Helper methods
  public isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  public isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  public isValidRole(): boolean {
    return this.isActive && !this.isExpired() && !this.isRevoked();
  }

  public async revoke(revokedBy: string): Promise<void> {
    this.revokedAt = new Date();
    this.revokedBy = revokedBy;
    this.isActive = false;
    await this.save();
  }

  public async activate(): Promise<void> {
    this.isActive = true;
    await this.save();
    // Note: To clear revokedAt and revokedBy, use raw SQL update
    await this.sequelize?.query(
      'UPDATE user_roles SET revoked_at = NULL, revoked_by = NULL WHERE id = ?',
      { replacements: [this.id] }
    );
    await this.reload();
  }
}

UserRole.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    systemEditionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'system_editions',
        key: 'id',
      },
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id',
      },
    },
    channelId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'channels',
        key: 'id',
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    grantedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    grantedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revokedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
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
    modelName: 'UserRole',
    tableName: 'user_roles',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['role_id'],
      },
      {
        fields: ['system_edition_id'],
      },
      {
        fields: ['company_id'],
      },
      {
        fields: ['channel_id'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['granted_at'],
      },
      {
        fields: ['expires_at'],
      },
      {
        fields: ['revoked_at'],
      },
      // Composite indexes for common queries
      {
        fields: ['user_id', 'is_active', 'revoked_at'],
      },
      {
        fields: ['user_id', 'role_id', 'is_active'],
      },
      {
        fields: ['user_id', 'system_edition_id', 'is_active'],
      },
      {
        fields: ['user_id', 'company_id', 'is_active'],
      },
      {
        fields: ['user_id', 'channel_id', 'is_active'],
      },
    ],
    validate: {
      // Ensure at least one context is specified for non-global roles
      contextRequired() {
        // Global roles (like super_admin) can have all contexts as null
        // But other roles should have at least one context
        const hasAnyContext = this['systemEditionId'] || this['companyId'] || this['channelId'];
        
        // If this is not a global role and has no context, it's invalid
        if (!hasAnyContext) {
          // We'll need to check if this is a global role by looking up the role name
          // For now, we'll allow it and handle validation at the service layer
        }
      },
    },
  }
);

export default UserRole;
