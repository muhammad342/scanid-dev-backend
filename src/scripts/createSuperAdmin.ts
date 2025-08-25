import { connectDatabase } from '../config/database.js';
import { CreateUserDto, userService } from '../modules/users/services/UserService.js';
import { logger } from '../shared/utils/logger.js';

// Super admin user data
const superAdminData: CreateUserDto = {
  email: 'muhammadbinashraf342@gmail.com',
  password: '123456',
  firstName: 'Muhammad',
  lastName: 'Bin Ashraf',
  isActive: true,
  emailVerified: true,
  phoneNumber: '+1234567890',
  roles: [{ roleName: 'super_admin' }]
};

const createSuperAdmin = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Check if super admin already exists
    const existingAdmin = await userService.getUserByEmail(superAdminData.email);
    if (existingAdmin) {
      logger.warn(`Super admin with email ${superAdminData.email} already exists`);
      console.log('Super admin already exists with the following details:');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.activeRole?.roleName);
      console.log('Active:', existingAdmin.isActive);
      process.exit(0);
    }

    // Create super admin user
    const superAdmin = await userService.createUser(superAdminData);
    
    logger.info('Super admin created successfully');
    console.log('✅ Super admin created successfully!');
    console.log('📧 Email:', superAdmin.email);
    console.log('🔑 Password:', superAdminData.password);
    console.log('👤 Role:', superAdmin.activeRole?.roleName);
    console.log('📱 Phone:', superAdmin.phoneNumber);
    console.log('');
    console.log('🚨 IMPORTANT: Please change the default password after first login!');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error creating super admin:', error);
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
};

// Run the script
createSuperAdmin(); 