'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('system_editions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      modules: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      archived: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      logo_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      organization_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      slogan: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      primary_brand_color: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '#294199',
      },
      secondary_brand_color: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '#FF9E1E',
      },
      document_settings: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          useMasterPin: true,
          useDocumentViewPin: false,
          reminderEnabled: true,
          reminderDays: [7, 30],
          expirationDate: null
        },
      },
      notes_settings: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          useMasterPin: true,
          useDocumentViewPin: false,
          reminderEnabled: true,
          reminderDays: [7, 30],
          expirationDate: null
        },
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      last_updated_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
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
    await queryInterface.addIndex('system_editions', ['name'], {
      unique: true,
      where: {
        deleted_at: null,
      },
    });
    await queryInterface.addIndex('system_editions', ['archived']);
    await queryInterface.addIndex('system_editions', ['created_by']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('system_editions');
  }
}; 