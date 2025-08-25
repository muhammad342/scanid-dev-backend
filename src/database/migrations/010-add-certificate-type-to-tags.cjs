'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Add 'certificate' to the existing ENUM type
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_tags_type" ADD VALUE 'certificate';
    `);
  },

  down: async () => {
    // Note: PostgreSQL doesn't support removing ENUM values directly
    // This would require recreating the ENUM type, which could be complex
    // For now, we'll leave the 'certificate' value in place
    console.log('Warning: Cannot remove ENUM value "certificate" without recreating the ENUM type');
  }
}; 