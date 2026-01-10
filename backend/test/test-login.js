/**
 * Test script for story-003: User login endpoint
 * Tests all acceptance criteria
 */

const http = require('http');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3001';
const JWT_SECRET = 'qsl-briefing-dev-secret-key-change-in-production';

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('Testing story-003: User login endpoint\n');
  let passed = 0;
  let failed = 0;

  // First, create a test user for login tests
  const testEmail = `logintest${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  console.log('Setup: Creating test user for login tests...');
  const setupRes = await makeRequest('POST', '/api/auth/register', {
    email: testEmail,
    password: testPassword,
    name: 'Login Test User',
    organization_name: 'Test Org'
  });

  if (setupRes.status !== 201) {
    console.log('Setup failed - could not create test user\n');
    process.exit(1);
  }
  const testUserId = setupRes.body.user.id;
  console.log('Setup complete - test user created\n');

  // Test 1: POST /api/auth/login accepts email and password
  console.log('Test 1: POST /api/auth/login accepts email and password');
  console.log('        Returns 200 with JWT token on successful authentication');
  try {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword
    });
    if (res.status === 200 && res.body.token && res.body.user) {
      console.log('  ✓ PASSED - Login successful with token returned\n');
      passed++;
    } else {
      console.log('  ✗ FAILED - Expected 200 with token:', JSON.stringify(res.body), '\n');
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 2: Returns 401 if email is wrong
  console.log('Test 2: Returns 401 if credentials invalid (wrong email)');
  try {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'nonexistent@example.com',
      password: testPassword
    });
    if (res.status === 401 && res.body.error === 'Invalid credentials') {
      console.log('  ✓ PASSED\n');
      passed++;
    } else {
      console.log('  ✗ FAILED - Expected 401 with invalid credentials error\n');
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 3: Returns 401 if password is wrong
  console.log('Test 3: Returns 401 if credentials invalid (wrong password)');
  try {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: 'wrongpassword'
    });
    if (res.status === 401 && res.body.error === 'Invalid credentials') {
      console.log('  ✓ PASSED\n');
      passed++;
    } else {
      console.log('  ✗ FAILED - Expected 401 with invalid credentials error\n');
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 4: Token includes user_id in payload
  console.log('Test 4: Token includes user_id in payload');
  try {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword
    });
    if (res.status === 200 && res.body.token) {
      const decoded = jwt.verify(res.body.token, JWT_SECRET);
      if (decoded.user_id === testUserId) {
        console.log('  ✓ PASSED - Token contains correct user_id\n');
        passed++;
      } else {
        console.log('  ✗ FAILED - Token user_id does not match:', decoded.user_id, '!==', testUserId, '\n');
        failed++;
      }
    } else {
      console.log('  ✗ FAILED - No token received\n');
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 5: JWT token expires in 24 hours
  console.log('Test 5: JWT token expires in 24 hours');
  try {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword
    });
    if (res.status === 200 && res.body.token) {
      const decoded = jwt.verify(res.body.token, JWT_SECRET);
      const expiresIn = decoded.exp - decoded.iat;
      // 24 hours = 86400 seconds
      if (expiresIn === 86400) {
        console.log('  ✓ PASSED - Token expires in 24 hours (86400 seconds)\n');
        passed++;
      } else {
        console.log('  ✗ FAILED - Token expiration:', expiresIn, 'seconds (expected 86400)\n');
        failed++;
      }
    } else {
      console.log('  ✗ FAILED - No token received\n');
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  console.log('=====================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('=====================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
