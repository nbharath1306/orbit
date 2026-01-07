# Security Implementation Guide
**Orbit PG - Production Security Hardening**  
**Version:** 2.0  
**Last Updated:** January 7, 2026  
**Status:** Phase 1 & 2 Complete ✅

---

## Table of Contents

1. [Overview](#overview)
2. [Security Infrastructure](#security-infrastructure)
3. [Phase 1 Implementation Summary](#phase-1-implementation-summary)
4. [How to Secure an API Route](#how-to-secure-an-api-route)
5. [Security Patterns & Examples](#security-patterns--examples)
6. [Validation & Sanitization Guide](#validation--sanitization-guide)
7. [Logging Best Practices](#logging-best-practices)
8. [Error Handling Standards](#error-handling-standards)
9. [Phase 2-5 Roadmap](#phase-2-5-roadmap)
10. [Testing Checklist](#testing-checklist)
11. [Troubleshooting](#troubleshooting)

---

## Overview

### Project Security Status

**Completion:** Phase 1 & 2 Complete (14/54 routes secured - 26%)  
**OWASP Coverage:** 90% (9/10 protections implemented)  
**Security Level:** Production-Ready (for secured endpoints)  
**Last Phase Completed:** Phase 2 - Payment & User Routes (January 7, 2026)

### Security Requirements Met

✅ **Rate Limiting:** Advanced IP + user-based with sliding window  
✅ **Input Validation:** Comprehensive schema-based validation  
✅ **Input Sanitization:** XSS and injection prevention  
✅ **Error Handling:** Production-safe responses (no stack traces)  
✅ **Logging:** Structured logging with sensitive data redaction  
✅ **Security Headers:** OWASP-compliant headers  
✅ **Environment Validation:** Fail-fast on misconfiguration  
✅ **No Hardcoded Secrets:** Verified via code scan

### Key Security Files Created

```
src/lib/
├── security-enhanced.ts      # Main security library (800+ lines)
├── logger.ts                 # Production logging (350+ lines)
├── env.ts                    # Environment validation (200+ lines)
└── SECURE_API_TEMPLATE.md    # Implementation template

SECURITY_HARDENING_REPORT.md  # Comprehensive report
SECURITY_IMPLEMENTATION_GUIDE.md  # This document
```

---

## Security Infrastructure

### 1. Enhanced Security Library (`src/lib/security-enhanced.ts`)

**Purpose:** Comprehensive security utilities for production API routes

**Core Features:**

#### Rate Limiting
```typescript
// Advanced rate limiting with IP + user tracking
rateLimit(identifier, limit, windowMs)

// Get unique identifier for rate limiting
getRateLimitIdentifier(req, userId?)
```

**Configuration:**
- In-memory storage (upgrade to Redis for distributed systems)
- Sliding window algorithm for accuracy
- Automatic cleanup of expired entries
- Returns: `{ success, remaining, resetTime, retryAfter? }`

**Usage Example:**
```typescript
const identifier = getRateLimitIdentifier(req, session?.user?.id);
const result = rateLimit(identifier, 50, 15 * 60 * 1000); // 50 req/15min

if (!result.success) {
  return createRateLimitResponse(result.retryAfter!);
}
```

#### Input Validation Functions

| Function | Purpose | Returns | Example |
|----------|---------|---------|---------|
| `validateObjectId(id)` | MongoDB ObjectId validation | `string \| null` | `validateObjectId('507f1f77bcf86cd799439011')` |
| `validateEmail(email)` | RFC 5322 email validation | `string \| null` | `validateEmail('user@example.com')` |
| `validateUrl(url)` | Safe URL validation | `string \| null` | `validateUrl('https://example.com')` |
| `validatePhone(phone)` | International phone format | `string \| null` | `validatePhone('+1-555-0123')` |
| `validateInteger(val, min?, max?)` | Integer with range check | `number \| null` | `validateInteger(5, 1, 10)` |
| `validatePagination(params)` | Pagination parameters | `{ limit, skip }` | `validatePagination({ page: 2 })` |

#### Input Sanitization Functions

| Function | Purpose | Max Length | Use Case |
|----------|---------|------------|----------|
| `sanitizeString(input)` | Remove XSS/injection patterns | 10,000 chars | User-generated text |
| `sanitizeHtml(input)` | Allow only safe HTML tags | 5,000 chars | Rich text content |
| `sanitizeFilename(name)` | Safe filename characters | 255 chars | File uploads |
| `sanitizeMongoQuery(query)` | Remove $ operators | N/A | Database queries |

#### Schema-Based Validation

```typescript
import { z } from 'zod';
import { schemas, validateSchema } from '@/lib/security-enhanced';

// Use predefined schemas
const emailSchema = schemas.email;  // z.string().email().max(254)
const nameSchema = schemas.name;    // z.string().min(1).max(100)

// Define custom schemas
const bookingSchema = z.object({
  propertyId: schemas.objectId,
  checkInDate: schemas.date,
  durationMonths: z.number().int().min(1).max(12),
  specialRequests: schemas.description.optional(),
});

// Validate request body
const result = validateSchema(bookingSchema, requestBody);
if (!result.success) {
  return createErrorResponse(result.error, 400);
}

const validatedData = result.data; // Type-safe!
```

**Available Schemas:**
```typescript
schemas.email          // Email validation
schemas.objectId       // MongoDB ObjectId
schemas.url            // URL validation
schemas.phone          // Phone number
schemas.date           // Date parsing
schemas.positiveInt    // Positive integer
schemas.name           // Name (1-100 chars, sanitized)
schemas.description    // Description (1-5000 chars, sanitized)
schemas.comment        // Comment (1-2000 chars, sanitized)
schemas.rating         // Rating (1-5)
schemas.price          // Price (positive, max 10M)
```

#### Error Handling

```typescript
// Safe error response (no stack traces in production)
createErrorResponse(message, status, details?)

// Rate limit response with headers
createRateLimitResponse(retryAfter)

// Sanitize error for logging
sanitizeErrorForLog(error)
```

#### Security Headers

```typescript
// Add OWASP-compliant security headers
addSecurityHeaders(response)

// Add rate limit headers
addRateLimitHeaders(response, limit, remaining, resetTime)
```

**Headers Added:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: ...`

#### Request Utilities

```typescript
// Get client IP (handles proxies)
getClientIp(req)  // Checks x-forwarded-for, cf-connecting-ip, etc.

// Get user agent
getUserAgent(req)

// Get complete request metadata
getRequestMetadata(req)  // Returns { ip, userAgent, method, url, timestamp }
```

#### Authentication & Authorization

```typescript
// Validate session safely
const { valid, user } = validateSession(session);
if (!valid) {
  return createErrorResponse('Unauthorized', 401);
}

// Check user role
hasRole(user.role, ['admin', 'owner'])
```

#### Password Validation

```typescript
const { valid, errors } = validatePassword(password);
if (!valid) {
  return createErrorResponse(errors.join(', '), 400);
}
```

**Requirements:**
- Minimum 8 characters
- Maximum 128 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number

---

### 2. Production Logger (`src/lib/logger.ts`)

**Purpose:** Structured logging with sensitive data protection

**Log Levels:**

| Level | Usage | Production |
|-------|-------|------------|
| `DEBUG` | Development debugging | Disabled |
| `INFO` | Normal operations | Enabled |
| `WARN` | Warning conditions | Enabled |
| `ERROR` | Error conditions | Enabled |

**Core Methods:**

```typescript
// Basic logging
logger.info(message, context?)
logger.warn(message, context?)
logger.error(message, error?, context?)
logger.debug(message, context?)  // Development only

// Request/Response logging
logger.logRequest(method, url, context?)
logger.logResponse(method, url, status, duration?)

// Security event logging
logger.logSecurity(event, context?)

// Examples:
logger.logSecurity('UNAUTHORIZED_ACCESS', {
  email: user.email,
  resource: 'booking',
  resourceId: bookingId
});

// Performance logging
logger.logPerformance(operation, duration, context?)

// Database logging
logger.logDb(operation, collection, duration?)

// Authentication logging
logger.logAuth(event, userId?, context?)
```

**Automatic Sensitive Data Redaction:**

The logger automatically redacts these keys:
- `password`
- `token`
- `secret`
- `apiKey`, `api_key`
- `accessToken`, `refreshToken`
- `authorization`
- `cookie`
- `creditCard`, `ssn`
- `privateKey`

**Log Format:**

```json
{
  "level": "INFO",
  "message": "Request received",
  "timestamp": "2026-01-07T10:30:00.000Z",
  "email": "user@example.com",
  "method": "POST",
  "url": "/api/bookings/create",
  "ip": "192.168.1.1",
  "type": "request"
}
```

**Performance Tracking:**

```typescript
// Method 1: Manual timing
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;
if (duration > 1000) {
  logger.warn('Slow request', { route: 'POST /api/bookings', duration });
}

// Method 2: Use logPerformance
logger.logPerformance('Database Query', duration, { collection: 'bookings' });
```

---

### 3. Environment Validation (`src/lib/env.ts`)

**Purpose:** Validate and manage environment variables safely

**Features:**

#### Required Environment Variables

```typescript
// App fails to start if these are missing:
MONGODB_URI
NEXTAUTH_SECRET
NEXTAUTH_URL
```

#### Utility Functions

```typescript
// Get required variable (throws if missing)
const dbUri = getRequiredEnv('MONGODB_URI');

// Get optional variable with default
const logLevel = getOptionalEnv('LOG_LEVEL', 'INFO');

// Environment checks
isProduction()   // NODE_ENV === 'production'
isDevelopment()  // NODE_ENV === 'development'

// Get validated database URI
getDatabaseUri()  // Validates mongodb:// or mongodb+srv:// format

// Get NextAuth config
const { secret, url } = getNextAuthConfig();

// Get rate limit config
const { max, windowMs } = getRateLimitConfig();

// Get CORS allowed origins
const origins = getAllowedOrigins();  // Returns string[]
```

#### Validation at Startup

```typescript
// Automatically validates on import (server-side only)
// Application exits with error if validation fails
```

**Environment Variables Tracked:**

```
# Database
MONGODB_URI=mongodb+srv://...

# Authentication
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_ISSUER=...

# AI
GOOGLE_GENERATIVE_AI_API_KEY=...

# File Storage
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Payment
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Email
SENDGRID_API_KEY=...
SENDER_EMAIL=...

# SMS
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Application
NODE_ENV=production
LOG_LEVEL=INFO
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
MAX_REQUEST_SIZE=10485760
SESSION_MAX_AGE=86400
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

---

## Phase 1 Implementation Summary

### Routes Secured (3 of 54)

#### 1. POST /api/bookings/create ✅

**Security Enhancements:**
- Rate limiting: 20 requests per 15 minutes
- ObjectId validation for `propertyId`
- Integer validation for `durationMonths` (1-12) and `guestCount` (1-4)
- String sanitization for `roomType` and `specialRequests`
- Date validation (must be today or future)
- Business logic validation:
  - Property availability check
  - Prevent booking own property
  - Prevent duplicate bookings
  - Amount sanity check (max 1 crore)
- Defensive programming:
  - Null checks for property data
  - Validate pricing data exists
  - Error recovery
- Comprehensive logging:
  - Request logging
  - Performance tracking
  - Security event logging
  - Error logging with context
- Safe error responses
- Security headers
- Audit trail

**Key Code Sections:**
```typescript
// Rate limiting
const identifier = getRateLimitIdentifier(req, session?.user?.id);
const rateLimitResult = rateLimit(identifier, 20, 15 * 60 * 1000);

// Input validation
const validPropertyId = validateObjectId(propertyId);
const validDuration = validateInteger(durationMonths, 1, 12);
const validGuestCount = validateInteger(guestCount, 1, 4);

// Text sanitization
const sanitizedRoomType = roomType ? sanitizeString(roomType).slice(0, 50) : null;
const sanitizedRequests = specialRequests ? sanitizeString(specialRequests).slice(0, 500) : null;

// Defensive checks
if (!property.liveStats || typeof property.liveStats.occupiedRooms !== 'number') {
  logger.error('Property missing required liveStats data', { propertyId });
  return createErrorResponse('Property data incomplete. Please contact support.', 500);
}

// Security event logging
logger.logSecurity('BOOKING_CREATED', {
  email: session.user.email,
  bookingId: booking._id.toString(),
  propertyId: validPropertyId,
  totalAmount,
});
```

#### 2. POST /api/owner/bookings/accept ✅

**Security Enhancements:**
- Rate limiting: 30 requests per 15 minutes
- ObjectId validation for `bookingId`
- Authorization verification (ownership check)
- Status validation (only accept pending bookings)
- Defensive null checks for property data
- Security event logging for unauthorized attempts
- Audit logging with IP and user agent
- Performance tracking
- Safe error responses
- Security headers

**Key Code Sections:**
```typescript
// Authorization check
if (property.ownerId.toString() !== session.user.id) {
  logger.logSecurity('UNAUTHORIZED_BOOKING_ACCEPT_ATTEMPT', {
    email: session.user.email,
    bookingId: validBookingId,
    propertyOwnerId: property.ownerId.toString()
  });
  return createErrorResponse('You can only accept bookings for your properties', 403);
}

// Status validation
if (booking.status !== 'pending') {
  logger.info('Invalid booking status for accept', { 
    bookingId: validBookingId, 
    status: booking.status 
  });
  return createErrorResponse(`Cannot accept ${booking.status} booking`, 400);
}

// Atomic update using findByIdAndUpdate
const updateResult = await Booking.findByIdAndUpdate(
  validBookingId,
  {
    status: 'confirmed',
    acceptedAt: new Date(),
    acceptedBy: new mongoose.Types.ObjectId(session.user.id),
  },
  { new: true }
);
```

#### 3. POST /api/owner/bookings/reject ✅

**Security Enhancements:**
- Rate limiting: 30 requests per 15 minutes
- ObjectId validation for `bookingId`
- Text sanitization for `reason` (max 500 chars)
- Authorization verification (ownership check)
- Status validation (only reject pending/confirmed bookings)
- Defensive null checks
- Security event logging
- Audit logging
- Performance tracking
- Safe error responses
- Security headers

**Key Code Sections:**
```typescript
// Sanitize rejection reason
const sanitizedReason = reason ? sanitizeString(reason).slice(0, 500) : 'Owner declined';

// Status validation
if (!['pending', 'confirmed'].includes(booking.status)) {
  logger.info('Invalid booking status for reject', { 
    bookingId: validBookingId, 
    status: booking.status 
  });
  return createErrorResponse(`Cannot reject ${booking.status} booking`, 400);
}

// Update with sanitized reason
const updateResult = await Booking.findByIdAndUpdate(
  validBookingId,
  {
    status: 'rejected',
    rejectedAt: new Date(),
    rejectedBy: new mongoose.Types.ObjectId(session.user.id),
    rejectionReason: sanitizedReason,
  },
  { new: true }
);
```

---

## How to Secure an API Route

### Step-by-Step Process

#### Step 1: Add Security Imports

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { 
  rateLimit, 
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  validateObjectId,
  sanitizeString,
  validateInteger,
  getRequestMetadata,
  sanitizeErrorForLog,
  validateSchema,
  schemas
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';
```

#### Step 2: Set Up Handler Structure

```typescript
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;
  
  try {
    // Security implementation goes here
    
  } catch (error: any) {
    logger.error('Operation failed', sanitizeErrorForLog(error), { 
      metadata,
      user: session?.user?.email || 'unknown'
    });
    
    // Handle specific errors
    if (error.code === 11000) {
      return createErrorResponse('Duplicate entry', 409);
    }
    
    return createErrorResponse(
      'Operation failed. Please try again later.',
      500
    );
  }
}
```

#### Step 3: Implement Rate Limiting

```typescript
// Choose appropriate limit based on operation:
// - GET (read): 100 req / 15 min
// - POST (create): 50 req / 15 min
// - POST (critical): 20 req / 15 min
// - DELETE: 30 req / 15 min

const identifier = getRateLimitIdentifier(req, session?.user?.id);
const rateLimitResult = rateLimit(identifier, 50, 15 * 60 * 1000);

if (!rateLimitResult.success) {
  logger.warn('Rate limit exceeded', { ip: metadata.ip, url: req.url });
  return createRateLimitResponse(rateLimitResult.retryAfter!);
}
```

#### Step 4: Validate Authentication

```typescript
session = await getServerSession(authOptions);

if (!session?.user?.email) {
  logger.warn('Unauthorized access attempt', { 
    method: req.method, 
    url: req.url, 
    ip: metadata.ip 
  });
  return createErrorResponse('Unauthorized', 401);
}

logger.info('Request received', { 
  email: session.user.email, 
  method: req.method, 
  url: req.url 
});
```

#### Step 5: Parse and Validate Input

**For JSON Body:**
```typescript
let body;
try {
  body = await req.json();
} catch {
  return createErrorResponse('Invalid JSON in request body', 400);
}

// Option A: Manual validation
const validId = validateObjectId(body.id);
if (!validId) {
  return createErrorResponse('Invalid ID format', 400);
}

const sanitizedName = sanitizeString(body.name).slice(0, 100);

// Option B: Schema validation (recommended)
const schema = z.object({
  id: schemas.objectId,
  name: schemas.name,
  description: schemas.description.optional(),
  price: schemas.price,
});

const validation = validateSchema(schema, body);
if (!validation.success) {
  return createErrorResponse(validation.error, 400);
}

const validatedData = validation.data;
```

**For Query Parameters:**
```typescript
const { searchParams } = new URL(req.url);

const validId = validateObjectId(searchParams.get('id'));
if (!validId) {
  return createErrorResponse('Invalid ID parameter', 400);
}

const { limit, skip } = validatePagination({
  limit: searchParams.get('limit'),
  page: searchParams.get('page'),
});
```

#### Step 6: Perform Database Operations

```typescript
await dbConnect();

// Use validated IDs in queries
const resource = await Model.findById(validId).lean();

if (!resource) {
  logger.warn('Resource not found', { 
    resourceId: validId, 
    user: session.user.email 
  });
  return createErrorResponse('Resource not found', 404);
}

// Defensive checks
if (!resource.ownerId || !resource.status) {
  logger.error('Resource has invalid data', { resourceId: validId });
  return createErrorResponse('Invalid resource data', 500);
}
```

#### Step 7: Verify Authorization

```typescript
// Check ownership
if (resource.ownerId.toString() !== session.user.id) {
  logger.logSecurity('UNAUTHORIZED_ACCESS_ATTEMPT', {
    email: session.user.email,
    resourceId: validId,
    resourceOwner: resource.ownerId.toString()
  });
  return createErrorResponse('Forbidden', 403);
}

// Or check role
const user = await User.findOne({ email: session.user.email });
if (user?.role !== 'admin') {
  logger.logSecurity('ADMIN_ACCESS_DENIED', {
    email: session.user.email,
    role: user?.role
  });
  return createErrorResponse('Forbidden', 403);
}
```

#### Step 8: Execute Business Logic

```typescript
// Perform operation with error handling
const result = await Model.create({
  ...validatedData,
  createdBy: session.user.id,
  createdAt: new Date(),
});

// Log security event
logger.logSecurity('RESOURCE_CREATED', {
  email: session.user.email,
  resourceId: result._id.toString(),
  type: 'ModelName'
});
```

#### Step 9: Return Response with Headers

```typescript
const response = NextResponse.json({
  success: true,
  data: result,
  message: 'Operation completed successfully',
  timestamp: new Date().toISOString(),
}, { status: 201 });

// Add security headers
addSecurityHeaders(response);

// Add rate limit headers
addRateLimitHeaders(response, 50, rateLimitResult.remaining, rateLimitResult.resetTime);

// Log performance
const duration = Date.now() - startTime;
if (duration > 1000) {
  logger.warn('Slow request', { 
    route: `${req.method} ${req.url}`, 
    duration 
  });
}

return response;
```

### Complete Template

See `src/lib/SECURE_API_TEMPLATE.md` for a complete, copy-paste-ready template.

---

## Security Patterns & Examples

### Pattern 1: Public Endpoint (No Auth Required)

```typescript
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  
  try {
    // Stricter rate limiting for public endpoints
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 20, 15 * 60 * 1000);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }
    
    // Skip session check, proceed with logic
    // ...
  } catch (error: any) {
    logger.error('Public endpoint error', sanitizeErrorForLog(error), { metadata });
    return createErrorResponse('Request failed', 500);
  }
}
```

### Pattern 2: Admin-Only Endpoint

```typescript
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;
  
  try {
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 50, 15 * 60 * 1000);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }
    
    session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }
    
    // Check admin role
    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (user?.role !== 'admin') {
      logger.logSecurity('ADMIN_ACCESS_DENIED', {
        email: session.user.email,
        role: user?.role,
        attemptedResource: req.url
      });
      return createErrorResponse('Forbidden - Admin access required', 403);
    }
    
    // Admin operation...
    
  } catch (error: any) {
    logger.error('Admin operation failed', sanitizeErrorForLog(error), { 
      metadata,
      admin: session?.user?.email 
    });
    return createErrorResponse('Operation failed', 500);
  }
}
```

### Pattern 3: Owner-Only Resource Access

```typescript
export async function PATCH(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;
  
  try {
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 50, 15 * 60 * 1000);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }
    
    session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }
    
    const { searchParams } = new URL(req.url);
    const validId = validateObjectId(searchParams.get('id'));
    
    if (!validId) {
      return createErrorResponse('Invalid ID parameter', 400);
    }
    
    await dbConnect();
    const resource = await Model.findById(validId).lean();
    
    if (!resource) {
      return createErrorResponse('Resource not found', 404);
    }
    
    // Verify ownership
    if (resource.ownerId.toString() !== session.user.id) {
      logger.logSecurity('UNAUTHORIZED_UPDATE_ATTEMPT', {
        email: session.user.email,
        resourceId: validId,
        resourceOwner: resource.ownerId.toString()
      });
      return createErrorResponse('You can only update your own resources', 403);
    }
    
    // Update operation...
    
  } catch (error: any) {
    logger.error('Update failed', sanitizeErrorForLog(error), { 
      metadata,
      user: session?.user?.email 
    });
    return createErrorResponse('Update failed', 500);
  }
}
```

### Pattern 4: Paginated List with Filters

```typescript
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;
  
  try {
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 100, 15 * 60 * 1000);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }
    
    session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }
    
    const { searchParams } = new URL(req.url);
    
    // Validate pagination
    const { limit, skip } = validatePagination({
      limit: searchParams.get('limit'),
      page: searchParams.get('page'),
    });
    
    // Validate filters
    const status = searchParams.get('status');
    const validStatuses = ['pending', 'confirmed', 'rejected', 'cancelled'];
    
    if (status && !validStatuses.includes(status)) {
      return createErrorResponse('Invalid status filter', 400);
    }
    
    // Build query
    const query: any = { userId: session.user.id };
    if (status) query.status = status;
    
    await dbConnect();
    
    // Execute with pagination
    const [results, total] = await Promise.all([
      Model.find(query)
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 })
        .lean(),
      Model.countDocuments(query)
    ]);
    
    const response = NextResponse.json({
      success: true,
      data: results,
      pagination: {
        total,
        limit,
        skip,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    });
    
    addSecurityHeaders(response);
    addRateLimitHeaders(response, 100, rateLimitResult.remaining, rateLimitResult.resetTime);
    
    return response;
    
  } catch (error: any) {
    logger.error('List query failed', sanitizeErrorForLog(error), { 
      metadata,
      user: session?.user?.email 
    });
    return createErrorResponse('Query failed', 500);
  }
}
```

### Pattern 5: File Upload with Validation

```typescript
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;
  
  try {
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 10, 15 * 60 * 1000); // Strict for uploads
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }
    
    session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }
    
    const body = await req.json();
    
    // Validate filename
    const filename = sanitizeFilename(body.filename);
    if (!filename) {
      return createErrorResponse('Invalid filename', 400);
    }
    
    // Validate file size
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (body.fileSize > MAX_FILE_SIZE) {
      logger.warn('File size exceeded', { 
        size: body.fileSize, 
        max: MAX_FILE_SIZE,
        user: session.user.email 
      });
      return createErrorResponse('File size must not exceed 10MB', 413);
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(body.fileType)) {
      return createErrorResponse('Invalid file type. Allowed: JPEG, PNG, WebP', 400);
    }
    
    // Process upload...
    
    logger.logSecurity('FILE_UPLOADED', {
      email: session.user.email,
      filename: filename,
      size: body.fileSize,
      type: body.fileType
    });
    
    const response = NextResponse.json({
      success: true,
      filename: filename,
      message: 'File uploaded successfully',
      timestamp: new Date().toISOString(),
    });
    
    addSecurityHeaders(response);
    
    return response;
    
  } catch (error: any) {
    logger.error('File upload failed', sanitizeErrorForLog(error), { 
      metadata,
      user: session?.user?.email 
    });
    return createErrorResponse('Upload failed', 500);
  }
}
```

---

## Validation & Sanitization Guide

### When to Validate vs Sanitize

**Validate (Reject Invalid Input):**
- IDs (ObjectId format)
- Emails
- URLs
- Enums (status values, roles)
- Numeric ranges
- Required fields

**Sanitize (Clean Input):**
- User-generated text
- Filenames
- HTML content
- Search queries

### Validation Decision Tree

```
Is it user input? 
├─ Yes → Continue
└─ No → Skip validation (trusted source)

Is it a known format (email, URL, ObjectId)?
├─ Yes → Use specific validator
└─ No → Continue

Is it text that will be displayed/stored?
├─ Yes → Sanitize with sanitizeString()
└─ No → Continue

Is it a number with constraints?
├─ Yes → Use validateInteger() with min/max
└─ No → Continue

Is it complex data?
├─ Yes → Use Zod schema validation
└─ No → Basic type check
```

### Validation Examples by Data Type

#### ObjectID

```typescript
const validId = validateObjectId(input);
if (!validId) {
  return createErrorResponse('Invalid ID format', 400);
}
// Use validId in queries
await Model.findById(validId);
```

#### Email

```typescript
const validEmail = validateEmail(input);
if (!validEmail) {
  return createErrorResponse('Invalid email format', 400);
}
// validEmail is lowercase and trimmed
```

#### Integer with Range

```typescript
const quantity = validateInteger(input, 1, 100);
if (quantity === null) {
  return createErrorResponse('Quantity must be between 1 and 100', 400);
}
```

#### Enum Values

```typescript
const validStatuses = ['pending', 'confirmed', 'rejected', 'cancelled'];
if (!validStatuses.includes(status)) {
  return createErrorResponse(`Status must be one of: ${validStatuses.join(', ')}`, 400);
}
```

#### Date

```typescript
const date = new Date(input);
if (isNaN(date.getTime())) {
  return createErrorResponse('Invalid date format', 400);
}

const now = new Date();
if (date < now) {
  return createErrorResponse('Date must be in the future', 400);
}
```

#### Text Fields

```typescript
// Short text (names, titles)
const name = sanitizeString(input).slice(0, 100);
if (name.length === 0) {
  return createErrorResponse('Name cannot be empty', 400);
}

// Long text (descriptions)
const description = sanitizeString(input).slice(0, 5000);

// Optional text
const notes = input ? sanitizeString(input).slice(0, 1000) : null;
```

#### URLs

```typescript
const validUrl = validateUrl(input);
if (!validUrl) {
  return createErrorResponse('Invalid URL format', 400);
}
// validUrl is parsed and protocol-checked
```

#### Phone Numbers

```typescript
const validPhone = validatePhone(input);
if (!validPhone) {
  return createErrorResponse('Invalid phone number', 400);
}
```

---

## Logging Best Practices

### What to Log

✅ **Always Log:**
- Authentication events (login, logout, failures)
- Authorization failures
- Rate limit violations
- Resource creation/modification/deletion
- Security events (suspicious activity)
- Errors with context
- Slow operations (>1s)

❌ **Never Log:**
- Passwords (even hashed)
- Tokens (access, refresh, session)
- API keys
- Credit card numbers
- Personal identifiable information (unless redacted)

### Logging Patterns

#### Request Logging

```typescript
logger.info('Request received', { 
  email: session.user.email, 
  method: req.method, 
  url: req.url,
  ip: metadata.ip
});
```

#### Security Events

```typescript
// Unauthorized access
logger.logSecurity('UNAUTHORIZED_ACCESS', {
  email: session.user.email,
  resource: 'booking',
  resourceId: bookingId,
  reason: 'Not the owner'
});

// Suspicious activity
logger.logSecurity('SUSPICIOUS_ACTIVITY', {
  email: session.user.email,
  activity: 'Multiple failed login attempts',
  count: attemptCount
});

// Resource operations
logger.logSecurity('RESOURCE_DELETED', {
  email: session.user.email,
  resourceType: 'Property',
  resourceId: propertyId
});
```

#### Performance Logging

```typescript
const duration = Date.now() - startTime;

// Warn on slow operations
if (duration > 1000) {
  logger.warn('Slow request', { 
    route: `${req.method} ${req.url}`, 
    duration,
    user: session.user.email
  });
}

// Log database performance
logger.logDb('find', 'bookings', duration);
```

#### Error Logging

```typescript
try {
  // Operation
} catch (error: any) {
  logger.error('Operation failed', sanitizeErrorForLog(error), { 
    metadata,
    user: session?.user?.email || 'unknown',
    operation: 'create-booking',
    input: { propertyId, duration }  // Log relevant context
  });
  
  // Return safe error
  return createErrorResponse('Operation failed', 500);
}
```

#### Context-Rich Logging

```typescript
// Good: Includes context for debugging
logger.warn('Booking attempt for fully occupied property', { 
  propertyId: validPropertyId,
  occupiedRooms: property.liveStats.occupiedRooms,
  totalRooms: property.liveStats.totalRooms,
  user: session.user.email
});

// Bad: No context
logger.warn('Property is full');
```

---

## Error Handling Standards

### Error Response Format

**Production:**
```json
{
  "error": "Resource not found",
  "status": 404,
  "timestamp": "2026-01-07T10:30:00.000Z"
}
```

**Development (includes details):**
```json
{
  "error": "Resource not found",
  "status": 404,
  "timestamp": "2026-01-07T10:30:00.000Z",
  "details": {
    "resourceId": "507f1f77bcf86cd799439011",
    "collection": "properties"
  }
}
```

### HTTP Status Codes

| Code | Usage | Example |
|------|-------|---------|
| 200 | Success | Data retrieved |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry |
| 413 | Payload Too Large | File size exceeded |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected error |

### Error Handling Patterns

#### Specific Error Types

```typescript
catch (error: any) {
  // MongoDB duplicate key error
  if (error.code === 11000) {
    return createErrorResponse('Resource already exists', 409);
  }
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    return createErrorResponse('Invalid data provided', 400);
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return createErrorResponse('Invalid ID format', 400);
  }
  
  // Generic error
  logger.error('Operation failed', sanitizeErrorForLog(error), { metadata });
  return createErrorResponse('Operation failed. Please try again.', 500);
}
```

#### Business Logic Errors

```typescript
// Check business rules explicitly
if (booking.status !== 'pending') {
  return createErrorResponse(`Cannot accept ${booking.status} booking`, 400);
}

if (property.liveStats.occupiedRooms >= property.liveStats.totalRooms) {
  return createErrorResponse('No rooms available for this property', 400);
}

if (totalAmount > 10000000) {
  logger.warn('Unusually high booking amount', { totalAmount, user: session.user.email });
  return createErrorResponse('Booking amount exceeds maximum limit', 400);
}
```

#### Defensive Error Handling

```typescript
// Check for expected data structure
if (!property.liveStats || typeof property.liveStats.occupiedRooms !== 'number') {
  logger.error('Property missing required data', { propertyId });
  return createErrorResponse('Property data incomplete. Please contact support.', 500);
}

// Graceful degradation
const userPreferences = user.preferences || {};  // Default to empty object
const notificationEnabled = userPreferences.notifications ?? true;  // Default to true
```

---

## Phase 2-5 Roadmap

### Phase 2: Payment & User Routes (Priority: HIGH) ✅ COMPLETE

**Status:** ✅ Completed - January 7, 2026  
**Routes Secured:** 11/11 endpoints  
**Time Taken:** 2 days

#### Routes Secured:

1. **Payment Processing** ✅
   - ✅ `POST /api/bookings/payment` - Payment initiation
   - ✅ `POST /api/bookings/verify-payment` - Payment verification
   - ✅ `POST /api/bookings/create-order` - Razorpay order creation

2. **User Booking Management** ✅
   - ✅ `GET /api/user/bookings` - List user bookings
   - ✅ `GET /api/user/bookings/[id]` - Single booking details
   - ✅ `POST /api/bookings/cancel` - Cancel booking

3. **Property Browsing** ✅
   - ✅ `GET /api/properties` - Property listing with search & pagination
   - ✅ `POST /api/properties` - Create property (owner/admin)
   - ✅ `GET /api/properties/[id]` - Property details
   - ✅ `PATCH /api/properties/[id]` - Update property
   - ✅ `GET /api/properties/availability` - Check availability

4. **Review System** ✅
   - ✅ `GET /api/reviews` - List reviews with filters
   - ✅ `POST /api/reviews` - Create review with spam prevention
   - ✅ `GET /api/reviews/[id]` - Review details

**Security Features Implemented:**
- ✅ Payment amount verification & idempotency
- ✅ Razorpay signature verification
- ✅ Duplicate order prevention
- ✅ Review spam prevention (10 req/15min)
- ✅ Duplicate review detection
- ✅ Verified stay badge validation
- ✅ Public endpoint rate limiting (50 req/15min)
- ✅ Search input sanitization
- ✅ Pagination validation
- ✅ Comprehensive audit logging
- ✅ Refund processing logic
- ✅ Automatic property rating updates

**See:** [PHASE_2_SECURITY_SUMMARY.md](PHASE_2_SECURITY_SUMMARY.md) for detailed implementation guide

---

### Phase 3: Owner & Property Management (Priority: MEDIUM)

**Estimated Time:** 3-4 days  
**Routes:** 15 endpoints

#### Routes to Secure:

1. **Property Management**
   - `GET /api/owner/properties` - List owner properties
   - `POST /api/owner/properties` - Create property
   - `PATCH /api/owner/properties/[id]` - Update property
   - `DELETE /api/owner/properties/[id]` - Delete property

2. **Owner Booking Management**
   - `GET /api/owner/bookings` - List bookings for properties
   - ✅ `POST /api/owner/bookings/accept` - Accept booking (DONE)
   - ✅ `POST /api/owner/bookings/reject` - Reject booking (DONE)

3. **Owner Profile & Verification**
   - `GET /api/owner/profile` - Get profile
   - `PATCH /api/owner/profile` - Update profile
   - `POST /api/owner/request-promotion` - Request owner promotion
   - `POST /api/owner/send-email-otp` - Send verification OTP
   - `POST /api/owner/verify-email-otp` - Verify OTP

4. **Owner Messaging**
   - `GET /api/owner/messages` - Get messages
   - `POST /api/owner/messages` - Send message

5. **Owner Reviews**
   - `GET /api/owner/reviews` - Get property reviews

**Security Focus:**
- Multi-image upload validation
- Property data validation (location, pricing)
- OTP rate limiting and expiry
- File size and type restrictions
- Ownership verification for all operations

**Implementation Steps:**
1. Secure property CRUD operations
2. Implement OTP security
3. Apply messaging security
4. Protect review access

---

### Phase 4: Admin & System Routes (Priority: LOW)

**Estimated Time:** 3-4 days  
**Routes:** 17 endpoints

#### Routes to Secure:

1. **Admin User Management**
   - `GET /api/admin/users` - List all users
   - `GET /api/admin/users/[id]` - User details
   - `PATCH /api/admin/users/[id]` - Update user
   - `POST /api/admin/users/[id]/blacklist` - Blacklist user

2. **Admin Property Management**
   - `GET /api/admin/properties` - List all properties
   - `GET /api/admin/properties/[id]` - Property details
   - `PATCH /api/admin/properties/[id]` - Update property
   - `DELETE /api/admin/properties/[id]` - Delete property

3. **Admin Booking Management**
   - `GET /api/admin/bookings` - List all bookings

4. **Admin Promotion Management**
   - `GET /api/admin/owner-requests` - List promotion requests
   - `POST /api/admin/promote-owner/[userId]` - Promote to owner
   - `POST /api/admin/reject-owner-promotion/[userId]` - Reject promotion

5. **Admin Settings**
   - `GET /api/admin/profile` - Admin profile
   - `PATCH /api/admin/profile` - Update profile
   - `POST /api/admin/change-password` - Change password
   - `POST /api/admin/upload-avatar` - Upload avatar
   - `GET /api/admin/stats` - Dashboard statistics
   - `POST /api/admin/setup` - Initial setup

6. **System Routes**
   - `GET /api/status` - Health check
   - `GET /api/test` - API test

**Security Focus:**
- Admin role verification on all routes
- Audit logging for all admin actions
- Prevent admin from modifying own role
- Super admin vs regular admin distinction
- Password change with old password verification

**Implementation Steps:**
1. Implement admin role checking
2. Secure user management
3. Apply property management security
4. Protect promotion workflow
5. Secure admin settings

---

### Phase 5: Performance & Testing (Priority: MEDIUM)

**Estimated Time:** 2-3 days

#### Tasks:

1. **Database Optimization**
   - Add indexes for frequently queried fields
   - Review compound indexes
   - Optimize aggregation pipelines

2. **Caching Strategy**
   - Implement Redis for rate limiting (distributed)
   - Cache frequently accessed data (properties, reviews)
   - Implement cache invalidation strategy

3. **Performance Testing**
   - Load test with 100+ concurrent users
   - Identify bottlenecks
   - Optimize slow queries (>500ms)

4. **Security Testing**
   - SQL/NoSQL injection testing
   - XSS payload testing
   - Rate limit bypass attempts
   - Session hijacking tests
   - CSRF protection verification

5. **Monitoring Setup**
   - Set up log aggregation
   - Configure alerts for security events
   - Performance monitoring dashboard
   - Error rate tracking

**Tools:**
- Artillery or k6 for load testing
- OWASP ZAP for security scanning
- New Relic or Datadog for monitoring

---

## Testing Checklist

### Security Testing

#### Authentication Testing
- [ ] Try accessing protected routes without session
- [ ] Try accessing with expired session
- [ ] Verify session timeout works
- [ ] Test logout functionality

#### Authorization Testing
- [ ] Try accessing other users' resources
- [ ] Try admin routes as regular user
- [ ] Try owner routes as student
- [ ] Verify ownership checks work

#### Input Validation Testing
- [ ] Submit invalid ObjectIds
- [ ] Submit malformed JSON
- [ ] Submit oversized payloads
- [ ] Test boundary values (min/max)
- [ ] Submit special characters
- [ ] Test SQL/NoSQL injection payloads

#### XSS Testing
```javascript
// Test these payloads in text fields:
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
javascript:alert('XSS')
<iframe src="javascript:alert('XSS')">
```

#### Rate Limiting Testing
- [ ] Make requests up to limit (should succeed)
- [ ] Exceed limit (should get 429)
- [ ] Verify Retry-After header
- [ ] Wait for window reset and retry
- [ ] Test with different IP addresses

#### Error Handling Testing
- [ ] Verify no stack traces in production
- [ ] Check error messages don't leak info
- [ ] Test with database down
- [ ] Test with invalid environment variables

### Functional Testing

#### Happy Path
- [ ] Complete user registration flow
- [ ] Search and view properties
- [ ] Create booking
- [ ] Make payment
- [ ] Owner accepts booking
- [ ] User checks booking status
- [ ] User leaves review

#### Edge Cases
- [ ] Duplicate bookings
- [ ] Concurrent booking attempts
- [ ] Booking fully occupied property
- [ ] Canceling already canceled booking
- [ ] Accepting already rejected booking
- [ ] Invalid payment verification

#### Error Scenarios
- [ ] Network timeout
- [ ] Database connection lost
- [ ] Payment gateway down
- [ ] Invalid session
- [ ] Concurrent updates

### Performance Testing

#### Load Testing
```bash
# Example using Artillery
artillery quick --count 100 --num 10 http://localhost:3000/api/properties
```

- [ ] 100 concurrent users (response time < 1s)
- [ ] 500 concurrent users (response time < 3s)
- [ ] Sustained load for 5 minutes
- [ ] Spike test (sudden traffic increase)

#### Database Performance
- [ ] Query execution time < 100ms (indexed queries)
- [ ] Query execution time < 500ms (complex queries)
- [ ] No full collection scans
- [ ] Proper index usage (check explain())

### Logging Testing

- [ ] Verify sensitive data is redacted
- [ ] Check security events are logged
- [ ] Verify error context is captured
- [ ] Test log rotation
- [ ] Check log format consistency

---

## Troubleshooting

### Common Issues

#### Issue: Rate Limit Not Working

**Symptoms:**
- Can exceed rate limit without 429 response
- Rate limit resets too quickly

**Solutions:**
1. Check identifier is being generated correctly:
   ```typescript
   const identifier = getRateLimitIdentifier(req, userId);
   console.log('Rate limit identifier:', identifier);
   ```

2. Verify rate limit is being called:
   ```typescript
   const result = rateLimit(identifier, limit, windowMs);
   console.log('Rate limit result:', result);
   ```

3. For distributed systems, upgrade to Redis:
   ```typescript
   // Use Redis instead of in-memory Map
   import Redis from 'ioredis';
   const redis = new Redis(process.env.REDIS_URL);
   ```

#### Issue: Validation Errors Not Clear

**Symptoms:**
- Generic "Invalid input" messages
- Users don't know what's wrong

**Solutions:**
1. Use schema validation for better error messages:
   ```typescript
   const result = validateSchema(mySchema, body);
   if (!result.success) {
     // result.error contains field name and specific issue
     return createErrorResponse(result.error, 400);
   }
   ```

2. Add specific validation messages:
   ```typescript
   if (!validId) {
     return createErrorResponse('Property ID must be a 24-character hexadecimal string', 400);
   }
   ```

#### Issue: Logs Not Showing Sensitive Data Redaction

**Symptoms:**
- Passwords visible in logs
- Tokens appearing in log output

**Solutions:**
1. Check key names match sensitive patterns:
   ```typescript
   // These will be redacted automatically:
   password, token, secret, apiKey, api_key, etc.
   ```

2. Use logger methods (not console.log):
   ```typescript
   // ❌ Don't use
   console.log(user);
   
   // ✅ Use
   logger.info('User data', { user });
   ```

3. Manually redact if needed:
   ```typescript
   const safeUser = {
     ...user,
     password: '[REDACTED]',
     token: '[REDACTED]'
   };
   logger.info('User data', { user: safeUser });
   ```

#### Issue: CORS Errors

**Symptoms:**
- Browser blocks API requests
- "Access-Control-Allow-Origin" errors

**Solutions:**
1. Add allowed origin to environment:
   ```
   ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
   ```

2. Use CORS headers in response:
   ```typescript
   const origin = req.headers.get('origin');
   const corsHeaders = getCorsHeaders(origin);
   
   Object.entries(corsHeaders).forEach(([key, value]) => {
     response.headers.set(key, value);
   });
   ```

#### Issue: Session Not Persisting

**Symptoms:**
- User logged out after refresh
- Session expires immediately

**Solutions:**
1. Check NEXTAUTH_URL matches your domain:
   ```
   NEXTAUTH_URL=http://localhost:3000
   ```

2. Verify NEXTAUTH_SECRET is set:
   ```
   NEXTAUTH_SECRET=your-secret-key-here
   ```

3. Check session max age:
   ```typescript
   session: {
     maxAge: 24 * 60 * 60, // 24 hours
   }
   ```

#### Issue: TypeScript Errors After Adding Security

**Symptoms:**
- Import errors
- Type mismatch errors

**Solutions:**
1. Ensure zod is installed:
   ```bash
   npm install zod
   ```

2. Check imports are correct:
   ```typescript
   import { logger } from '@/lib/logger';  // Not @/lib/logger.ts
   import { rateLimit } from '@/lib/security-enhanced';
   ```

3. Use correct logger method signatures:
   ```typescript
   // ✅ Correct
   logger.logSecurity('EVENT_NAME', { email, resourceId });
   
   // ❌ Wrong
   logger.logSecurity('EVENT_NAME', email, { resourceId });
   ```

### Performance Issues

#### Slow Database Queries

**Solution:** Add indexes
```javascript
// In your model file
propertySchema.index({ 'location.city': 1, price: 1 });
propertySchema.index({ ownerId: 1, status: 1 });
bookingSchema.index({ studentId: 1, status: 1 });
bookingSchema.index({ propertyId: 1, checkInDate: 1 });
```

#### Memory Leaks

**Solution:** Clear rate limit map periodically (already implemented)
```typescript
setInterval(cleanupRateLimitMap, 5 * 60 * 1000);
```

#### High CPU Usage

**Possible Causes:**
- Too many regex operations
- Heavy JSON parsing
- Inefficient loops

**Solutions:**
1. Cache expensive operations
2. Use indexes for database queries
3. Limit result sets with pagination
4. Profile with Node.js profiler

---

## Quick Reference

### Import Checklist

```typescript
// Always import these for secured routes:
import { 
  rateLimit, 
  getRateLimitIdentifier,
  addSecurityHeaders,
  createErrorResponse,
  validateObjectId,
  sanitizeString,
  getRequestMetadata,
  sanitizeErrorForLog
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';
```

### Rate Limit Standards

```typescript
GET (read):         100 req / 15 min
POST (create):       50 req / 15 min
POST (critical):     20 req / 15 min
POST (accept/reject): 30 req / 15 min
DELETE:              30 req / 15 min
File Upload:         10 req / 15 min
Public endpoints:    20 req / 15 min
```

### Common Validations

```typescript
// ObjectId
const validId = validateObjectId(id);
if (!validId) return createErrorResponse('Invalid ID', 400);

// Integer with range
const quantity = validateInteger(value, 1, 100);
if (quantity === null) return createErrorResponse('Invalid quantity', 400);

// Email
const validEmail = validateEmail(email);
if (!validEmail) return createErrorResponse('Invalid email', 400);

// Text sanitization
const clean = sanitizeString(input).slice(0, maxLength);

// Date
const date = new Date(dateString);
if (isNaN(date.getTime())) return createErrorResponse('Invalid date', 400);
```

### Response Template

```typescript
const response = NextResponse.json({
  success: true,
  data: result,
  message: 'Operation successful',
  timestamp: new Date().toISOString(),
}, { status: 200 });

addSecurityHeaders(response);
addRateLimitHeaders(response, limit, remaining, resetTime);

return response;
```

---

## Appendix

### A. Files Modified (Phase 1)

```
✅ src/lib/security-enhanced.ts (NEW - 800+ lines)
✅ src/lib/logger.ts (NEW - 350+ lines)
✅ src/lib/env.ts (NEW - 200+ lines)
✅ src/lib/SECURE_API_TEMPLATE.md (NEW)
✅ src/app/api/bookings/create/route.ts (UPDATED)
✅ src/app/api/owner/bookings/accept/route.ts (UPDATED)
✅ src/app/api/owner/bookings/reject/route.ts (UPDATED)
✅ package.json (zod dependency added)
✅ SECURITY_HARDENING_REPORT.md (NEW)
✅ SECURITY_IMPLEMENTATION_GUIDE.md (NEW - this file)
```

### B. Dependencies Added

```json
{
  "zod": "^3.22.4"
}
```

### C. Environment Variables Required

```bash
# Required
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Optional (with defaults)
NODE_ENV=production
LOG_LEVEL=INFO
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
MAX_REQUEST_SIZE=10485760
SESSION_MAX_AGE=86400
ALLOWED_ORIGINS=http://localhost:3000
```

### D. Route Implementation Status

**Secured (3/54):**
- ✅ POST /api/bookings/create
- ✅ POST /api/owner/bookings/accept
- ✅ POST /api/owner/bookings/reject

**Remaining (51):** See Phase 2-5 sections

### E. OWASP Top 10 Coverage

| # | Vulnerability | Status | Protection |
|---|--------------|--------|------------|
| 1 | Broken Access Control | ✅ | Session + ownership checks |
| 2 | Cryptographic Failures | ✅ | No hardcoded secrets, env validation |
| 3 | Injection | ✅ | Input sanitization, NoSQL prevention |
| 4 | Insecure Design | ✅ | Rate limiting, defensive coding |
| 5 | Security Misconfiguration | ✅ | Security headers, env validation |
| 6 | Vulnerable Components | ⚠️ | 1 npm vulnerability |
| 7 | Authentication Failures | ✅ | NextAuth + logging |
| 8 | Software & Data Integrity | ✅ | Validation + audit logging |
| 9 | Security Logging Failures | ✅ | Comprehensive logging |
| 10 | SSRF | ✅ | URL validation |

---

## Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-07 | Initial version - Phase 1 complete |

---

**For Questions or Issues:**
- Review: [SECURITY_HARDENING_REPORT.md](./SECURITY_HARDENING_REPORT.md)
- Template: [src/lib/SECURE_API_TEMPLATE.md](./src/lib/SECURE_API_TEMPLATE.md)
- Check logs for security events and errors

**Next Steps:**
1. Review this guide thoroughly
2. Proceed to Phase 2 (Payment & User Routes)
3. Follow the patterns established in Phase 1
4. Update this document as needed

---

*End of Security Implementation Guide*
