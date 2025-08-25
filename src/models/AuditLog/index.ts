import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

interface AuditLogAttributes {
  id: string;
  systemEditionId?: string;
  companyId?: string;
  userId: string;
  action: string;
  module: 'documents' | 'notes' | 'certifications' | 'users' | 'settings' | 'system' | 'authentication' | 'permissions';
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

interface AuditLogCreationAttributes 
  extends Optional<AuditLogAttributes, 'id' | 'systemEditionId' | 'companyId' | 'ipAddress' | 'userAgent' | 'metadata' | 'createdAt'> {}

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> 
  implements AuditLogAttributes {
  public id!: string;
  public systemEditionId?: string;
  public companyId?: string;
  public userId!: string;
  public action!: string;
  public module!: 'documents' | 'notes' | 'certifications' | 'users' | 'settings' | 'system' | 'authentication' | 'permissions';
  public description!: string;
  public ipAddress?: string;
  public userAgent?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;

  // Associations
  public readonly systemEdition?: any;
  public readonly company?: any;
  public readonly user?: any;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    module: {
      type: DataTypes.ENUM('documents', 'notes', 'certifications', 'users', 'settings', 'system', 'authentication', 'permissions'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: false, // Only createdAt, no updatedAt
    paranoid: false,   // Audit logs should never be soft deleted
    indexes: [
      {
        fields: ['system_edition_id'],
      },
      {
        fields: ['company_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['action'],
      },
      {
        fields: ['module'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['created_at', 'user_id'],
      },
      {
        fields: ['created_at', 'module'],
      },
    ],
  }
);

export default AuditLog; 