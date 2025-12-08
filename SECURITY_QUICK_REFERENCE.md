# User Dashboard Security Quick Reference

## Security Utilities (`src/lib/security.ts`)

### Rate Limiting
```typescript
import { rateLimit } from '@/lib/security';

// In API route
const clientIp = getClientIp(request);
const { allowed, remaining, resetTime } = await rateLimit(
  clientIp,
  60,      // max requests
  60000    // window in ms (1 minute)
);

if (!allowed) {
  return new Response('Too many requests', { status: 429 });
}
```

### Input Sanitization
```typescript
import { sanitizeInput } from '@/lib/security';

// Clean user input
const cleanSearch = sanitizeInput(searchQuery);
const cleanFilter = sanitizeInput(filterValue);
```

### ObjectId Validation
```typescript
import { isValidObjectId } from '@/lib/security';

if (!isValidObjectId(bookingId)) {
  return createErrorResponse('Invalid booking ID', 400);
}
```

### Email Validation
```typescript
import { isValidEmail } from '@/lib/security';

if (!isValidEmail(email)) {
  return createErrorResponse('Invalid email format', 400);
}
```

### Pagination Validation
```typescript
import { validatePagination } from '@/lib/security';

const { page, limit } = validatePagination(searchParams);
// Returns safe values: page >= 1, limit 1-50
```

### Error Responses
```typescript
import { createErrorResponse } from '@/lib/security';

// Standard error format
return createErrorResponse('Error message', 400);
// Returns: { error: 'Error message' } with 400 status
```

### Security Headers
```typescript
import { addSecurityHeaders, secureHeaders } from '@/lib/security';

// Add to Response
const response = NextResponse.json({ data });
addSecurityHeaders(response);
return response;

// Or manually
return NextResponse.json({ data }, {
  headers: secureHeaders
});
```

---

## API Security Patterns

### Standard API Route Template
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { 
  rateLimit, 
  getClientIp, 
  addSecurityHeaders,
  createErrorResponse,
  sanitizeInput,
  isValidObjectId
} from '@/lib/security';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting
    const clientIp = getClientIp(request);
    const { allowed, remaining, resetTime } = await rateLimit(clientIp, 100, 60000);
    
    if (!allowed) {
      return createErrorResponse('Too many requests', 429);
    }

    // 2. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }

    // 3. Input validation
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (id && !isValidObjectId(id)) {
      return createErrorResponse('Invalid ID format', 400);
    }

    // 4. Database operations
    await dbConnect();
    const data = await YourModel.find({ userId: session.user.id }).lean();

    // 5. Response with security headers
    const response = NextResponse.json({ data });
    addSecurityHeaders(response);
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
    
    return response;
  } catch (error) {
    console.error('API Error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
```

---

## Component Security Patterns

### Error Boundary Usage
```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

// Wrap entire page
export default function Page() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}

// Custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

### Loading States
```tsx
import { 
  DashboardStatsLoading,
  BookingListLoading,
  ProfileCardLoading 
} from '@/components/user/LoadingSkeleton';

function MyComponent() {
  const [loading, setLoading] = useState(true);
  
  if (loading) {
    return <DashboardStatsLoading />;
  }
  
  return <ActualContent />;
}
```

### API Hook with Retry
```tsx
import useApi from '@/hooks/useApi';

function MyComponent() {
  const { data, loading, error, refetch } = useApi({
    url: '/api/user/stats',
    retries: 3,
    retryDelay: 1000,
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.error('Failed:', error),
  });

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return <DataDisplay data={data} />;
}
```

### Mutation Hook
```tsx
import { useMutation } from '@/hooks/useApi';

function MyForm() {
  const { mutate, loading, error } = useMutation({
    url: '/api/user/bookings',
    method: 'POST',
    onSuccess: () => router.push('/dashboard/bookings'),
  });

  const handleSubmit = async (formData) => {
    await mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <button disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
      {error && <p>Error: {error.message}</p>}
    </form>
  );
}
```

---

## Responsive Design Patterns

### Component Breakpoints
```tsx
// Mobile-first responsive classes
<div className="
  p-4 sm:p-6 lg:p-8
  text-sm sm:text-base lg:text-lg
  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
  gap-3 sm:gap-4 lg:gap-6
">
```

### Touch-Friendly Interactions
```tsx
<button className="
  px-4 py-3 
  active:scale-95 
  focus:outline-none focus:ring-2 focus:ring-blue-500
  hover:bg-blue-600
  transition-all
">
```

### Responsive Typography
```tsx
<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
<p className="text-xs sm:text-sm lg:text-base">
```

### Overflow Handling
```tsx
// Truncate single line
<p className="truncate">Long text...</p>

// Clamp multiple lines
<p className="line-clamp-2">Long description...</p>

// Scroll horizontal
<div className="overflow-x-auto">
  <table>...</table>
</div>
```

---

## Accessibility Patterns

### ARIA Labels
```tsx
<button aria-label="View booking details">
  <Icon />
</button>

<div role="status" aria-label="Loading...">
  <LoadingSpinner />
</div>
```

### Focus Management
```tsx
<button className="
  focus:outline-none 
  focus:ring-2 
  focus:ring-blue-500 
  focus:ring-offset-2
">
```

### Semantic HTML
```tsx
// Good
<button onClick={handleClick}>Action</button>
<nav>...</nav>
<main>...</main>

// Bad
<div onClick={handleClick}>Action</div>
<div>...</div> // for navigation
```

---

## Database Security Patterns

### Lean Queries (Performance)
```typescript
// Faster, returns plain objects
const bookings = await Booking.find({ userId }).lean();
```

### Parallel Queries
```typescript
const [stats, bookings, user] = await Promise.all([
  getStats(userId),
  getBookings(userId),
  getUser(userId),
]);
```

### Query Timeout
```typescript
await dbConnect();
const timeout = setTimeout(() => {
  throw new Error('Database query timeout');
}, 10000); // 10 seconds

try {
  const data = await Model.find().lean();
  clearTimeout(timeout);
  return data;
} catch (error) {
  clearTimeout(timeout);
  throw error;
}
```

### Ownership Verification
```typescript
const booking = await Booking.findOne({
  _id: bookingId,
  studentId: session.user.id, // Ensure user owns this
}).lean();

if (!booking) {
  return createErrorResponse('Booking not found', 404);
}
```

---

## Common Security Mistakes

### ❌ Don't Do This
```typescript
// No rate limiting
export async function GET(request: NextRequest) {
  const data = await getData();
  return NextResponse.json(data);
}

// No input validation
const id = searchParams.get('id');
const data = await Model.findById(id); // Injection risk!

// Exposing sensitive errors
catch (error) {
  return NextResponse.json({ error: error.message }); // Leaks info!
}

// No ownership check
const booking = await Booking.findById(id); // Any user can access!

// Sync operations blocking
const data = heavyComputation(); // Blocks event loop!
```

### ✅ Do This Instead
```typescript
// With rate limiting
const { allowed } = await rateLimit(clientIp, 60, 60000);
if (!allowed) return createErrorResponse('Rate limit exceeded', 429);

// With validation
if (!isValidObjectId(id)) {
  return createErrorResponse('Invalid ID', 400);
}
const data = await Model.findById(id).lean();

// Generic errors
catch (error) {
  console.error(error); // Log for debugging
  return createErrorResponse('Internal server error', 500);
}

// Ownership verification
const booking = await Booking.findOne({
  _id: id,
  studentId: session.user.id,
}).lean();

// Async operations
const data = await heavyComputationAsync();
```

---

## Testing Commands

### Security Testing
```bash
# Rate limit test
for i in {1..70}; do curl http://localhost:3000/api/user/stats; done

# XSS test
curl -X POST http://localhost:3000/api/user/bookings \
  -H "Content-Type: application/json" \
  -d '{"search": "<script>alert(\"xss\")</script>"}'

# Invalid ObjectId test
curl http://localhost:3000/api/user/bookings/invalid-id
```

### Build & Type Check
```bash
# Full build
npm run build

# Type check only
npx tsc --noEmit

# Lint check
npm run lint
```

### Accessibility Audit
```bash
# Install lighthouse
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000/dashboard --view
```

---

## Environment Variables

### Required
```env
# Authentication
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/orbit

# Optional
NODE_ENV=development
```

### Generate Secure Secret
```bash
# Linux/Mac
openssl rand -base64 32

# PowerShell
[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))
```

---

## Quick Checklist

### Before Committing
- [ ] No console.log in production code
- [ ] All inputs sanitized
- [ ] Rate limiting on all public APIs
- [ ] Error boundaries around components
- [ ] Loading states for async operations
- [ ] ARIA labels on interactive elements
- [ ] Responsive breakpoints tested

### Before Deploying
- [ ] npm run build passes
- [ ] All environment variables set
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] Error tracking enabled
- [ ] Database indexes created
- [ ] Backups configured

---

## Support Resources

- **Documentation:** USER_DASHBOARD_SECURITY_GUIDE.md
- **Code Examples:** src/lib/security.ts
- **API Templates:** src/app/api/user/stats/route.ts
- **Component Examples:** src/components/user/dashboard/

---

*Quick Reference v1.0.0*  
*Last Updated: $(Get-Date -Format "yyyy-MM-dd")*
