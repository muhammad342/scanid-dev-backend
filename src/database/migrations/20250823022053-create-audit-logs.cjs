'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      system_edition_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'system_editions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'companies',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      module: {
        type: Sequelize.ENUM('documents', 'notes', 'certifications', 'users', 'settings', 'system', 'authentication', 'permissions'),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      ip_address: {
        type: Sequelize.INET,
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('audit_logs', ['system_edition_id']);
    await queryInterface.addIndex('audit_logs', ['company_id']);
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['module']);
    await queryInterface.addIndex('audit_logs', ['created_at']);
    await queryInterface.addIndex('audit_logs', ['created_at', 'user_id']);
    await queryInterface.addIndex('audit_logs', ['created_at', 'module']);
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_logs');
  }
};
