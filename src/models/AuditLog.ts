import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
    userId: mongoose.Types.ObjectId;
    userRole: 'student' | 'owner' | 'admin';
    userEmail: string;
    action: string;
    resourceType: 'booking' | 'review' | 'property' | 'user' | 'payment' | 'property-rating';
    resourceId: mongoose.Types.ObjectId;
    resourceName?: string;
    details: {
        before?: Record<string, any>;
        after?: Record<string, any>;
        changes?: string[];
    };
    status: 'success' | 'failure';
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AuditLogSchema: Schema<IAuditLog> = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        userRole: { 
            type: String, 
            enum: ['student', 'owner', 'admin'],
            required: true,
            index: true
        },
        userEmail: { type: String, required: true, index: true },
        action: { 
            type: String, 
            required: true,
            index: true,
            enum: [
                'booking.create',
                'booking.update',
                'booking.cancel',
                'booking.pay',
                'booking.accept',
                'booking.reject',
                'booking.checkin',
                'booking.complete',
                'review.create',
                'review.update',
                'review.delete',
                'review.respond',
                'review.flag',
                'review.moderate',
                'property.create',
                'property.update',
                'property.rating.update',
                'user.login',
                'user.logout',
                'user.update',
                'user.promote',
                'admin.action'
            ]
        },
        resourceType: { 
            type: String, 
            enum: ['booking', 'review', 'property', 'user', 'payment', 'property-rating'],
            required: true,
            index: true
        },
        resourceId: { type: Schema.Types.ObjectId, required: true, index: true },
        resourceName: { type: String },
        details: {
            before: { type: mongoose.Schema.Types.Mixed },
            after: { type: mongoose.Schema.Types.Mixed },
            changes: [{ type: String }]
        },
        status: { 
            type: String, 
            enum: ['success', 'failure'],
            default: 'success',
            index: true
        },
        errorMessage: { type: String },
        ipAddress: { type: String },
        userAgent: { type: String },
    },
    { timestamps: true }
);

// Indexes for efficient querying
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userRole: 1, createdAt: -1 });

const AuditLog: Model<IAuditLog> =
    mongoose.models.AuditLog ||
    mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
