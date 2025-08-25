import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

interface CustomFieldAttributes {
  id: string;
  systemEditionId: string;
  fieldName: string;
  fieldType: 'Number' | 'Text' | 'Date' | 'Dropdown' | 'Checkbox';
  helpText?: string;
  isMandatory: boolean;
  useDecimals: boolean;
  dropdownOptions?: string[];
  fieldOrder: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomFieldCreationAttributes 
  extends Optional<CustomFieldAttributes, 'id' | 'helpText' | 'isMandatory' | 'useDecimals' | 'dropdownOptions' | 'fieldOrder' | 'isActive' | 'createdBy' | 'createdAt' | 'updatedAt'> {}

export class CustomField extends Model<CustomFieldAttributes, CustomFieldCreationAttributes> implements CustomFieldAttributes {
  public id!: string;
  public systemEditionId!: string;
  public fieldName!: string;
  public fieldType!: 'Number' | 'Text' | 'Date' | 'Dropdown' | 'Checkbox';
  public helpText?: string;
  public isMandatory!: boolean;
  public useDecimals!: boolean;
  public dropdownOptions?: string[];
  public fieldOrder!: number;
  public isActive!: boolean;
  public createdBy?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly systemEdition?: any;
  public readonly creator?: any;
}

CustomField.init(
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
    fieldName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    fieldType: {
      type: DataTypes.ENUM('Number', 'Text', 'Date', 'Dropdown', 'Checkbox'),
      allowNull: false,
    },
    helpText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isMandatory: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    useDecimals: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      validate: {
        validateDecimalsForNumberType(this: CustomField, value: boolean) {
          const currentFieldType = this.get('fieldType');
          if (value && currentFieldType !== 'Number') {
            throw new Error('useDecimals can only be true for Number field type');
          }
        },
      },
    },
    dropdownOptions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      validate: {
        validateDropdownOptions(this: CustomField, value: string[] | null) {
          const currentFieldType = this.get('fieldType');
          if (currentFieldType === 'Dropdown') {
            if (!value || !Array.isArray(value) || value.length === 0) {
              throw new Error('Dropdown field type must have at least one option');
            }
            if (value.some(option => typeof option !== 'string' || option.trim().length === 0)) {
              throw new Error('All dropdown options must be non-empty strings');
            }
          } else if (value !== null && value !== undefined) {
            throw new Error('dropdownOptions can only be set for Dropdown field type');
          }
        },
      },
    },
    fieldOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdBy: {
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
    modelName: 'CustomField',
    tableName: 'custom_fields',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['system_edition_id'],
      },
      {
        fields: ['field_type'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['field_order'],
      },
      {
        fields: ['system_edition_id', 'is_active'],
      },
      {
        fields: ['created_by'],
      },
    ],
  }
);

export type { CustomFieldAttributes, CustomFieldCreationAttributes }; 