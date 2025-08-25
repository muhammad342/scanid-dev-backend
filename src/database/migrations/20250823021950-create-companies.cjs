'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.createTable('companies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      system_edition_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'system_editions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      company_admin_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      total_seats: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      used_seats: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        allowNull: false,
        defaultValue: 'active',
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      channel_partner_split: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      commission: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      encrypted_master_pin: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      pin_options: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          documents: false,
          notes: false,
          certificates: false,
        },
      },
      pin_settings: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          requireToView: false,
          requireToEdit: false,
        },
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes
    await queryInterface.addIndex('companies', ['system_edition_id']);
    await queryInterface.addIndex('companies', ['company_admin_id']);
    await queryInterface.addIndex('companies', ['status']);
    await queryInterface.addIndex('companies', ['name']);
    await queryInterface.addIndex('companies', ['type']);
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.dropTable('companies');
  }
};
