import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { UserTrigger } from './triggers/UserTrigger.js';

interface UserAttributes {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'edition_admin' | 'company_admin' | 'user' | 'delegate';
  isActive: boolean;
  emailVerified: boolean;
  phoneNumber?: string;
  companyId?: string;
  systemEditionId?: string;
  seatAssigned: boolean;
  licenseType: 'organizational_seat' | 'individual_parent' | 'individual_child' | 'none';
  delegateCount: number;
  lastLoginAt?: Date;
  expirationDate?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'seatAssigned' | 'licenseType' | 'delegateCount' | 'lastLoginAt' | 'expirationDate' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: 'super_admin' | 'edition_admin' | 'company_admin' | 'user' | 'delegate';
  public isActive!: boolean;
  public emailVerified!: boolean;
  public phoneNumber?: string;
  public companyId?: string;
  public systemEditionId?: string;
  public seatAssigned!: boolean;
  public licenseType!: 'organizational_seat' | 'individual_parent' | 'individual_child' | 'none';
  public delegateCount!: number;
  public lastLoginAt?: Date;
  public expirationDate?: Date;
  public createdBy?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly company?: any;
  public readonly systemEdition?: any;
  public readonly createdEditions?: any[];
  public readonly managedCompanies?: any[];
  public readonly delegatedUsers?: any[];
  public readonly createdByUser?: any;
  public readonly createdUsers?: any[];
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
    role: {
      type: DataTypes.ENUM('super_admin', 'edition_admin', 'company_admin', 'user', 'delegate'),
      allowNull: false,
      defaultValue: 'user',
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'companies',
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
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['role'],
      },
      {
        fields: ['company_id'],
      },
      {
        fields: ['system_edition_id'],
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