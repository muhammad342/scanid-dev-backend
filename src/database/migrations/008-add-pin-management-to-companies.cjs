'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('companies', 'encrypted_master_pin', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('companies', 'pin_options', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {
        documents: false,
        notes: false,
        certificates: false,
      },
    });

    await queryInterface.addColumn('companies', 'pin_settings', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {
        requireToView: false,
        requireToEdit: false,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('companies', 'encrypted_master_pin');
    await queryInterface.removeColumn('companies', 'pin_options');
    await queryInterface.removeColumn('companies', 'pin_settings');
  },
}; 