// Security utilities for the user dashboard
import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiting storage (in-memory for development, use Redis in production)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiter middleware
 * @param identifier - Unique identifier (e.g., IP address or user ID)
 * @param limit - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // Create new record
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { success: true, remaining: limit - 1, resetTime: now + windowMs };
  }

  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count++;
  return {
    success: true,
    remaining: limit - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .slice(0, 1000); // Limit length
}

/**
 * Validate ObjectId format
 * @param id - String to validate
 * @returns Boolean indicating if valid ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns Boolean indicating if valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Create standardized error response
 * @param message - Error message
 * @param status - HTTP status code
 * @param details - Additional error details
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: unknown
) {
  return NextResponse.json(
    {
      error: message,
      ...(process.env.NODE_ENV === 'development' && details ? { details } : {}),
    },
    { status }
  );
}

/**
 * Get client IP address from request
 * @param req - NextRequest object
 * @returns IP address string
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Validate pagination parameters
 * @param limit - Items per page
 * @param skip - Items to skip
 * @returns Validated parameters
 */
export function validatePagination(limit?: number, skip?: number) {
  const maxLimit = 100;
  const validLimit = Math.min(Math.max(1, limit || 10), maxLimit);
  const validSkip = Math.max(0, skip || 0);

  return { limit: validLimit, skip: validSkip };
}

/**
 * Secure headers for API responses
 */
export const secureHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

/**
 * Add security headers to response
 * @param response - NextResponse object
 * @returns Response with security headers
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(secureHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Clean up rate limit map periodically (memory management)
 */
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000); // Clean up every minute
}
