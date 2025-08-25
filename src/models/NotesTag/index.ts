import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

interface NotesTagAttributes {
  id: string;
  systemEditionId: string;
  name: string;
  description?: string;
  color?: string;
  useMasterPin: boolean;
  useDocumentViewPin: boolean;
  reminderEnabled: boolean;
  reminderDays: number[];
  expirationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface NotesTagCreationAttributes 
  extends Optional<NotesTagAttributes, 'id' | 'description' | 'color' | 'useMasterPin' | 'useDocumentViewPin' | 'reminderEnabled' | 'reminderDays' | 'expirationDate' | 'createdAt' | 'updatedAt'> {}

export class NotesTag extends Model<NotesTagAttributes, NotesTagCreationAttributes> 
  implements NotesTagAttributes {
  public id!: string;
  public systemEditionId!: string;
  public name!: string;
  public description?: string;
  public color?: string;
  public useMasterPin!: boolean;
  public useDocumentViewPin!: boolean;
  public reminderEnabled!: boolean;
  public reminderDays!: number[];
  public expirationDate?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly systemEdition?: any;
}

NotesTag.init(
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i,
      },
    },
    useMasterPin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    useDocumentViewPin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reminderEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reminderDays: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidDays(value: number[]) {
          const validDays = [1, 7, 10, 15, 30];
          const invalidDays = value.filter(day => !validDays.includes(day));
          if (invalidDays.length > 0) {
            throw new Error(`Invalid reminder days: ${invalidDays.join(', ')}`);
          }
        },
      },
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
    modelName: 'NotesTag',
    tableName: 'notes_tags',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['system_edition_id', 'name'],
        where: {
          deleted_at: null,
        },
      },
      {
        fields: ['system_edition_id'],
      },
      {
        fields: ['use_master_pin'],
      },
      {
        fields: ['use_document_view_pin'],
      },
      {
        fields: ['reminder_enabled'],
      },
      {
        fields: ['expiration_date'],
      },
    ],
  }
);

export default NotesTag; 