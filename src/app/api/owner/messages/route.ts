import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  sanitizeString,
  validateObjectId,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - GET operation
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 100, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', {
        ip: metadata.ip,
        url: req.url,
      });
      const response = createErrorResponse(
        'Too many requests. Please try again later.',
        429
      );
      addRateLimitHeaders(response, 100, 0, rateLimitResult.resetTime);
      return response;
    }

    // Authentication validation
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logger.warn('Unauthorized access attempt', {
        method: req.method,
        url: req.url,
        ip: metadata.ip,
      });
      return createErrorResponse('Unauthorized', 401);
    }

    logger.info('Fetch owner messages requested', {
      email: session.user.email,
      method: req.method,
      url: req.url,
    });

    await dbConnect();

    const user = await User.findOne({ email: session.user.email })
      .select('_id role')
      .lean();

    if (!user) {
      logger.warn('User not found', { email: session.user.email });
      return createErrorResponse('User not found', 404);
    }

    // Only owners and admins can access
    if (user.role !== 'owner' && user.role !== 'admin') {
      logger.warn('Forbidden access to owner messages', {
        email: session.user.email,
        role: user.role,
      });
      return createErrorResponse('Forbidden', 403);
    }

    // Parse pagination parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Get all messages where this user is the owner with pagination
    const [messages, totalCount] = await Promise.all([
      Message.find({ ownerId: user._id })
        .populate('studentId', 'name email isOnline lastSeen')
        .populate('ownerId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ ownerId: user._id }),
    ]);

    logger.info('Owner messages retrieved', {
      email: session.user.email,
      count: messages.length,
      page,
      limit,
    });

    // Log performance warning if slow
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow request', {
        route: `${req.method} ${req.url}`,
        duration,
        user: session.user.email,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        messages,
        ownerId: user._id.toString(),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          pageSize: limit,
          hasMore: skip + messages.length < totalCount,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(
      response,
      100,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );

    return response;
  } catch (error: any) {
    logger.error('Error fetching owner messages', sanitizeErrorForLog(error), {
      metadata,
      user: session?.user?.email || 'unknown',
    });

    return createErrorResponse(
      'Failed to fetch messages. Please try again later.',
      500
    );
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - POST operation (moderate for messaging)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 30, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', {
        ip: metadata.ip,
        url: req.url,
      });
      const response = createErrorResponse(
        'Too many requests. Please try again later.',
        429
      );
      addRateLimitHeaders(response, 30, 0, rateLimitResult.resetTime);
      return response;
    }

    // Authentication validation
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logger.warn('Unauthorized access attempt', {
        method: req.method,
        url: req.url,
        ip: metadata.ip,
      });
      return createErrorResponse('Unauthorized', 401);
    }

    logger.info('Send message requested', {
      email: session.user.email,
      method: req.method,
      url: req.url,
    });

    // Parse and validate JSON body
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const { studentId, message } = body;

    // Validate student ID
    if (!studentId || !validateObjectId(studentId)) {
      return createErrorResponse('Invalid student ID', 400);
    }

    // Validate message content
    if (!message || typeof message !== 'string') {
      return createErrorResponse('Message is required', 400);
    }

    // Sanitize and validate message length
    const sanitizedMessage = sanitizeString(message).trim();

    if (sanitizedMessage.length === 0) {
      return createErrorResponse('Message cannot be empty', 400);
    }

    if (sanitizedMessage.length > 2000) {
      return createErrorResponse('Message is too long (max 2000 characters)', 400);
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email })
      .select('_id role')
      .lean();

    if (!user) {
      logger.warn('User not found', { email: session.user.email });
      return createErrorResponse('User not found', 404);
    }

    // Only owners and admins can send messages
    if (user.role !== 'owner' && user.role !== 'admin') {
      logger.warn('Forbidden message send attempt', {
        email: session.user.email,
        role: user.role,
      });
      return createErrorResponse('Forbidden', 403);
    }

    // Validate recipient exists
    const recipient = await User.findById(studentId).select('_id email').lean();

    if (!recipient) {
      logger.warn('Recipient not found', {
        email: session.user.email,
        recipientId: studentId,
      });
      return createErrorResponse('Recipient not found', 404);
    }

    // Create message
    const newMessage = new Message({
      studentId,
      ownerId: user._id,
      message: sanitizedMessage,
      sender: 'owner',
      createdAt: new Date(),
    });

    await newMessage.save();

    logger.logSecurity('MESSAGE_SENT', {
      email: session.user.email,
      userId: user._id.toString(),
      recipientId: studentId,
      messageId: newMessage._id.toString(),
      messageLength: sanitizedMessage.length,
    });

    // Log performance warning if slow
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow request', {
        route: `${req.method} ${req.url}`,
        duration,
        user: session.user.email,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Message sent successfully',
        messageId: newMessage._id.toString(),
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(
      response,
      30,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );

    return response;
  } catch (error: any) {
    logger.error('Error sending message', sanitizeErrorForLog(error), {
      metadata,
      user: session?.user?.email || 'unknown',
    });

    return createErrorResponse(
      'Failed to send message. Please try again later.',
      500
    );
  }
}
