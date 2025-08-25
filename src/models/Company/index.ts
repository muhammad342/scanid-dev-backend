import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { EncryptionService } from '../../shared/utils/encryption.js';

interface PinOptions {
  documents: boolean;
  notes: boolean;
  certificates: boolean;
}

interface PinSettings {
  requireToView: boolean;
  requireToEdit: boolean;
}

interface CompanyAttributes {
  id: string;
  name: string;
  systemEditionId: string;
  companyAdminId?: string;
  totalSeats: number;
  usedSeats: number;
  availableSeats: number;
  status: 'active' | 'inactive' | 'suspended';
  type?: string;
  address?: string;
  title?: string;
  channelPartnerSplit?: boolean;
  commission?: number;
  paymentMethod?: string;
  encryptedMasterPin?: string;
  pinOptions: PinOptions;
  pinSettings: PinSettings;
  createdAt: Date;
  updatedAt: Date;
}

interface CompanyCreationAttributes 
  extends Optional<CompanyAttributes, 'id' | 'usedSeats' | 'availableSeats' | 'status' | 'type' | 'address' | 'title' | 'channelPartnerSplit' | 'commission' | 'paymentMethod' | 'encryptedMasterPin' | 'pinOptions' | 'pinSettings' | 'createdAt' | 'updatedAt' | 'companyAdminId'> {}

export class Company extends Model<CompanyAttributes, CompanyCreationAttributes> 
  implements CompanyAttributes {
  public id!: string;
  public name!: string;
  public systemEditionId!: string;
  public companyAdminId?: string;
  public totalSeats!: number;
  public usedSeats!: number;
  public availableSeats!: number;
  public status!: 'active' | 'inactive' | 'suspended';
  public type?: string;
  public address?: string;
  public title?: string;
  public channelPartnerSplit?: boolean;
  public commission?: number;
  public paymentMethod?: string;
  public encryptedMasterPin?: string;
  public pinOptions!: PinOptions;
  public pinSettings!: PinSettings;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly systemEdition?: any;
  public readonly companyAdmin?: any;
  public readonly users?: any[];
  public readonly delegates?: any[];

  // Helper methods for PIN management
  public setMasterPin(pin: string, encryptionKey: string) {
    this.encryptedMasterPin = EncryptionService.encrypt(pin, encryptionKey);
  }

  public validateMasterPin(pin: string, encryptionKey: string): boolean {
    if (!this.encryptedMasterPin) return false;
    try {
      const decryptedPin = EncryptionService.decrypt(this.encryptedMasterPin, encryptionKey);
      return decryptedPin === pin;
    } catch (error) {
      return false;
    }
  }
}

Company.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100],
      },
    },
    systemEditionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'system_editions',
        key: 'id',
      },
    },
    companyAdminId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    totalSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    usedSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    availableSeats: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.totalSeats - this.usedSeats;
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [1, 50],
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [1, 100],
      },
    },
    channelPartnerSplit: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    commission: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [1, 50],
      },
    },
    encryptedMasterPin: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pinOptions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        documents: false,
        notes: false,
        certificates: false,
      },
      validate: {
        isValidPinOptions(value: PinOptions) {
          if (!value || typeof value !== 'object') {
            throw new Error('Invalid pinOptions structure');
          }
          if (typeof value.documents !== 'boolean' ||
              typeof value.notes !== 'boolean' ||
              typeof value.certificates !== 'boolean') {
            throw new Error('All pinOptions fields must be boolean');
          }
        },
      },
    },
    pinSettings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        requireToView: false,
        requireToEdit: false,
      },
      validate: {
        isValidPinSettings(value: PinSettings) {
          if (!value || typeof value !== 'object') {
            throw new Error('Invalid pinSettings structure');
          }
          if (typeof value.requireToView !== 'boolean' ||
              typeof value.requireToEdit !== 'boolean') {
            throw new Error('All pinSettings fields must be boolean');
          }
        },
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
    modelName: 'Company',
    tableName: 'companies',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['system_edition_id'],
      },
      {
        fields: ['company_admin_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['name'],
      },
      {
        fields: ['type'],
      },
    ],
    hooks: {
      beforeValidate: (company: Company) => {
        // Ensure used seats doesn't exceed total seats
        if (company.usedSeats > company.totalSeats) {
          throw new Error('Used seats cannot exceed total seats');
        }
      },
    },
  }
);

export default Company; 