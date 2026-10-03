import { Response } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const auditController = {
  async getLogs(req: AuthenticatedRequest, res: Response) {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const action = req.query.action as string | undefined;
    const username = req.query.username as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const query: Record<string, any> = {};

    if (action) {
      query.action = action;
    }

    if (username) {
      query.username = { $regex: username, $options: 'i' };
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  },
};
