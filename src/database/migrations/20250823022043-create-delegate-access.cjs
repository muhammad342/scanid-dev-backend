'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.createTable('delegate_access', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      delegator_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      delegate_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      permissions: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    await queryInterface.addIndex('delegate_access', ['system_edition_id', 'delegator_id', 'delegate_id'], {
      unique: true,
      where: { deleted_at: null }
    });
    await queryInterface.addIndex('delegate_access', ['system_edition_id']);
    await queryInterface.addIndex('delegate_access', ['delegator_id']);
    await queryInterface.addIndex('delegate_access', ['delegate_id']);
    await queryInterface.addIndex('delegate_access', ['is_active']);
    await queryInterface.addIndex('delegate_access', ['expiration_date']);
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.dropTable('delegate_access');
  }
};
