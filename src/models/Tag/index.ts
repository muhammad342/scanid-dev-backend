import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

interface TagAttributes {
  id: string;
  systemEditionId: string;
  name: string;
  color?: string;
  type: 'document' | 'note' | 'certificate';
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TagCreationAttributes 
  extends Optional<TagAttributes, 'id' | 'color' | 'isActive' | 'sortOrder' | 'createdAt' | 'updatedAt'> {}

export class Tag extends Model<TagAttributes, TagCreationAttributes> implements TagAttributes {
  public id!: string;
  public systemEditionId!: string;
  public name!: string;
  public color?: string;
  public type!: 'document' | 'note' | 'certificate';
  public isActive!: boolean;
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly systemEdition?: any;
}

Tag.init(
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
    color: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i,
      },
    },
    type: {
      type: DataTypes.ENUM('document', 'note', 'certificate'),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
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
    modelName: 'Tag',
    tableName: 'tags',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['system_edition_id'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['system_edition_id', 'type'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['sort_order'],
      },
    ],
  }
);

export type { TagAttributes, TagCreationAttributes }; 