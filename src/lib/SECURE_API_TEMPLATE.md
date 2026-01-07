# Secure API Route Template

This template demonstrates how to create production-ready API routes with all security best practices applied.

## Example: Secure API Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { 
  rateLimit, 
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  createRateLimitResponse,
  validateSchema,
  schemas,
  sanitizeString,
  validateObjectId,
  getRequestMetadata,
  sanitizeErrorForLog
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import YourModel from '@/models/YourModel';

// 1. DEFINE REQUEST SCHEMA (for POST/PATCH/PUT routes)
const requestSchema = z.object({
  title: schemas.name,
  description: schemas.description,
  price: schemas.price,
  // ... other fields
});

// 2. GET HANDLER (with rate limiting, logging, error handling)
export async function GET(req: NextRequest) {
  const timer = logger.startTimer();
  const metadata = getRequestMetadata(req);
  
  try {
    // 2.1 Rate Limiting
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 100, 15 * 60 * 1000);
    
    if (!rateLimitResult.success) {
      logger.logRateLimit(metadata.ip, req.url);
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }
    
    // 2.2 Authentication (if required)
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logger.warn('Unauthorized access attempt', { metadata });
      return createErrorResponse('Unauthorized', 401);
    }
    
    logger.logRequest(req, session.user.email);
    
    // 2.3 Extract & Validate Query Parameters
    const { searchParams } = new URL(req.url);
    const id = validateObjectId(searchParams.get('id'));
    
    if (!id) {
      return createErrorResponse('Invalid ID parameter', 400);
    }
    
    // 2.4 Database Connection
    await dbConnect();
    
    // 2.5 Perform Operation (with error handling)
    const data = await YourModel.findById(id).lean();
    
    if (!data) {
      return createErrorResponse('Resource not found', 404);
    }
    
    // 2.6 Success Response
    const response = NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
    
    // 2.7 Add Security & Rate Limit Headers
    addSecurityHeaders(response);
    addRateLimitHeaders(response, 100, rateLimitResult.remaining, rateLimitResult.resetTime);
    
    // 2.8 Log Performance
    logger.logPerformance('GET /api/your-route', timer(), { id });
    logger.logResponse(req, 200);
    
    return response;
    
  } catch (error: any) {
    // 2.9 Error Handling & Logging
    logger.error('GET /api/your-route failed', sanitizeErrorForLog(error), { metadata });
    
    // Return safe error (no stack traces in production)
    return createErrorResponse(
      'An error occurred while processing your request',
      500
    );
  }
}

// 3. POST HANDLER (with schema validation)
export async function POST(req: NextRequest) {
  const timer = logger.startTimer();
  const metadata = getRequestMetadata(req);
  
  try {
    // 3.1 Rate Limiting (stricter for mutations)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 50, 15 * 60 * 1000);
    
    if (!rateLimitResult.success) {
      logger.logRateLimit(metadata.ip, req.url);
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }
    
    // 3.2 Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logger.logAuthFailure('POST', req.url, metadata.ip);
      return createErrorResponse('Unauthorized', 401);
    }
    
    logger.logRequest(req, session.user.email);
    
    // 3.3 Parse & Validate Request Body
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }
    
    const validation = validateSchema(requestSchema, body);
    if (!validation.success) {
      logger.warn('Schema validation failed', { error: validation.error, metadata });
      return createErrorResponse(validation.error, 400);
    }
    
    const validatedData = validation.data;
    
    // 3.4 Database Connection
    await dbConnect();
    
    // 3.5 Business Logic (with defensive checks)
    if (!validatedData.title || validatedData.title.length === 0) {
      return createErrorResponse('Title cannot be empty', 400);
    }
    
    // 3.6 Create Resource
    const newResource = await YourModel.create({
      ...validatedData,
      createdBy: session.user.email,
      createdAt: new Date(),
    });
    
    // 3.7 Log Success
    logger.logSecurityEvent('RESOURCE_CREATED', session.user.email, {
      resourceId: newResource._id.toString(),
      type: 'YourModel',
    });
    
    // 3.8 Success Response
    const response = NextResponse.json({
      success: true,
      data: newResource,
      message: 'Resource created successfully',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
    
    addSecurityHeaders(response);
    addRateLimitHeaders(response, 50, rateLimitResult.remaining, rateLimitResult.resetTime);
    
    logger.logPerformance('POST /api/your-route', timer());
    logger.logResponse(req, 201);
    
    return response;
    
  } catch (error: any) {
    logger.error('POST /api/your-route failed', sanitizeErrorForLog(error), { metadata });
    
    // Handle specific errors
    if (error.code === 11000) {
      return createErrorResponse('Resource already exists', 409);
    }
    
    return createErrorResponse(
      'An error occurred while creating the resource',
      500
    );
  }
}

// 4. PATCH/PUT HANDLER (update operations)
export async function PATCH(req: NextRequest) {
  const timer = logger.startTimer();
  const metadata = getRequestMetadata(req);
  
  try {
    // Similar structure to POST, with update logic
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 50, 15 * 60 * 1000);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }
    
    // Extract ID from URL
    const { searchParams } = new URL(req.url);
    const id = validateObjectId(searchParams.get('id'));
    
    if (!id) {
      return createErrorResponse('Invalid ID parameter', 400);
    }
    
    // Parse and validate body
    const body = await req.json();
    const validation = validateSchema(requestSchema.partial(), body); // partial() for updates
    
    if (!validation.success) {
      return createErrorResponse(validation.error, 400);
    }
    
    await dbConnect();
    
    // Check ownership/permissions before updating
    const existing = await YourModel.findById(id);
    if (!existing) {
      return createErrorResponse('Resource not found', 404);
    }
    
    if (existing.createdBy !== session.user.email) {
      logger.logSecurityEvent('UNAUTHORIZED_UPDATE_ATTEMPT', session.user.email, {
        resourceId: id,
        resourceOwner: existing.createdBy,
      });
      return createErrorResponse('Forbidden', 403);
    }
    
    // Perform update
    const updated = await YourModel.findByIdAndUpdate(
      id,
      { 
        ...validation.data,
        updatedAt: new Date(),
        updatedBy: session.user.email,
      },
      { new: true, runValidators: true }
    );
    
    logger.logSecurityEvent('RESOURCE_UPDATED', session.user.email, {
      resourceId: id,
    });
    
    const response = NextResponse.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString(),
    });
    
    addSecurityHeaders(response);
    logger.logPerformance('PATCH /api/your-route', timer());
    
    return response;
    
  } catch (error: any) {
    logger.error('PATCH /api/your-route failed', sanitizeErrorForLog(error), { metadata });
    return createErrorResponse('An error occurred while updating the resource', 500);
  }
}

// 5. DELETE HANDLER
export async function DELETE(req: NextRequest) {
  const timer = logger.startTimer();
  const metadata = getRequestMetadata(req);
  
  try {
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 30, 15 * 60 * 1000); // Stricter for deletes
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }
    
    const { searchParams } = new URL(req.url);
    const id = validateObjectId(searchParams.get('id'));
    
    if (!id) {
      return createErrorResponse('Invalid ID parameter', 400);
    }
    
    await dbConnect();
    
    // Check ownership before deleting
    const existing = await YourModel.findById(id);
    if (!existing) {
      return createErrorResponse('Resource not found', 404);
    }
    
    if (existing.createdBy !== session.user.email) {
      logger.logSecurityEvent('UNAUTHORIZED_DELETE_ATTEMPT', session.user.email, {
        resourceId: id,
      });
      return createErrorResponse('Forbidden', 403);
    }
    
    await YourModel.findByIdAndDelete(id);
    
    logger.logSecurityEvent('RESOURCE_DELETED', session.user.email, {
      resourceId: id,
    });
    
    const response = NextResponse.json({
      success: true,
      message: 'Resource deleted successfully',
      timestamp: new Date().toISOString(),
    });
    
    addSecurityHeaders(response);
    logger.logPerformance('DELETE /api/your-route', timer());
    
    return response;
    
  } catch (error: any) {
    logger.error('DELETE /api/your-route failed', sanitizeErrorForLog(error), { metadata });
    return createErrorResponse('An error occurred while deleting the resource', 500);
  }
}
```

## Security Checklist for Every API Route

- [ ] **Rate Limiting**: Applied with appropriate limits (100 GET, 50 POST/PATCH, 30 DELETE)
- [ ] **Authentication**: Session validated for protected routes
- [ ] **Authorization**: Ownership/permissions checked before mutations
- [ ] **Input Validation**: All inputs validated with schemas or validation functions
- [ ] **Input Sanitization**: String inputs sanitized to prevent XSS
- [ ] **Error Handling**: Try-catch blocks with safe error responses
- [ ] **Logging**: Request, response, performance, and security events logged
- [ ] **Security Headers**: Added to all responses
- [ ] **Rate Limit Headers**: Added to inform clients
- [ ] **Defensive Coding**: Null checks, type guards, boundary validations
- [ ] **Database Connection**: Proper connection handling with error recovery
- [ ] **ObjectId Validation**: MongoDB IDs validated before queries
- [ ] **No Sensitive Data Leakage**: Stack traces and internal errors hidden in production
- [ ] **Performance Monitoring**: Timers added for slow operation detection
- [ ] **Audit Logging**: Critical operations logged for compliance

## Common Patterns

### Pattern 1: Public Endpoint (No Auth Required)
```typescript
// Skip session check, but keep rate limiting stricter
const rateLimitResult = rateLimit(identifier, 20, 15 * 60 * 1000);
```

### Pattern 2: Admin-Only Endpoint
```typescript
const session = await getServerSession(authOptions);
if (!session?.user?.email) {
  return createErrorResponse('Unauthorized', 401);
}

// Check admin role
const user = await User.findOne({ email: session.user.email });
if (user?.role !== 'admin') {
  logger.logSecurityEvent('ADMIN_ACCESS_DENIED', session.user.email);
  return createErrorResponse('Forbidden', 403);
}
```

### Pattern 3: Pagination with Validation
```typescript
import { validatePagination } from '@/lib/security-enhanced';

const { searchParams } = new URL(req.url);
const { limit, skip } = validatePagination({
  limit: searchParams.get('limit'),
  page: searchParams.get('page'),
});

const results = await YourModel.find().limit(limit).skip(skip);
```

### Pattern 4: File Upload Validation
```typescript
import { sanitizeFilename } from '@/lib/security-enhanced';

const filename = sanitizeFilename(body.filename);
if (!filename) {
  return createErrorResponse('Invalid filename', 400);
}

// Check file size
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
if (body.fileSize > MAX_FILE_SIZE) {
  return createErrorResponse('File too large', 413);
}
```

## Performance Optimization Tips

1. **Use .lean()** for read-only queries (faster)
2. **Add indexes** to frequently queried fields
3. **Limit result sets** with pagination
4. **Cache expensive operations** (consider Redis)
5. **Use projections** to fetch only needed fields
6. **Batch operations** when possible
7. **Monitor slow queries** with performance logging

## Testing Checklist

- [ ] Test with missing authentication
- [ ] Test with invalid input (schema violations)
- [ ] Test with malicious input (XSS, injection attempts)
- [ ] Test rate limiting (exceed limits)
- [ ] Test with invalid ObjectIds
- [ ] Test authorization (access other users' resources)
- [ ] Load test with concurrent requests
- [ ] Test error scenarios (database down, network issues)
- [ ] Verify no sensitive data in error responses
- [ ] Check logs for proper redaction of sensitive data
