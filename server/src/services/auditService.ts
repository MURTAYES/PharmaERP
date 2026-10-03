import { AuditLog } from '../models/AuditLog.js';
import mongoose from 'mongoose';

export interface LogAuditParams {
  userId?: string | mongoose.Types.ObjectId;
  username: string;
  role?: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    const userObjectId =
      params.userId && mongoose.Types.ObjectId.isValid(params.userId.toString())
        ? new mongoose.Types.ObjectId(params.userId.toString())
        : undefined;

    await AuditLog.create({
      timestamp: new Date(),
      userId: userObjectId,
      username: params.username,
      role: params.role,
      action: params.action,
      details: params.details || {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    console.error('[AuditService] Failed to record audit log:', error);
    // Non-blocking: don't crash main request flow if audit write fails
  }
}
