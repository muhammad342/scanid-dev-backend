import { connectDatabase, sequelize } from '../config/database.js';
import { Role, ROLE_NAMES } from '../models/Role/index.js';
import { logger } from '../shared/utils/logger.js';

// Role data to create
const rolesData = [
  {
    name: ROLE_NAMES.SUPER_ADMIN,
    description: 'Super administrator with full system access and control',
    isActive: true
  },
  {
    name: ROLE_NAMES.EDITION_ADMIN,
    description: 'Edition administrator with control over system editions',
    isActive: true
  },
  {
    name: ROLE_NAMES.COMPANY_ADMIN,
    description: 'Company administrator with control over company operations',
    isActive: true
  },
  {
    name: ROLE_NAMES.CHANNEL_ADMIN,
    description: 'Channel administrator with control over communication channels',
    isActive: true
  },
  {
    name: ROLE_NAMES.USER,
    description: 'Regular user with basic access permissions',
    isActive: true
  },
  {
    name: ROLE_NAMES.DELEGATE,
    description: 'Delegate user with temporary access permissions',
    isActive: true
  }
];

const createRoles = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Sync models to ensure tables exist
    await sequelize.sync({ alter: true });
    logger.info('Database models synchronized');

    let createdCount = 0;
    let skippedCount = 0;

    // Create each role
    for (const roleData of rolesData) {
      try {
        // Check if role already exists
        const existingRole = await Role.findOne({ where: { name: roleData.name } });
        
        if (existingRole) {
          logger.warn(`Role '${roleData.name}' already exists`);
          console.log(`⏭️  Role '${roleData.name}' already exists`);
          skippedCount++;
          continue;
        }

        // Create the role
        const role = await Role.create(roleData);
        createdCount++;
        
        logger.info(`Role '${role.name}' created successfully`);
        console.log(`✅ Role '${role.name}' created successfully!`);
        console.log(`   Description: ${role.description}`);
        console.log(`   Active: ${role.isActive}`);
        console.log('');
      } catch (error) {
        logger.error(`Error creating role '${roleData.name}':`, error);
        console.error(`❌ Error creating role '${roleData.name}':`, error);
      }
    }

    // Summary
    console.log('📊 Role Creation Summary:');
    console.log(`   Created: ${createdCount} roles`);
    console.log(`   Skipped: ${skippedCount} roles (already existed)`);
    console.log(`   Total: ${rolesData.length} roles processed`);
    
    if (createdCount > 0) {
      console.log('');
      console.log('🎉 Roles setup completed successfully!');
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Error in role creation script:', error);
    console.error('❌ Error in role creation script:', error);
    process.exit(1);
  }
};

// Run the script
createRoles();
