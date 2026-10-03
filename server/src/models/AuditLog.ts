import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAuditLog extends Document {
  timestamp: Date;
  userId?: mongoose.Types.ObjectId;
  username: string;
  role?: string;
  action: string; // e.g. 'AUTH_LOGIN', 'AUTH_LOGOUT', 'USER_CREATE', 'USER_UPDATE', 'PASSWORD_RESET', 'SETTINGS_UPDATE'
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    username: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Append-only guarantee: prevent updating or removing records
auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function () {
  throw new Error('AuditLog collection is immutable and cannot be modified.');
});

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
