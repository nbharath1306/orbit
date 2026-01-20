# Phase 5: Installation & Setup Guide

## Required Dependencies

Phase 5 requires several new packages for performance testing, security testing, and Redis caching.

### Install Dependencies

```bash
# Performance and Security Testing Dependencies
npm install --save-dev artillery axios chalk

# Redis Caching (Production)
npm install redis

# Optional: Monitoring Services
npm install --save-dev @datadog/browser-rum  # For Datadog
npm install newrelic                         # For New Relic  
npm install @sentry/node @sentry/nextjs     # For Sentry error tracking
```

### Dependency Details

#### 1. Artillery (Performance Testing)
**Package**: `artillery@latest`  
**Purpose**: Load, stress, and spike testing  
**Global Install**: `npm install -g artillery`  
**Usage**: `artillery run tests/performance/load-test.yml`

#### 2. Axios (HTTP Client for Security Tests)
**Package**: `axios@^1.6.0`  
**Purpose**: HTTP requests in security test suite  
**Usage**: Making test requests to API endpoints

#### 3. Chalk (Terminal Colors)
**Package**: `chalk@^5.3.0`  
**Purpose**: Colored output in security test results  
**Usage**: Green/red checkmarks for pass/fail tests

#### 4. Redis (Caching & Rate Limiting)
**Package**: `redis@^4.6.0`  
**Purpose**: Distributed caching and rate limiting  
**Required**: Production environment  
**Optional**: Development (graceful degradation built-in)

### Production Redis Setup

#### Option 1: Redis Cloud (Recommended)
```bash
# Sign up at https://redis.com/try-free/
# Get connection URL and password
REDIS_URL=redis://redis-xxxxx.cloud.redislabs.com:xxxxx
REDIS_PASSWORD=your_secure_password
```

#### Option 2: AWS ElastiCache
```bash
# Create ElastiCache Redis cluster
# Use cluster endpoint
REDIS_URL=redis://xxxxx.cache.amazonaws.com:6379
REDIS_TLS_ENABLED=true
```

#### Option 3: Local Redis (Development)
```bash
# Install Redis locally
# Windows: https://github.com/microsoftarchive/redis/releases
# Mac: brew install redis
# Linux: sudo apt-get install redis-server

# Start Redis
redis-server

# Default connection
REDIS_URL=redis://localhost:6379
```

### Environment Variables

Add to your `.env` file:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS_ENABLED=false

# Monitoring (Optional - for production)
MONITORING_ENABLED=true
METRICS_FLUSH_INTERVAL_SECONDS=60
LOG_LEVEL=info

# Alert Channels (Optional - configure as needed)
SLACK_WEBHOOK_URL=
ALERT_EMAIL=
SENDGRID_API_KEY=
PAGERDUTY_INTEGRATION_KEY=

# Performance Monitoring Services (Optional)
DATADOG_API_KEY=
NEW_RELIC_LICENSE_KEY=
SENTRY_DSN=
```

### Verification Steps

#### 1. Verify Package Installation
```bash
# Check installed packages
npm list artillery axios chalk redis

# Expected output:
# ├── artillery@2.0.x
# ├── axios@1.6.x
# ├── chalk@5.3.x
# └── redis@4.6.x
```

#### 2. Verify Redis Connection
```bash
# Start Redis (if local)
redis-server

# Test connection
redis-cli ping
# Expected: PONG

# Or use Node.js
node -e "const redis = require('redis'); const client = redis.createClient(); client.connect().then(() => console.log('✅ Redis connected')).catch(e => console.error('❌ Redis error:', e.message));"
```

#### 3. Test Artillery Installation
```bash
# Check Artillery version
artillery --version
# Expected: 2.0.x

# Run quick test
artillery quick --count 10 --num 5 https://api.orbitpg.com/api/status
```

#### 4. Run Security Tests
```bash
# Should work without Redis (HTTP tests only)
node tests/security/security-tests.js
```

### Troubleshooting

#### Issue: Artillery not found
```bash
# Solution: Install globally
npm install -g artillery@latest

# Or use npx
npx artillery run tests/performance/load-test.yml
```

#### Issue: Redis connection refused
```bash
# Check if Redis is running
redis-cli ping

# If not running, start it:
# Windows: Run redis-server.exe
# Mac/Linux: redis-server

# Or disable Redis for development:
# Remove REDIS_URL from .env
# App will work without caching
```

#### Issue: Chalk import errors
```bash
# Chalk v5+ uses ESM modules
# Downgrade if needed:
npm install chalk@^4.1.2 --save-dev

# Or update test file to use require():
const chalk = require('chalk');
```

#### Issue: TypeScript errors for redis types
```bash
# Install type definitions
npm install --save-dev @types/redis

# Or regenerate types
npx tsc --noEmit
```

### Testing Checklist

After installation, verify everything works:

- [ ] `npm install` completes without errors
- [ ] Redis connects (or gracefully degrades)
- [ ] Artillery runs: `artillery run tests/performance/load-test.yml`
- [ ] Security tests run: `node tests/security/security-tests.js`
- [ ] TypeScript compiles: `npm run build`
- [ ] No import/type errors in monitoring files

### Package.json Updates

Ensure your `package.json` includes:

```json
{
  "scripts": {
    "test:load": "artillery run tests/performance/load-test.yml",
    "test:stress": "artillery run tests/performance/stress-test.yml",
    "test:spike": "artillery run tests/performance/spike-test.yml",
    "test:security": "node tests/security/security-tests.js",
    "test:performance": "npm run test:load && npm run test:stress && npm run test:spike",
    "test:all": "npm run test:security && npm run test:performance"
  },
  "dependencies": {
    "redis": "^4.6.0"
  },
  "devDependencies": {
    "artillery": "^2.0.0",
    "axios": "^1.6.0",
    "chalk": "^5.3.0"
  }
}
```

### Production Deployment

Before deploying to production:

1. ✅ Install all dependencies: `npm install --production=false`
2. ✅ Configure Redis URL (required in production)
3. ✅ Set monitoring environment variables
4. ✅ Run build: `npm run build`
5. ✅ Test staging environment: `BASE_URL=https://staging.api.orbitpg.com npm run test:load`
6. ✅ Deploy with environment variables

### Optional: Docker Setup

If using Docker, add to `Dockerfile`:

```dockerfile
# Install dependencies
RUN npm ci --production=false

# For production builds
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Redis connection will be external (ElastiCache, Redis Cloud, etc.)
ENV REDIS_URL=${REDIS_URL}

CMD ["npm", "start"]
```

Add to `docker-compose.yml` (for local development):

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

### Support

For installation issues:
- Check [Redis documentation](https://redis.io/docs/)
- Check [Artillery documentation](https://www.artillery.io/docs)
- Review Phase 5 completion report: `PHASE_5_COMPLETION_REPORT.md`
- Check application logs for specific errors

---

**Installation Guide Version**: 1.0  
**Last Updated**: January 20, 2026  
**Compatible With**: Phase 5 Implementation
