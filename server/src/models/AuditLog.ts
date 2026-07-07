import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLogDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure';
  details?: string;
  timestamp: Date;
}

const AuditLogSchema: Schema<IAuditLogDocument> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  action: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    required: true
  },
  details: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
});

// Indexes for security audit log reporting
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });

export const AuditLog = mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
