import { User } from '../index.js';
import { Company } from '../../Company/index.js';
import { SystemEdition } from '../../SystemEdition/index.js';
import { notificationService } from '../../../modules/notifications/services/NotificationService.js';
import { logger } from '../../../shared/utils/logger.js';
import config from '../../../config/index.js';
import bcrypt from 'bcryptjs';

export class UserTrigger {
  /**
   * Trigger fired after creation (after INSERT) - Main onCreate trigger
   */
  static async onCreate(user: User): Promise<void> {
    const userData = user.get({ plain: true });
    
    try {
      logger.info(`User onCreate triggered for user: ${userData.id} (${userData.email})`);

      // Check if this user was created with a temporary password
      // We can determine this by checking if the user has never logged in
      // and if they were created recently (within the last few minutes)
      const isNewInvitedUser = !userData.lastLoginAt && 
        (new Date().getTime() - new Date(userData.createdAt).getTime()) < 5 * 60 * 1000; // 5 minutes

      if (isNewInvitedUser) {
        logger.info(`Sending invitation email to new user: ${userData.email}`);
        
        // Get company name and edition name from the user's active role context
        let companyName: string | undefined;
        let editionName: string | undefined;
        let userRole: string | undefined;

        try {
          // Get the user's active role to determine context
          const activeRole = await user.getActiveRole();
          
          if (activeRole) {
            userRole = activeRole.role?.name;
            
            // Get company name if available from active role
            if (activeRole.companyId) {
              try {
                const company = await Company.findByPk(activeRole.companyId);
                if (company) {
                  companyName = company.name;
                }
              } catch (error) {
                logger.warn(`Failed to fetch company name for user ${userData.id}:`, error);
              }
            }

            // Get edition name if available from active role
            if (activeRole.systemEditionId) {
              try {
                const edition = await SystemEdition.findByPk(activeRole.systemEditionId);
                if (edition) {
                  editionName = edition.name;
                }
              } catch (error) {
                logger.warn(`Failed to fetch edition name for user ${userData.id}:`, error);
              }
            }
          }
        } catch (error) {
          logger.warn(`Failed to get active role context for user ${userData.id}:`, error);
        }

        const isTempPassword = await bcrypt.compare("placeholder_password_will_be_replaced", userData.password);

        let newPassword = "";
        if(isTempPassword) {
          newPassword = this.generateSecurePassword();
          const hashedPassword = await bcrypt.hash(newPassword, config.app.bcryptSaltRounds);

          await User.update(
            { password: hashedPassword },
            { where: { id: userData.id } }
          );
        }
        
        logger.info(`Password updated for user ${userData.email} in trigger [UserTrigger-onCreate]`);

        // Send role-based invitation email with the new password
        await notificationService.sendUserInvitationEmail(
          userData.email,
          userData.firstName,
          userRole || 'user', // Default to 'user' if no role found
          newPassword, // Send the actual password (not hashed)
          companyName || editionName,
          userData.expirationDate
        );

        logger.info(`✅ Invitation email sent successfully to user: ${userData.email}`);
      } else {
        logger.info(`User ${userData.email} is not a new invited user, skipping email`);
      }

      logger.info('✅ User onCreate trigger completed successfully', { 
        id: userData.id,
        email: userData.email,
        emailSent: isNewInvitedUser
      });
      
    } catch (error) {
      logger.error(`❌ Error in User onCreate trigger: ${error}`);
    }
  }

  /**
   * Generate a secure password for new users
   * This password will be saved to the database and sent via email
   */
  private static generateSecurePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each required category
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special character
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
} 