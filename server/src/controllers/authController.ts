import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { AuthenticatedRequest, AuthUser } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(1),
});

export function generateTokens(user: { id: string; username: string; role: 'owner' | 'pharmacist'; fullName: string }) {
  const payload: AuthUser = {
    userId: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
  };

  const accessToken = jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiry as any,
  });

  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiry as any,
  });

  return { accessToken, refreshToken, payload };
}

export const authController = {
  async login(req: Request, res: Response) {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      await logAuditEvent({
        username,
        action: 'AUTH_LOGIN_FAILED',
        details: { reason: 'User not found' },
        ipAddress,
        userAgent,
      });
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    if (!user.isActive) {
      await logAuditEvent({
        userId: user._id,
        username: user.username,
        role: user.role,
        action: 'AUTH_LOGIN_FAILED',
        details: { reason: 'Account deactivated' },
        ipAddress,
        userAgent,
      });
      res.status(403).json({ error: 'Account has been deactivated. Please contact the owner.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await logAuditEvent({
        userId: user._id,
        username: user.username,
        role: user.role,
        action: 'AUTH_LOGIN_FAILED',
        details: { reason: 'Invalid password' },
        ipAddress,
        userAgent,
      });
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken, payload } = generateTokens({
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    await logAuditEvent({
      userId: user._id,
      username: user.username,
      role: user.role,
      action: 'AUTH_LOGIN_SUCCESS',
      details: { role: user.role },
      ipAddress,
      userAgent,
    });

    res.json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  },

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token required' });
      return;
    }

    try {
      const payload = jwt.verify(refreshToken, config.jwtRefreshSecret) as AuthUser;
      const user = await User.findById(payload.userId);

      if (!user || !user.isActive) {
        res.status(401).json({ error: 'User no longer valid or active' });
        return;
      }

      const tokens = generateTokens({
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        accessToken: tokens.accessToken,
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
  },

  async logout(req: AuthenticatedRequest, res: Response) {
    if (req.user) {
      await logAuditEvent({
        userId: req.user.userId,
        username: req.user.username,
        role: req.user.role,
        action: 'AUTH_LOGOUT',
        ipAddress: req.ip,
      });
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  },

  async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or deactivated' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  },
};
