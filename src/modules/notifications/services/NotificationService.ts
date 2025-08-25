import nodemailer from 'nodemailer';
import { config } from '../../../config/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface EmailTemplate {
  name: string;
  subject: string;
  template: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export class NotificationService {
  private transporter: nodemailer.Transporter;
  private templatesDir: string;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });

    // Templates directory is relative to the service file
    this.templatesDir = path.join(__dirname, '..', 'templates');
    
    // Ensure templates directory exists
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }
  }

  /**
   * Initialize the email service and verify connection
   */
  async initialize(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('Email service initialized successfully');
      console.log('Templates directory:', this.templatesDir);
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  /**
   * Send an email using a template
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      const templatePath = path.join(this.templatesDir, `${options.template}.hbs`);
      console.log('Looking for template at:', templatePath);
      
      if (!fs.existsSync(templatePath)) {
        console.error(`Template not found at path: ${templatePath}`);
        throw new Error(`Template ${options.template} not found`);
      }

      const template = fs.readFileSync(templatePath, 'utf-8');
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate(options.context);

      const mailOptions = {
        from: `"${config.email.senderName}" <${config.email.user}>`,
        to: options.to,
        subject: options.subject,
        html,
        attachments: options.attachments,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send a welcome email to a new user
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to Our Platform',
      template: 'welcome',
      context: {
        firstName,
        loginUrl: config.app.frontendUrl + '/login',
      },
    });
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        resetUrl: `${config.app.frontendUrl}/reset-password?token=${resetToken}`,
      },
    });
  }

  /**
   * Send an email to notify admins about new user registration
   */
  async sendNewUserNotification(adminEmails: string[], newUser: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }): Promise<void> {
    await this.sendEmail({
      to: adminEmails,
      subject: 'New User Registration',
      template: 'new-user-notification',
      context: {
        user: newUser,
        dashboardUrl: `${config.app.frontendUrl}/admin/users`,
      },
    });
  }

  /**
   * Send an email to notify about system edition changes
   */
  async sendEditionUpdateNotification(
    adminEmails: string[],
    editionName: string,
    changes: Record<string, any>
  ): Promise<void> {
    await this.sendEmail({
      to: adminEmails,
      subject: `System Edition Update: ${editionName}`,
      template: 'edition-update',
      context: {
        editionName,
        changes,
        dashboardUrl: `${config.app.frontendUrl}/admin/editions`,
      },
    });
  }

  /**
   * Send an email about seat assignment changes
   */
  async sendSeatAssignmentNotification(
    email: string,
    companyName: string,
    action: 'assigned' | 'removed'
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Seat ${action === 'assigned' ? 'Assignment' : 'Removal'} Notification`,
      template: 'seat-notification',
      context: {
        companyName,
        action,
        dashboardUrl: `${config.app.frontendUrl}/dashboard`,
      },
    });
  }

  /**
   * Send a welcome email to a new edition admin with their temporary password
   */
  async sendEditionAdminWelcomeEmail(
    email: string,
    firstName: string,
    editionName: string,
    tempPassword: string,
    expirationDate?: Date
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to the Edition Admin Team',
      template: 'edition-admin-welcome',
      context: {
        firstName,
        email,
        editionName,
        tempPassword,
        loginUrl: config.app.frontendUrl + '/login',
        expirationDate: expirationDate ? new Date(expirationDate).toLocaleDateString() : undefined,
      },
    });
  }

  /**
   * Send invitation email to a new user based on their role
   */
  async sendUserInvitationEmail(
    email: string,
    firstName: string,
    role: string,
    tempPassword: string,
    companyName?: string,
    expirationDate?: Date
  ): Promise<void> {
    let template: string;
    let subject: string;
    let context: Record<string, any> = {
      firstName,
      email,
      tempPassword,
      loginUrl: config.app.frontendUrl + '/login',
      expirationDate: expirationDate ? new Date(expirationDate).toLocaleDateString() : undefined,
    };

    switch (role) {
      case 'super_admin':
        template = 'super-admin-invite';
        subject = 'Welcome as a Super Administrator';
        break;
      case 'edition_admin':
        template = 'edition-admin-welcome';
        subject = 'Welcome to the Edition Admin Team';
        // For edition admin, we need editionName which should be passed separately
        context['editionName'] = companyName || 'Your Edition';
        break;
      case 'company_admin':
        template = 'company-admin-invite';
        subject = `Welcome to ${companyName || 'Your Company'} as Company Administrator`;
        context['companyName'] = companyName || 'Your Company';
        break;
      case 'delegate':
        template = 'delegate-invite';
        subject = `Welcome as a Delegate to ${companyName || 'Your Company'}`;
        context['companyName'] = companyName || 'Your Company';
        break;
      case 'user':
      default:
        template = 'user-invite';
        subject = `Welcome to ${companyName || 'Your Company'}`;
        context['companyName'] = companyName || 'Your Company';
        break;
    }

    await this.sendEmail({
      to: email,
      subject,
      template,
      context,
    });
  }
}

export const notificationService = new NotificationService(); 