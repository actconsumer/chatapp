/**
 * Email Service
 * Handles email sending for OTP verification, password reset, etc.
 */

import nodemailer from 'nodemailer';
import { logger } from './logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@project-chat.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Project Chat';
  }

  public async initialize(): Promise<void> {
    try {
      const service = process.env.EMAIL_SERVICE;

      if (service === 'azure-communication-services') {
        // Configure Azure Communication Services
        // For production, integrate with Azure Communication Services SDK
        logger.info('Email service: Azure Communication Services');
      } else if (process.env.SENDGRID_API_KEY) {
        // Configure SendGrid
        this.transporter = nodemailer.createTransport({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY,
          },
        });
        logger.info('Email service: SendGrid');
      } else {
        // Development mode - use Ethereal for testing
        if (process.env.NODE_ENV === 'development') {
          const testAccount = await nodemailer.createTestAccount();
          this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
          logger.info('Email service: Ethereal (development)');
        }
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        logger.warn('Email transporter not configured. Email not sent.');
        // In development, just log the email
        if (process.env.NODE_ENV === 'development') {
          logger.info('Email would be sent:', {
            to: options.to,
            subject: options.subject,
            content: options.text || options.html,
          });
          return true;
        }
        return false;
      }

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent:', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
      });

      // Preview URL for Ethereal
      if (process.env.NODE_ENV === 'development') {
        logger.info('Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  public async sendOTPEmail(email: string, otp: string, purpose: string): Promise<boolean> {
    const subject = purpose === 'email_verification' 
      ? 'Verify your email address' 
      : 'Password reset code';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-code { background: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; border: 2px dashed #667eea; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Project Chat</h1>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            <p>Hello,</p>
            <p>Your verification code is:</p>
            <div class="otp-code">${otp}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Project Chat. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Your ${purpose.replace('_', ' ')} code is: ${otp}. This code will expire in 10 minutes.`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  public async sendWelcomeEmail(email: string, displayName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Project Chat! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hi ${displayName},</h2>
            <p>Welcome to Project Chat! We're excited to have you on board.</p>
            <p>You can now start chatting with friends, sharing moments through stories, and much more.</p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Happy chatting!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Project Chat!',
      html,
      text: `Welcome to Project Chat, ${displayName}!`,
    });
  }
}

export const emailService = new EmailService();
