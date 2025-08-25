import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

interface ChannelAttributes {
  id: string;
  name: string;
  description?: string;
  systemEditionId: string;
  channelAdminId?: string;
  status: 'active' | 'inactive' | 'suspended';
  revenueSplitPercentage?: number;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChannelCreationAttributes extends Optional<ChannelAttributes, 'id' | 'description' | 'channelAdminId' | 'status' | 'revenueSplitPercentage' | 'contactEmail' | 'contactPhone' | 'createdAt' | 'updatedAt'> {}

export class Channel extends Model<ChannelAttributes, ChannelCreationAttributes> implements ChannelAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public systemEditionId!: string;
  public channelAdminId?: string;
  public status!: 'active' | 'inactive' | 'suspended';
  public revenueSplitPercentage?: number;
  public contactEmail?: string;
  public contactPhone?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly systemEdition?: any;
  public readonly channelAdmin?: any;
  public readonly companies?: any[];
  public readonly userRoles?: any[];
}

Channel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    systemEditionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'system_editions',
        key: 'id',
      },
    },
    channelAdminId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
    },
    revenueSplitPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 100,
      },
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    contactPhone: {
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
    modelName: 'Channel',
    tableName: 'channels',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['system_edition_id'],
      },
      {
        fields: ['channel_admin_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['name'],
      },
      {
        unique: true,
        fields: ['name', 'system_edition_id'],
        where: {
          deleted_at: null,
        },
      },
    ],
  }
);

export default Channel;
