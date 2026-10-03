import { Response } from 'express';
import { z } from 'zod';
import { Settings } from '../models/Settings.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

export const updateSettingsSchema = z.object({
  pharmacyName: z.string().min(2).max(100).optional(),
  address: z.string().max(250).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  currency: z.string().max(10).optional(),
  currencySymbol: z.string().max(5).optional(),
  receiptHeader: z.string().max(500).optional(),
  receiptFooter: z.string().max(500).optional(),
  receiptWidth: z.enum(['80mm', '58mm']).optional(),
  charges: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        type: z.enum(['percentage', 'fixed']),
        rate: z.number().min(0),
        isActive: z.boolean(),
      })
    )
    .optional(),
  expiryAlertWindows: z
    .object({
      greenDays: z.number().min(1),
      yellowDays: z.number().min(1),
      redDays: z.number().min(1),
    })
    .optional(),
  categories: z.array(z.string().min(1)).optional(),
});

export const settingsController = {
  async getSettings(_req: AuthenticatedRequest, res: Response) {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ settings });
  },

  async updateSettings(req: AuthenticatedRequest, res: Response) {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }

    await logAuditEvent({
      userId: req.user?.userId,
      username: req.user?.username || 'system',
      role: req.user?.role,
      action: 'SETTINGS_UPDATE',
      details: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip,
    });

    res.json({
      message: 'Settings updated successfully',
      settings,
    });
  },
};
