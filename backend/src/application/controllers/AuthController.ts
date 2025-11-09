/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { logger } from '../../utils/logger';

export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/register
   * Register a new user
   */
  register = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { email, username, password, displayName } = req.body;

      // Validation
      if (!email || !username || !password || !displayName) {
        res.status(400).json({
          success: false,
          message: 'All fields are required',
        });
        return;
      }

      const { user, tokens } = await this.authService.register({
        email,
        username,
        password,
        displayName,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please verify your email.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            twoFactorEnabled: user.twoFactorEnabled,
            securityPinConfigured: user.securityPinConfigured,
            isEmailVerified: user.isEmailVerified,
          },
          tokens,
          requiresTwoFactorSetup: !user.twoFactorEnabled,
          requiresSecurityPinSetup: !user.securityPinConfigured,
        },
      });
    } catch (error: any) {
      logger.error('Register error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  };

  /**
   * POST /api/auth/login
   * Login user
   */
  login = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
        return;
      }

      const { user, tokens } = await this.authService.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            twoFactorEnabled: user.twoFactorEnabled,
            securityPinConfigured: user.securityPinConfigured,
            isEmailVerified: user.isEmailVerified,
          },
          tokens,
          requiresTwoFactorSetup: !user.twoFactorEnabled,
          requiresSecurityPinSetup: !user.securityPinConfigured,
        },
      });
    } catch (error: any) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  };

  /**
   * POST /api/auth/logout
   * Logout user
   */
  logout = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const refreshToken = req.body.refreshToken;

      if (!userId || !refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Invalid request',
        });
        return;
      }

      await this.authService.logout(userId, refreshToken);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error: any) {
      logger.error('Logout error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Logout failed',
      });
    }
  };

  /**
   * POST /api/auth/refresh-token
   * Refresh access token
   */
  refreshToken = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
        return;
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens },
      });
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed',
      });
    }
  };

  /**
   * POST /api/auth/verify-email
   * Verify email with OTP
   */
  verifyEmail = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { email, otpCode } = req.body;

      if (!email || !otpCode) {
        res.status(400).json({
          success: false,
          message: 'Email and OTP code are required',
        });
        return;
      }

      await this.authService.verifyEmail(email, otpCode);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error: any) {
      logger.error('Email verification error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Email verification failed',
      });
    }
  };

  /**
   * POST /api/auth/resend-verification
   * Resend email verification OTP
   */
  resendVerification = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      await this.authService.sendEmailVerificationOTP(email);

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (error: any) {
      logger.error('Resend verification error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send verification email',
      });
    }
  };

  /**
   * POST /api/auth/forgot-password
   * Request password reset OTP
   */
  forgotPassword = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      await this.authService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        message: 'Password reset OTP sent to your email',
      });
    } catch (error: any) {
      logger.error('Forgot password error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send password reset email',
      });
    }
  };

  /**
   * POST /api/auth/reset-password
   * Reset password with OTP
   */
  resetPassword = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { email, otpCode, newPassword } = req.body;

      if (!email || !otpCode || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Email, OTP code, and new password are required',
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
        });
        return;
      }

      await this.authService.resetPassword(email, otpCode, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      logger.error('Reset password error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Password reset failed',
      });
    }
  };

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  getMe = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // This would typically fetch user from repository
      res.status(200).json({
        success: true,
        data: {
          user: (req as any).user,
        },
      });
    } catch (error: any) {
      logger.error('Get me error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get user',
      });
    }
  };
}
