'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('delegate_access', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      delegator_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      delegate_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      system_edition_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'system_editions',
          key: 'id',
        },
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id',
        },
      },
      access_level: {
        type: Sequelize.ENUM('read', 'write', 'admin'),
        allowNull: false,
        defaultValue: 'read',
      },
      expiration_date: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.addIndex('delegate_access', ['delegator_id']);
    await queryInterface.addIndex('delegate_access', ['delegate_id']);
    await queryInterface.addIndex('delegate_access', ['system_edition_id']);
    await queryInterface.addIndex('delegate_access', ['company_id']);
    await queryInterface.addIndex('delegate_access', ['access_level']);
    await queryInterface.addIndex('delegate_access', ['expiration_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('delegate_access');
  }
}; 