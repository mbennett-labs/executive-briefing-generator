/**
 * Test script for story-002: User registration endpoint
 * Tests all acceptance criteria
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

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
  console.log('Testing story-002: User registration endpoint\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Missing required fields
  console.log('Test 1: Returns 400 if required fields missing');
  try {
    const res = await makeRequest('POST', '/api/auth/register', {});
    if (res.status === 400 && res.body.error === 'Missing required fields') {
      console.log('  ✓ PASSED\n');
      passed++;
    } else {
      console.log('  ✗ FAILED - Expected 400 with missing fields error\n');
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 2: Invalid email format
  console.log('Test 2: Email format is validated');
  try {
    const res = await makeRequest('POST', '/api/auth/register', {
      email: 'invalid-email',
      password: 'password123',
      name: 'Test User',
      organization_name: 'Test Org'
    });
    if (res.status === 400 && res.body.error === 'Invalid email format') {
      console.log('  ✓ PASSED\n');
      passed++;
    } else {
      console.log('  ✗ FAILED - Expected 400 with invalid email error\n');
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 3: Successful registration
  const uniqueEmail = `test${Date.now()}@example.com`;
  console.log('Test 3: POST /api/auth/register accepts email, password, name, organization_name');
  console.log('        Returns 201 with user object (no password) on success');
  try {
    const res = await makeRequest('POST', '/api/auth/register', {
      email: uniqueEmail,
      password: 'securepassword123',
      name: 'Test User',
      organization_name: 'Test Organization'
    });
    if (res.status === 201 &&
        res.body.user &&
        res.body.user.email === uniqueEmail.toLowerCase() &&
        res.body.user.name === 'Test User' &&
        res.body.user.organization_name === 'Test Organization' &&
        !res.body.user.password_hash &&
        !res.body.user.password) {
      console.log('  ✓ PASSED - User created without password in response\n');
      passed++;
    } else {
      console.log('  ✗ FAILED - Unexpected response:', JSON.stringify(res.body), '\n');
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 4: Duplicate email
  console.log('Test 4: Returns 400 if email already exists');
  try {
    const res = await makeRequest('POST', '/api/auth/register', {
      email: uniqueEmail,
      password: 'anotherpassword',
      name: 'Another User',
      organization_name: 'Another Org'
    });
    if (res.status === 400 && res.body.error === 'Email already exists') {
      console.log('  ✓ PASSED\n');
      passed++;
    } else {
      console.log('  ✗ FAILED - Expected 400 with email exists error\n');
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 5: Verify password was hashed (by checking user in DB)
  console.log('Test 5: Password is hashed before storing (bcrypt)');
  try {
    const db = require('../src/db');
    const user = await db('users').where({ email: uniqueEmail.toLowerCase() }).first();
    if (user && user.password_hash && user.password_hash.startsWith('$2')) {
      console.log('  ✓ PASSED - Password stored as bcrypt hash\n');
      passed++;
    } else {
      console.log('  ✗ FAILED - Password not properly hashed\n');
      failed++;
    }
    await db.destroy();
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
