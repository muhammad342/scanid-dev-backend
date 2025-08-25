'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.createTable('user_roles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      system_edition_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'system_editions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'companies',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      channel_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'channels',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      granted_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      granted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      revoked_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
    });

    // Add indexes
    await queryInterface.addIndex('user_roles', ['user_id']);
    await queryInterface.addIndex('user_roles', ['role_id']);
    await queryInterface.addIndex('user_roles', ['system_edition_id']);
    await queryInterface.addIndex('user_roles', ['company_id']);
    await queryInterface.addIndex('user_roles', ['channel_id']);
    await queryInterface.addIndex('user_roles', ['is_active']);
    await queryInterface.addIndex('user_roles', ['granted_at']);
    await queryInterface.addIndex('user_roles', ['expires_at']);
    await queryInterface.addIndex('user_roles', ['revoked_at']);
    
    // Composite indexes for common queries
    await queryInterface.addIndex('user_roles', ['user_id', 'is_active', 'revoked_at']);
    await queryInterface.addIndex('user_roles', ['user_id', 'role_id', 'is_active']);
    await queryInterface.addIndex('user_roles', ['user_id', 'system_edition_id', 'is_active']);
    await queryInterface.addIndex('user_roles', ['user_id', 'company_id', 'is_active']);
    await queryInterface.addIndex('user_roles', ['user_id', 'channel_id', 'is_active']);
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.dropTable('user_roles');
  }
};
