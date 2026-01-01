import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import AuditLog from '@/models/AuditLog';
import { createErrorResponse, addSecurityHeaders, validatePagination } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== 'admin') {
      return addSecurityHeaders(createErrorResponse('Unauthorized', 401));
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const resourceType = searchParams.get('resourceType');
    const resourceId = searchParams.get('resourceId');
    const action = searchParams.get('action');
    const limitRaw = parseInt(searchParams.get('limit') || '20');
    const skipRaw = parseInt(searchParams.get('skip') || '0');

    const { limit, skip } = validatePagination(limitRaw, skipRaw);

    // Build query
    const query: Record<string, any> = {};

    if (userId) query.userId = userId;
    if (resourceType) query.resourceType = resourceType;
    if (resourceId) query.resourceId = resourceId;
    if (action) query.action = action;

    // Execute queries
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return addSecurityHeaders(
      NextResponse.json({
        logs,
        total,
        page: Math.floor(skip / limit) + 1,
        pages: Math.ceil(total / limit),
      })
    );
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return addSecurityHeaders(createErrorResponse('Failed to fetch audit logs', 500));
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== 'admin') {
      return addSecurityHeaders(createErrorResponse('Unauthorized', 401));
    }

    await dbConnect();

    const { userId, action, resourceType, resourceId, before, after, changes } = await req.json();

    const log = await AuditLog.create({
      userId: session.user.id,
      userRole: session.user.role,
      userEmail: session.user.email,
      action,
      resourceType,
      resourceId,
      details: { before, after, changes },
    });
    return addSecurityHeaders(NextResponse.json(log, { status: 201 }));
  } catch (error) {
    console.error('Error creating audit log:', error);
    return addSecurityHeaders(createErrorResponse('Failed to create audit log', 500));
  }
}
