/**
 * Admin Avatar Upload Route
 * Secured with rate limiting, validation, and audit logging
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import dbConnect from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';
import {
  rateLimit,
  getRateLimitIdentifier,
  createRateLimitResponse,
  addSecurityHeaders,
  createProductionErrorResponse,
  addRateLimitHeaders,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Allowed file types and max size
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const response = new Response();
  addSecurityHeaders(response);

  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      logger.logAuth('Avatar upload attempted without authentication', undefined, false);
      return Response.json(
        { error: 'Authentication required' },
        { status: 401, headers: response.headers }
      );
    }

    await dbConnect();

    // 2. Verify admin role from database
    const adminUser = await User.findById(session.user.id).select('role blacklisted').lean();

    if (!adminUser || adminUser.role !== 'admin') {
      logger.logAuth('Avatar upload attempted by non-admin', session.user.id, false, {
        role: adminUser?.role,
      });
      return Response.json(
        { error: 'Admin access required' },
        { status: 403, headers: response.headers }
      );
    }

    if (adminUser.blacklisted) {
      logger.logSecurity('Blacklisted admin attempted avatar upload', {
        userId: session.user.id,
      });
      return Response.json(
        { error: 'Access denied' },
        { status: 403, headers: response.headers }
      );
    }

    // 3. Rate limiting (20 uploads per 15 minutes)
    const identifier = getRateLimitIdentifier(req, session.user.id);
    const rateLimitResult = rateLimit(identifier, 20, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.logSecurity('Admin avatar upload rate limit exceeded', {
        userId: session.user.id,
      });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    addRateLimitHeaders(response, 20, rateLimitResult.remaining, rateLimitResult.resetTime);

    // 4. Validate file presence and extract
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      logger.warn('Avatar upload attempted without file', { userId: session.user.id });
      return Response.json(
        { error: 'No file provided' },
        { status: 400, headers: response.headers }
      );
    }

    // 5. Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      logger.warn('Invalid avatar file type uploaded', {
        userId: session.user.id,
        type: file.type,
      });
      return Response.json(
        {
          error: 'Invalid file type. Allowed types: JPEG, PNG, WebP',
          allowedTypes: ALLOWED_TYPES,
        },
        { status: 400, headers: response.headers }
      );
    }

    // 6. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      logger.warn('Avatar file too large', {
        userId: session.user.id,
        size: file.size,
        maxSize: MAX_FILE_SIZE,
      });
      return Response.json(
        {
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          maxSize: MAX_FILE_SIZE,
        },
        { status: 400, headers: response.headers }
      );
    }

    // 7. Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 8. Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'orbit/admin-avatars',
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    const imageUrl = uploadResult.secure_url;

    // 9. Update user avatar
    await User.findByIdAndUpdate(
      session.user.id,
      { image: imageUrl },
      { new: true }
    );

    // 10. Audit logging
    await AuditLog.create({
      adminName: session.user.name || 'Unknown Admin',
      action: 'Update Avatar',
      subject: 'Profile',
      details: `Admin updated profile avatar (${file.size} bytes, ${file.type})`,
      userId: session.user.id,
      metadata: {
        fileSize: file.size,
        fileType: file.type,
        cloudinaryUrl: imageUrl,
      },
    });

    logger.info('Admin avatar uploaded successfully', {
      userId: session.user.id,
      fileSize: file.size,
      fileType: file.type,
    });

    return Response.json(
      {
        success: true,
        url: imageUrl,
        size: file.size,
        type: file.type,
      },
      { status: 200, headers: response.headers }
    );
  } catch (error: any) {
    logger.error('Avatar upload error', {
      error: error.message,
      stack: error.stack,
    });
    return createProductionErrorResponse(
      'Failed to upload avatar',
      error,
      response.headers
    );
  }
}
