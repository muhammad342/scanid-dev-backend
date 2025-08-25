import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

interface RoleAttributes {
  id: string;
  name: string;
  description?: string;
  accessScope: 'GLOBAL' | 'EDITION' | 'COMPANY' | 'SELF';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'description' | 'accessScope' | 'isActive' | 'createdAt' | 'updatedAt'> {}

export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public accessScope!: 'GLOBAL' | 'EDITION' | 'COMPANY' | 'SELF';
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly userRoles?: any[];
}

Role.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50],
        isIn: [['super_admin', 'edition_admin', 'company_admin', 'channel_admin', 'user', 'delegate']],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    accessScope: {
      type: DataTypes.ENUM('GLOBAL', 'EDITION', 'COMPANY', 'SELF'),
      allowNull: false,
      defaultValue: 'SELF',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    modelName: 'Role',
    tableName: 'roles',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['name'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['access_scope'],
      },
    ],
  }
);

export default Role;

// Role constants for type safety
export const ROLE_NAMES = {
  SUPER_ADMIN: 'super_admin',
  EDITION_ADMIN: 'edition_admin',
  COMPANY_ADMIN: 'company_admin',
  CHANNEL_ADMIN: 'channel_admin',
  USER: 'user',
  DELEGATE: 'delegate',
} as const;

export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES];
