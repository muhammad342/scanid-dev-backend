'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async function (queryInterface, Sequelize) {
    // Add the active_user_role_id column to users table
    await queryInterface.addColumn('users', 'active_user_role_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'user_roles',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Add index for the new column
    await queryInterface.addIndex('users', ['active_user_role_id']);
  },

  down: async function (queryInterface, Sequelize) {
    // Remove the column
    await queryInterface.removeColumn('users', 'active_user_role_id');
  }
};
