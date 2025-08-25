'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.createTable('custom_fields', {
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
      field_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      field_type: {
        type: Sequelize.ENUM('Number', 'Text', 'Date', 'Dropdown', 'Checkbox'),
        allowNull: false,
      },
      help_text: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_mandatory: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      use_decimals: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      dropdown_options: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      field_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_by: {
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes
    await queryInterface.addIndex('custom_fields', ['system_edition_id']);
    await queryInterface.addIndex('custom_fields', ['field_type']);
    await queryInterface.addIndex('custom_fields', ['is_active']);
    await queryInterface.addIndex('custom_fields', ['field_order']);
    await queryInterface.addIndex('custom_fields', ['system_edition_id', 'is_active']);
    await queryInterface.addIndex('custom_fields', ['created_by']);
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.dropTable('custom_fields');
  }
};
