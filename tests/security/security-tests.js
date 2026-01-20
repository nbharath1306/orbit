/**
 * Security Testing Suite
 * Orbit PG - Comprehensive Security Tests
 * 
 * Tests for:
 * - SQL/NoSQL Injection
 * - XSS Attacks
 * - Rate Limiting
 * - Authentication Bypass
 * - Authorization Violations
 */

const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

/**
 * Helper to run a test
 */
async function runTest(name, testFn) {
  try {
    await testFn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    console.log(chalk.green(`✓ ${name}`));
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
    console.log(chalk.red(`✗ ${name}: ${error.message}`));
  }
}

/**
 * NoSQL Injection Tests
 */
async function testNoSQLInjection() {
  const payloads = [
    { $ne: null },
    { $gt: '' },
    '{"$ne": null}',
    "' || '1'=='1",
    '"; return true; //',
  ];

  await runTest('NoSQL Injection - Property Search', async () => {
    for (const payload of payloads) {
      const response = await axios.get(`${BASE_URL}/api/properties`, {
        params: { search: JSON.stringify(payload) },
        validateStatus: () => true,
      });

      // Should not return unauthorized data or cause errors
      if (response.status === 500 || response.status === 200) {
        // Check if response contains injection patterns
        const data = JSON.stringify(response.data);
        if (data.includes('$ne') || data.includes('$gt')) {
          throw new Error('NoSQL injection payload reflected in response');
        }
      }
    }
  });

  await runTest('NoSQL Injection - User ID Parameter', async () => {
    const maliciousIds = [
      '{"$ne": ""}',
      '507f1f77bcf86cd799439011\' OR \'1\'=\'1',
      '507f1f77bcf86cd799439011; DROP TABLE users;--',
    ];

    for (const id of maliciousIds) {
      const response = await axios.get(`${BASE_URL}/api/admin/users/${id}`, {
        validateStatus: () => true,
      });

      // Should return 400 (bad request) or 401 (unauthorized)
      if (![400, 401, 403, 404].includes(response.status)) {
        throw new Error(`Unexpected status ${response.status} for malicious ID`);
      }
    }
  });
}

/**
 * XSS (Cross-Site Scripting) Tests
 */
async function testXSS() {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
  ];

  await runTest('XSS - Property Search Input', async () => {
    for (const payload of xssPayloads) {
      const response = await axios.get(`${BASE_URL}/api/properties`, {
        params: { search: payload },
        validateStatus: () => true,
      });

      // Response should not contain unescaped script tags
      const data = JSON.stringify(response.data);
      if (data.includes('<script>') || data.includes('onerror=')) {
        throw new Error('XSS payload not sanitized');
      }
    }
  });
}

/**
 * Rate Limiting Tests
 */
async function testRateLimiting() {
  await runTest('Rate Limiting - Excessive Requests', async () => {
    const requests = [];
    
    // Send 150 requests rapidly (limit is 100/15min for most endpoints)
    for (let i = 0; i < 150; i++) {
      requests.push(
        axios.get(`${BASE_URL}/api/properties`, {
          validateStatus: () => true,
        })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimitedCount = responses.filter((r) => r.status === 429).length;

    // Should have some 429 responses
    if (rateLimitedCount === 0) {
      throw new Error('Rate limiting not triggered');
    }

    console.log(chalk.yellow(`  Rate limited ${rateLimitedCount}/150 requests`));
  });

  await runTest('Rate Limiting - Retry-After Header', async () => {
    const requests = [];
    
    // Trigger rate limit
    for (let i = 0; i < 120; i++) {
      requests.push(
        axios.get(`${BASE_URL}/api/properties`, {
          validateStatus: () => true,
        })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.find((r) => r.status === 429);

    if (rateLimited && !rateLimited.headers['retry-after']) {
      throw new Error('Rate limited response missing Retry-After header');
    }
  });
}

/**
 * Authentication Tests
 */
async function testAuthentication() {
  await runTest('Authentication - Accessing Protected Route Without Token', async () => {
    const response = await axios.get(`${BASE_URL}/api/user/bookings`, {
      validateStatus: () => true,
    });

    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });

  await runTest('Authentication - Invalid Token', async () => {
    const response = await axios.get(`${BASE_URL}/api/user/bookings`, {
      headers: { Authorization: 'Bearer invalid_token_12345' },
      validateStatus: () => true,
    });

    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });
}

/**
 * Authorization Tests
 */
async function testAuthorization() {
  await runTest('Authorization - Admin Route Access Without Admin Role', async () => {
    const response = await axios.get(`${BASE_URL}/api/admin/users`, {
      validateStatus: () => true,
    });

    // Should be 401 (not authenticated) or 403 (not authorized)
    if (![401, 403].includes(response.status)) {
      throw new Error(`Expected 401/403, got ${response.status}`);
    }
  });

  await runTest('Authorization - Owner Route Access Without Owner Role', async () => {
    const response = await axios.get(`${BASE_URL}/api/owner/properties`, {
      validateStatus: () => true,
    });

    if (![401, 403].includes(response.status)) {
      throw new Error(`Expected 401/403, got ${response.status}`);
    }
  });
}

/**
 * Input Validation Tests
 */
async function testInputValidation() {
  await runTest('Input Validation - Invalid ObjectId Format', async () => {
    const response = await axios.get(`${BASE_URL}/api/properties/invalid_id`, {
      validateStatus: () => true,
    });

    if (response.status !== 400 && response.status !== 404) {
      throw new Error(`Expected 400/404, got ${response.status}`);
    }
  });

  await runTest('Input Validation - Oversized Payload', async () => {
    const largePayload = { data: 'x'.repeat(20 * 1024 * 1024) }; // 20MB

    const response = await axios.post(`${BASE_URL}/api/properties`, largePayload, {
      validateStatus: () => true,
      maxBodyLength: Infinity,
    });

    // Should reject large payloads
    if (![400, 413, 500].includes(response.status)) {
      throw new Error(`Large payload not rejected: ${response.status}`);
    }
  });
}

/**
 * Security Headers Tests
 */
async function testSecurityHeaders() {
  await runTest('Security Headers - X-Content-Type-Options', async () => {
    const response = await axios.get(`${BASE_URL}/api/status`);
    
    if (response.headers['x-content-type-options'] !== 'nosniff') {
      throw new Error('Missing X-Content-Type-Options header');
    }
  });

  await runTest('Security Headers - X-Frame-Options', async () => {
    const response = await axios.get(`${BASE_URL}/api/status`);
    
    if (!response.headers['x-frame-options']) {
      throw new Error('Missing X-Frame-Options header');
    }
  });

  await runTest('Security Headers - Strict-Transport-Security', async () => {
    const response = await axios.get(`${BASE_URL}/api/status`);
    
    // Note: Only present in HTTPS
    if (BASE_URL.startsWith('https') && !response.headers['strict-transport-security']) {
      throw new Error('Missing Strict-Transport-Security header');
    }
  });
}

/**
 * CSRF Protection Tests
 */
async function testCSRF() {
  await runTest('CSRF - State-Changing Request Without Token', async () => {
    // Most endpoints require authentication, which provides CSRF protection
    const response = await axios.post(
      `${BASE_URL}/api/bookings/create`,
      { propertyId: '507f1f77bcf86cd799439011' },
      { validateStatus: () => true }
    );

    // Should be rejected (401 unauthorized)
    if (response.status === 200) {
      throw new Error('State-changing request succeeded without authentication');
    }
  });
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(chalk.blue.bold('\n🔒 Starting Security Test Suite\n'));
  console.log(chalk.gray(`Target: ${BASE_URL}\n`));

  console.log(chalk.yellow('NoSQL Injection Tests:'));
  await testNoSQLInjection();

  console.log(chalk.yellow('\nXSS Tests:'));
  await testXSS();

  console.log(chalk.yellow('\nRate Limiting Tests:'));
  await testRateLimiting();

  console.log(chalk.yellow('\nAuthentication Tests:'));
  await testAuthentication();

  console.log(chalk.yellow('\nAuthorization Tests:'));
  await testAuthorization();

  console.log(chalk.yellow('\nInput Validation Tests:'));
  await testInputValidation();

  console.log(chalk.yellow('\nSecurity Headers Tests:'));
  await testSecurityHeaders();

  console.log(chalk.yellow('\nCSRF Protection Tests:'));
  await testCSRF();

  // Print summary
  console.log(chalk.blue.bold('\n\n📊 Test Summary:\n'));
  console.log(chalk.green(`Passed: ${results.passed}`));
  console.log(chalk.red(`Failed: ${results.failed}`));
  console.log(chalk.gray(`Total: ${results.passed + results.failed}`));

  // Print failed tests
  if (results.failed > 0) {
    console.log(chalk.red.bold('\n❌ Failed Tests:'));
    results.tests
      .filter((t) => t.status === 'FAILED')
      .forEach((t) => {
        console.log(chalk.red(`  - ${t.name}`));
        console.log(chalk.gray(`    ${t.error}`));
      });
  }

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error(chalk.red('Test suite failed:'), error);
  process.exit(1);
});
