import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

interface SeatManagementAttributes {
  id: string;
  systemEditionId: string;
  allowOrganizationalSeats: boolean;
  seatCostMonthly: number;
  seatCostAnnual: number;
  allowIndividualLicenses: boolean;
  individualParentCostMonthly: number;
  individualParentCostAnnual: number;
  individualParentCostLifetime: number;
  individualChildCostMonthly: number;
  individualChildCostAnnual: number;
  individualChildCostLifetime: number;
  subscriptionSplitPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SeatManagementCreationAttributes 
  extends Optional<SeatManagementAttributes, 'id' | 'allowOrganizationalSeats' | 'allowIndividualLicenses' | 'subscriptionSplitPercentage' | 'createdAt' | 'updatedAt'> {}

export class SeatManagement extends Model<SeatManagementAttributes, SeatManagementCreationAttributes> 
  implements SeatManagementAttributes {
  public id!: string;
  public systemEditionId!: string;
  public allowOrganizationalSeats!: boolean;
  public seatCostMonthly!: number;
  public seatCostAnnual!: number;
  public allowIndividualLicenses!: boolean;
  public individualParentCostMonthly!: number;
  public individualParentCostAnnual!: number;
  public individualParentCostLifetime!: number;
  public individualChildCostMonthly!: number;
  public individualChildCostAnnual!: number;
  public individualChildCostLifetime!: number;
  public subscriptionSplitPercentage!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly systemEdition?: any;
}

SeatManagement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    systemEditionId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'system_editions',
        key: 'id',
      },
    },
    allowOrganizationalSeats: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    seatCostMonthly: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    seatCostAnnual: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    allowIndividualLicenses: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    individualParentCostMonthly: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    individualParentCostAnnual: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    individualParentCostLifetime: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    individualChildCostMonthly: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    individualChildCostAnnual: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    individualChildCostLifetime: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    subscriptionSplitPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
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
    modelName: 'SeatManagement',
    tableName: 'seat_management',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['system_edition_id'],
      },
      {
        fields: ['allow_organizational_seats'],
      },
      {
        fields: ['allow_individual_licenses'],
      },
    ],
  }
);

export default SeatManagement; 