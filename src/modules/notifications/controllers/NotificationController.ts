import { Request, Response } from 'express';
import { notificationService } from '../services/NotificationService.js';
import { sendSuccess, sendError } from '../../../shared/utils/response.js';

export class NotificationController {
  /**
   * Send a test email to verify email configuration
   */
  async sendTestEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      await notificationService.sendEmail({
        to: email,
        subject: 'Test Email',
        template: 'test',
        context: {
          message: 'This is a test email to verify the email configuration.',
        },
      });

      sendSuccess(res, null, 'Test email sent successfully');
    } catch (error) {
      sendError(
        res,
        'Failed to send test email',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Send welcome email to a new user
   */
  async sendWelcomeEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, firstName } = req.body;

      await notificationService.sendWelcomeEmail(email, firstName);

      sendSuccess(res, null, 'Welcome email sent successfully');
    } catch (error) {
      sendError(
        res,
        'Failed to send welcome email',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, resetToken } = req.body;

      await notificationService.sendPasswordResetEmail(email, resetToken);

      sendSuccess(res, null, 'Password reset email sent successfully');
    } catch (error) {
      sendError(
        res,
        'Failed to send password reset email',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Send notification about new user registration to admins
   */
  async sendNewUserNotification(req: Request, res: Response): Promise<void> {
    try {
      const { adminEmails, newUser } = req.body;

      await notificationService.sendNewUserNotification(adminEmails, newUser);

      sendSuccess(res, null, 'New user notification sent successfully');
    } catch (error) {
      sendError(
        res,
        'Failed to send new user notification',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Send notification about system edition changes
   */
  async sendEditionUpdateNotification(req: Request, res: Response): Promise<void> {
    try {
      const { adminEmails, editionName, changes } = req.body;

      await notificationService.sendEditionUpdateNotification(adminEmails, editionName, changes);

      sendSuccess(res, null, 'Edition update notification sent successfully');
    } catch (error) {
      sendError(
        res,
        'Failed to send edition update notification',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Send notification about seat assignment changes
   */
  async sendSeatAssignmentNotification(req: Request, res: Response): Promise<void> {
    try {
      const { email, companyName, action } = req.body;

      await notificationService.sendSeatAssignmentNotification(email, companyName, action);

      sendSuccess(res, null, 'Seat assignment notification sent successfully');
    } catch (error) {
      sendError(
        res,
        'Failed to send seat assignment notification',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}

export const notificationController = new NotificationController(); 