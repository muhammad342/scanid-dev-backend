import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { SystemEditionTrigger } from './triggers/SystemEditionTrigger.js';

interface DocumentSettings {
  useMasterPin: boolean;
  useDocumentViewPin: boolean;
  reminderEnabled: boolean;
  reminderDays: number[];
  expirationDate?: Date;
}

interface NotesSettings {
  useMasterPin: boolean;
  useDocumentViewPin: boolean;
  reminderEnabled: boolean;
  reminderDays: number[];
  expirationDate?: Date;
}

interface CertificationSettings {
  useMasterPin: boolean;
  useDocumentViewPin: boolean;
  reminderEnabled: boolean;
  reminderDays: number[];
  expirationDate?: Date;
}

interface SystemEditionAttributes {
  id: string;
  name: string;
  modules: {
    co_branding?: boolean;
    document_management?: boolean;
    notes?: boolean;
    certifications?: boolean;
    delegate_access?: boolean;
    seat_management?: boolean;
  };
  archived: boolean;
  logoUrl?: string;
  organizationName?: string;
  slogan?: string;
  primaryBrandColor?: string;
  secondaryBrandColor?: string;
  // New settings fields
  documentSettings: DocumentSettings;
  notesSettings: NotesSettings;
  certificationSettings: CertificationSettings;
  createdBy: string;
  lastUpdatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SystemEditionCreationAttributes 
  extends Optional<SystemEditionAttributes, 'id' | 'archived' | 'logoUrl' | 'organizationName' | 'slogan' | 'primaryBrandColor' | 'secondaryBrandColor' | 'documentSettings' | 'notesSettings' | 'certificationSettings' | 'createdAt' | 'updatedAt'> {}

export class SystemEdition extends Model<SystemEditionAttributes, SystemEditionCreationAttributes> 
  implements SystemEditionAttributes {
  public id!: string;
  public name!: string;
  public modules!: {
    co_branding?: boolean;
    document_management?: boolean;
    notes?: boolean;
    certifications?: boolean;
    delegate_access?: boolean;
    seat_management?: boolean;
  };
  public archived!: boolean;
  public logoUrl?: string;
  public organizationName?: string;
  public slogan?: string;
  public primaryBrandColor?: string;
  public secondaryBrandColor?: string;
  // New settings fields
  public documentSettings!: DocumentSettings;
  public notesSettings!: NotesSettings;
  public certificationSettings!: CertificationSettings;
  public createdBy!: string;
  public lastUpdatedBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly companies?: any[];
  public readonly coBranding?: any;
  public readonly seatManagement?: any;
  public readonly tags?: any[]; // Updated from documentTags/notesTags
  public readonly auditLogs?: any[];
}

SystemEdition.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 100],
      },
    },
    modules: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidModules(value: any) {
          const validKeys = ['co_branding', 'document_management', 'notes', 'certifications', 'delegate_access', 'seat_management'];
          const keys = Object.keys(value);
          const invalidKeys = keys.filter(key => !validKeys.includes(key));
          if (invalidKeys.length > 0) {
            throw new Error(`Invalid module keys: ${invalidKeys.join(', ')}`);
          }
          // Check all values are boolean
          for (const key of keys) {
            if (typeof value[key] !== 'boolean') {
              throw new Error(`Module ${key} must be a boolean`);
            }
          }
        },
      },
    },
    archived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    logoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    organizationName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    slogan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    primaryBrandColor: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '#294199',
    },
    secondaryBrandColor: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '#FF9E1E',
    },
    documentSettings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        useMasterPin: true,
        useDocumentViewPin: false,
        reminderEnabled: true,
        reminderDays: [7, 30],
        expirationDate: null
      },
      validate: {
        isValidDocumentSettings(value: DocumentSettings) {
          if (typeof value.useMasterPin !== 'boolean') {
            throw new Error('useMasterPin must be a boolean');
          }
          if (typeof value.useDocumentViewPin !== 'boolean') {
            throw new Error('useDocumentViewPin must be a boolean');
          }
          if (typeof value.reminderEnabled !== 'boolean') {
            throw new Error('reminderEnabled must be a boolean');
          }
          if (!Array.isArray(value.reminderDays)) {
            throw new Error('reminderDays must be an array');
          }
          if (value.reminderDays.some(day => typeof day !== 'number' || day < 1 || day > 365)) {
            throw new Error('reminderDays must contain numbers between 1 and 365');
          }
        },
      },
    },
    notesSettings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        useMasterPin: true,
        useDocumentViewPin: false,
        reminderEnabled: true,
        reminderDays: [7, 30],
        expirationDate: null
      },
      validate: {
        isValidNotesSettings(value: NotesSettings) {
          if (typeof value.useMasterPin !== 'boolean') {
            throw new Error('useMasterPin must be a boolean');
          }
          if (typeof value.useDocumentViewPin !== 'boolean') {
            throw new Error('useDocumentViewPin must be a boolean');
          }
          if (typeof value.reminderEnabled !== 'boolean') {
            throw new Error('reminderEnabled must be a boolean');
          }
          if (!Array.isArray(value.reminderDays)) {
            throw new Error('reminderDays must be an array');
          }
          if (value.reminderDays.some(day => typeof day !== 'number' || day < 1 || day > 365)) {
            throw new Error('reminderDays must contain numbers between 1 and 365');
          }
        },
      },
    },
    certificationSettings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        useMasterPin: true,
        useDocumentViewPin: false,
        reminderEnabled: true,
        reminderDays: [7, 30],
        expirationDate: null
      },
      validate: {
        isValidCertificationSettings(value: CertificationSettings) {
          if (typeof value.useMasterPin !== 'boolean') {
            throw new Error('useMasterPin must be a boolean');
          }
          if (typeof value.useDocumentViewPin !== 'boolean') {
            throw new Error('useDocumentViewPin must be a boolean');
          }
          if (typeof value.reminderEnabled !== 'boolean') {
            throw new Error('reminderEnabled must be a boolean');
          }
          if (!Array.isArray(value.reminderDays)) {
            throw new Error('reminderDays must be an array');
          }
          if (value.reminderDays.some(day => typeof day !== 'number' || day < 1 || day > 365)) {
            throw new Error('reminderDays must contain numbers between 1 and 365');
          }
        },
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    lastUpdatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
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
    modelName: 'SystemEdition',
    tableName: 'system_editions',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['name'],
        where: {
          deleted_at: null,
        },
      },
      {
        fields: ['archived'],
      },
      {
        fields: ['created_by'],
      },
    ],
    hooks: {
      afterCreate: async (systemEdition: SystemEdition) => {
        await SystemEditionTrigger.onCreate(systemEdition);
      },
    },
  }
);

// Export the interfaces for use in other files
export type { DocumentSettings, NotesSettings, CertificationSettings, SystemEditionAttributes, SystemEditionCreationAttributes }; 