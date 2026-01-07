import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  validatePagination,
  sanitizeString,
  validateObjectId,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

async function ensureSeeded() {
    try {
        const existingCount = await Property.countDocuments();
        if (existingCount > 0) {
            return; // Already seeded
        }

        console.log('Database empty, auto-seeding...');

        let owner = await User.findOne({ email: 'owner@orbit.com' });
        if (!owner) {
            owner = await User.create({
                name: 'Orbit Owner',
                email: 'owner@orbit.com',
                role: 'owner',
                isVerified: true,
                phone: '9999999999',
            });
        }

        const properties = [
            {
                ownerId: owner!._id,
                title: 'Sai Balaji PG',
                slug: 'sai-balaji-pg',
                description: 'Premium PG for students near DSU. Includes 3 times food and WiFi.',
                location: {
                    lat: 12.644,
                    lng: 77.436,
                    address: 'Harohalli, Karnataka',
                    directionsVideoUrl: 'https://youtube.com/shorts/example',
                },
                price: { amount: 6500, period: 'monthly' },
                amenities: ['WiFi', 'Mess', 'Hot Water', 'CCTV'],
                media: {
                    images: ['https://placehold.co/600x400/09090b/3b82f6?text=Sai+Balaji'],
                    virtualTourUrl: 'https://kuula.co/share/collection/7lVLq',
                },
                liveStats: { totalRooms: 50, occupiedRooms: 42 },
                verdict: 'Best food in Harohalli. Highly recommended for DSU students.',
                sentimentTags: ['Good Food', 'Strict Warden', 'Walkable to Campus'],
            },
            {
                ownerId: owner!._id,
                title: 'DSU Hostels',
                slug: 'dsu-hostels',
                description: 'Official on-campus accommodation. Very secure but strict rules.',
                location: {
                    lat: 12.642,
                    lng: 77.438,
                    address: 'DSU Campus, Harohalli',
                },
                price: { amount: 9000, period: 'monthly' },
                amenities: ['WiFi', 'Gym', 'Library Access', '24/7 Power'],
                media: {
                    images: ['https://placehold.co/600x400/09090b/3b82f6?text=DSU+Hostel'],
                },
                liveStats: { totalRooms: 200, occupiedRooms: 180 },
                verdict: 'Safest option but expensive. Curfew is strict.',
                sentimentTags: ['Safe', 'On Campus', 'Expensive'],
            },
            {
                ownerId: owner!._id,
                title: 'Green View Residency',
                slug: 'green-view',
                description: 'Budget friendly rooms with a nice view of the hills.',
                location: {
                    lat: 12.646,
                    lng: 77.434,
                    address: 'Near Bus Stand, Harohalli',
                },
                price: { amount: 4500, period: 'monthly' },
                amenities: ['WiFi', 'Parking', 'No Mess'],
                media: {
                    images: ['https://placehold.co/600x400/09090b/3b82f6?text=Green+View'],
                },
                liveStats: { totalRooms: 20, occupiedRooms: 5 },
                verdict: 'Good for budget. You need to arrange your own food.',
                sentimentTags: ['Budget', 'Freedom', 'No Food'],
            },
        ];

        for (const prop of properties) {
            const exists = await Property.findOne({ slug: prop.slug });
            if (!exists) {
                await Property.create(prop);
                console.log(`Created property: ${prop.slug}`);
            }
        }

        console.log('Auto-seeding complete');
    } catch (error) {
        console.error('Auto-seeding failed:', error);
    }
}

/**
 * GET /api/properties
 * Public endpoint to list properties with search and pagination
 * Security: Rate limited (public), paginated, sanitized search
 */
export async function GET(request: NextRequest) {
    const startTime = Date.now();
    const metadata = getRequestMetadata(request);

    try {
        // Stricter rate limiting for public endpoints (50 req/15min)
        const identifier = getRateLimitIdentifier(request);
        const rateLimitResult = rateLimit(identifier, 50, 15 * 60 * 1000);

        if (!rateLimitResult.success) {
            logger.warn('Rate limit exceeded for properties list', { ip: metadata.ip });
            return createRateLimitResponse(rateLimitResult.retryAfter!);
        }

        logger.info('Properties list request received', {
            method: request.method,
            url: request.url,
            ip: metadata.ip,
        });

        await dbConnect();
        await ensureSeeded();

        const { searchParams } = new URL(request.url);
        const searchRaw = searchParams.get('search');
        const limitParam = searchParams.get('limit');
        const pageParam = searchParams.get('page');

        // Sanitize search input
        const search = searchRaw ? sanitizeString(searchRaw).slice(0, 100) : null;

        // Validate pagination
        const { limit, skip } = validatePagination({
            limit: limitParam,
            page: pageParam,
        });

        // Build query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { 'location.address': { $regex: search, $options: 'i' } },
            ];
        }

        // Execute queries in parallel
        const [properties, total] = await Promise.all([
            Property.find(query)
                .populate('ownerId', 'name email')
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            Property.countDocuments(query).exec(),
        ]);

        logger.info('Properties list query completed', {
            count: properties.length,
            total,
            search: search || 'none',
        });

        // Log performance
        const duration = Date.now() - startTime;
        if (duration > 1000) {
            logger.warn('Slow properties query', {
                route: 'GET /api/properties',
                duration,
                count: properties.length,
            });
        }

        const response = NextResponse.json(
            {
                success: true,
                properties,
                pagination: {
                    total,
                    page: Math.floor(skip / limit) + 1,
                    totalPages: Math.ceil(total / limit),
                    limit,
                    skip,
                },
                search,
                timestamp: new Date().toISOString(),
            },
            { status: 200 }
        );

        addSecurityHeaders(response);
        addRateLimitHeaders(response, 50, rateLimitResult.remaining, rateLimitResult.resetTime);

        return response;
    } catch (error: any) {
        logger.error('Properties list query failed', sanitizeErrorForLog(error), {
            metadata,
        });
        return createErrorResponse('Failed to fetch properties. Please try again.', 500);
    }
}

/**
 * POST /api/properties
 * Create a new property (owner/admin only)
 * Security: Rate limited, authenticated, role-based authorization
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();
    const metadata = getRequestMetadata(request);
    let session: any = null;

    try {
        // Rate limiting - moderate for create operations (30 req/15min)
        const identifier = getRateLimitIdentifier(request);
        const rateLimitResult = rateLimit(identifier, 30, 15 * 60 * 1000);

        if (!rateLimitResult.success) {
            logger.warn('Rate limit exceeded for property creation', { ip: metadata.ip });
            return createRateLimitResponse(rateLimitResult.retryAfter!);
        }

        // Authentication
        session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            logger.warn('Unauthorized property creation attempt', { ip: metadata.ip });
            return createErrorResponse('Unauthorized', 401);
        }

        // Authorization - owner or admin only
        if (session.user.role !== 'owner' && session.user.role !== 'admin') {
            logger.logSecurity('UNAUTHORIZED_PROPERTY_CREATE_ATTEMPT', {
                email: session.user.email,
                role: session.user.role,
            });
            return createErrorResponse('Only owners and admins can create properties', 403);
        }

        logger.info('Property creation request received', {
            email: session.user.email,
            role: session.user.role,
        });

        await dbConnect();

        // Parse and validate input
        let body;
        try {
            body = await request.json();
        } catch {
            return createErrorResponse('Invalid JSON in request body', 400);
        }

        // Basic validation
        if (!body.title || !body.slug || !body.location || !body.price) {
            return createErrorResponse('Missing required fields: title, slug, location, price', 400);
        }

        // Sanitize text fields
        const sanitizedData = {
            ...body,
            title: sanitizeString(body.title).slice(0, 200),
            slug: sanitizeString(body.slug).slice(0, 200),
            description: body.description ? sanitizeString(body.description).slice(0, 5000) : undefined,
            ownerId: session.user.id,
        };

        const property = await Property.create(sanitizedData);

        logger.logSecurity('PROPERTY_CREATED', {
            email: session.user.email,
            propertyId: property._id.toString(),
            title: property.title,
        });

        // Log performance
        const duration = Date.now() - startTime;
        if (duration > 1000) {
            logger.warn('Slow property creation', {
                route: 'POST /api/properties',
                duration,
            });
        }

        const response = NextResponse.json(
            {
                success: true,
                property,
                message: 'Property created successfully',
                timestamp: new Date().toISOString(),
            },
            { status: 201 }
        );

        addSecurityHeaders(response);
        addRateLimitHeaders(response, 30, rateLimitResult.remaining, rateLimitResult.resetTime);

        return response;
    } catch (error: any) {
        logger.error('Property creation failed', sanitizeErrorForLog(error), {
            metadata,
            user: session?.user?.email || 'unknown',
        });

        // Handle duplicate key error
        if (error.code === 11000) {
            return createErrorResponse('Property with this slug already exists', 409);
        }

        return createErrorResponse('Failed to create property. Please try again.', 500);
    }
}

function createRateLimitResponse(retryAfter: number): NextResponse {
    const response = NextResponse.json(
        {
            error: 'Too many requests',
            retryAfter,
            timestamp: new Date().toISOString(),
        },
        {
            status: 429,
            headers: {
                'Retry-After': retryAfter.toString(),
            },
        }
    );

    addSecurityHeaders(response);
    return response;
}
