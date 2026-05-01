import { Schema, model, Document } from 'mongoose';

export interface IAuditLog extends Document {
    flagKey: string;
    action: 'CREATE' | 'UPDATE' | 'TOGGLE' | 'DELETE' | 'BULK_UPDATE';
    changes: {
        before: Record<string, any>;
        after: Record<string, any>;
    };
    userId: string;
    userEmail: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
    flagKey: {
        type: String,
        required: true,
        index: true,
    },
    action: {
        type: String,
        enum: ['CREATE', 'UPDATE', 'TOGGLE', 'DELETE', 'BULK_UPDATE'],
        required: true,
    },
    changes: {
        before: { type: Schema.Types.Mixed, default: {} },
        after: { type: Schema.Types.Mixed, default: {} },
    },
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
        expires: 7776000,
    },
});

auditLogSchema.index({ flagKey: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);