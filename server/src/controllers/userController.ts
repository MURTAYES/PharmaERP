import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

export const createUserSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric or underscore'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2).max(100),
  role: z.enum(['owner', 'pharmacist']),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  role: z.enum(['owner', 'pharmacist']).optional(),
  isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const userController = {
  async getAllUsers(req: AuthenticatedRequest, res: Response) {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  },

  async getUserById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  },

  async createUser(req: AuthenticatedRequest, res: Response) {
    const { username, password, fullName, role } = req.body;

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: username.toLowerCase(),
      passwordHash,
      fullName,
      role,
      isActive: true,
    });

    await logAuditEvent({
      userId: req.user?.userId,
      username: req.user?.username || 'system',
      role: req.user?.role,
      action: 'USER_CREATE',
      details: { createdUserId: newUser._id, createdUsername: newUser.username, role },
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      },
    });
  },

  async updateUser(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { fullName, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Safety check: Prevent deactivating the only owner
    if (isActive === false && user.role === 'owner') {
      const activeOwners = await User.countDocuments({ role: 'owner', isActive: true });
      if (activeOwners <= 1) {
        res.status(400).json({ error: 'Cannot deactivate the sole active owner account' });
        return;
      }
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    await logAuditEvent({
      userId: req.user?.userId,
      username: req.user?.username || 'system',
      role: req.user?.role,
      action: 'USER_UPDATE',
      details: { targetUserId: user._id, targetUsername: user.username, changes: req.body },
      ipAddress: req.ip,
    });

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      },
    });
  },

  async resetPassword(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await logAuditEvent({
      userId: req.user?.userId,
      username: req.user?.username || 'system',
      role: req.user?.role,
      action: 'PASSWORD_RESET',
      details: { targetUserId: user._id, targetUsername: user.username },
      ipAddress: req.ip,
    });

    res.json({ message: `Password reset successfully for user ${user.username}` });
  },
};
