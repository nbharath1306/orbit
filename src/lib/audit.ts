import dbConnect from '@/lib/db';
import AuditLog from '@/models/AuditLog';
import { NextRequest } from 'next/server';

export interface CreateAuditLogParams {
    userId: string;
    userRole: 'student' | 'owner' | 'admin';
    userEmail: string;
    action: string;
    resourceType: 'booking' | 'review' | 'property' | 'user' | 'payment' | 'property-rating';
    resourceId: string;
    resourceName?: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
    changes?: string[];
    status?: 'success' | 'failure';
    errorMessage?: string;
    req?: NextRequest;
}

export async function createAuditLog(params: CreateAuditLogParams) {
    try {
        await dbConnect();

        const {
            userId,
            userRole,
            userEmail,
            action,
            resourceType,
            resourceId,
            resourceName,
            before,
            after,
            changes,
            status = 'success',
            errorMessage,
            req,
        } = params;

        // Extract IP and user agent from request
        let ipAddress = '';
        let userAgent = '';

        if (req) {
            ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
            userAgent = req.headers.get('user-agent') || 'unknown';
        }

        const auditLog = await AuditLog.create({
            userId,
            userRole,
            userEmail,
            action,
            resourceType,
            resourceId,
            resourceName,
            details: {
                before,
                after,
                changes: changes || [],
            },
            status,
            errorMessage,
            ipAddress,
            userAgent,
        });

        return auditLog;
    } catch (error) {
        console.error('Error creating audit log:', error);
        // Don't throw - audit logging shouldn't break the main operation
        return null;
    }
}

export async function getAuditLogs(filter: {
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    action?: string;
    userRole?: string;
    limit?: number;
    skip?: number;
}) {
    try {
        await dbConnect();

        const query: Record<string, any> = {};

        if (filter.userId) query.userId = filter.userId;
        if (filter.resourceType) query.resourceType = filter.resourceType;
        if (filter.resourceId) query.resourceId = filter.resourceId;
        if (filter.action) query.action = filter.action;
        if (filter.userRole) query.userRole = filter.userRole;

        const limit = filter.limit || 20;
        const skip = filter.skip || 0;

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .populate('userId', 'name email')
                .populate('resourceId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(query),
        ]);

        return {
            logs,
            total,
            page: Math.floor(skip / limit) + 1,
            pages: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return {
            logs: [],
            total: 0,
            page: 1,
            pages: 0,
        };
    }
}
