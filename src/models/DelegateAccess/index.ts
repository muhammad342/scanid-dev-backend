import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

interface DelegateAccessAttributes {
  id: string;
  systemEditionId: string;
  delegatorId: string;
  delegateId: string;
  permissions: string[];
  isActive: boolean;
  expirationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface DelegateAccessCreationAttributes 
  extends Optional<DelegateAccessAttributes, 'id' | 'isActive' | 'expirationDate' | 'createdAt' | 'updatedAt'> {}

export class DelegateAccess extends Model<DelegateAccessAttributes, DelegateAccessCreationAttributes> 
  implements DelegateAccessAttributes {
  public id!: string;
  public systemEditionId!: string;
  public delegatorId!: string;
  public delegateId!: string;
  public permissions!: string[];
  public isActive!: boolean;
  public expirationDate?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly systemEdition?: any;
  public readonly delegator?: any;
  public readonly delegate?: any;
}

DelegateAccess.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    systemEditionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'system_editions',
        key: 'id',
      },
    },
    delegatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    delegateId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidPermissions(value: string[]) {
          const validPermissions = [
            'view_users',
            'manage_users',
            'view_documents',
            'manage_documents',
            'view_notes',
            'manage_notes',
            'view_certifications',
            'manage_certifications',
            'view_reports',
            'manage_settings',
            'full_access'
          ];
          const invalidPermissions = value.filter(perm => !validPermissions.includes(perm));
          if (invalidPermissions.length > 0) {
            throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
          }
        },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: true,
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
    modelName: 'DelegateAccess',
    tableName: 'delegate_access',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['system_edition_id', 'delegator_id', 'delegate_id'],
        where: {
          deleted_at: null,
        },
      },
      {
        fields: ['system_edition_id'],
      },
      {
        fields: ['delegator_id'],
      },
      {
        fields: ['delegate_id'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['expiration_date'],
      },
    ],
    hooks: {
      beforeValidate: (delegateAccess: DelegateAccess) => {
        // Ensure delegator and delegate are not the same person
        if (delegateAccess.delegatorId === delegateAccess.delegateId) {
          throw new Error('Delegator and delegate cannot be the same person');
        }
      },
    },
  }
);

export default DelegateAccess; 