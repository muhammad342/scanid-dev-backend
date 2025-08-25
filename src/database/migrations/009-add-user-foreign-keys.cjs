'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('users', {
      fields: ['company_id'],
      type: 'foreign key',
      name: 'users_company_id_fkey',
      references: {
        table: 'companies',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('users', {
      fields: ['system_edition_id'],
      type: 'foreign key',
      name: 'users_system_edition_id_fkey',
      references: {
        table: 'system_editions',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('users', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'users_created_by_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('users', 'users_company_id_fkey');
    await queryInterface.removeConstraint('users', 'users_system_edition_id_fkey');
    await queryInterface.removeConstraint('users', 'users_created_by_fkey');
  }
}; 