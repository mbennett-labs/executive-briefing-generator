/**
 * Test script for story-007: Get user assessments endpoint
 * Tests all acceptance criteria
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Valid responses for all 11 questions
const VALID_RESPONSES = {
  q1: 'under_50k',
  q2: '10_20_years',
  q3: '10_25',
  q4: ['hipaa', 'hitech', 'soc2'],
  q5: '11_25',
  q6: 'minor',
  q7: 'regional',
  q8: 'moderate',
  q9: 'minor',
  q10: 'briefed',
  q11: 'partial'
};

function makeRequest(method, path, data, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers
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
  console.log('Testing story-007: Get user assessments endpoint\n');
  let passed = 0;
  let failed = 0;

  // Setup: Create a test user and get token
  const testEmail = `getassessments${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  console.log('Setup: Creating test user and getting JWT token...');

  // Register user
  await makeRequest('POST', '/api/auth/register', {
    email: testEmail,
    password: testPassword,
    name: 'Get Assessments Test User',
    organization_name: 'Test Org'
  });

  // Login to get token
  const loginRes = await makeRequest('POST', '/api/auth/login', {
    email: testEmail,
    password: testPassword
  });

  if (loginRes.status !== 200 || !loginRes.body.token) {
    console.log('Setup failed - could not get JWT token');
    process.exit(1);
  }

  const token = loginRes.body.token;
  console.log('Setup complete - JWT token obtained\n');

  // Test 1: GET /api/assessments requires authentication
  console.log('Test 1: GET /api/assessments requires authentication');
  try {
    const res = await makeRequest('GET', '/api/assessments');
    if (res.status === 401) {
      console.log('  ✓ PASSED - Returns 401 without token\n');
      passed++;
    } else {
      console.log(`  ✗ FAILED - Expected 401, got ${res.status}\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 2: Returns 401 if not authenticated (invalid token)
  console.log('Test 2: Returns 401 if not authenticated (invalid token)');
  try {
    const res = await makeRequest('GET', '/api/assessments', null, 'invalid-token');
    if (res.status === 401) {
      console.log('  ✓ PASSED - Returns 401 with invalid token\n');
      passed++;
    } else {
      console.log(`  ✗ FAILED - Expected 401, got ${res.status}\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 3: Returns empty array if no assessments
  console.log('Test 3: Returns empty array if no assessments');
  try {
    const res = await makeRequest('GET', '/api/assessments', null, token);
    if (res.status === 200 && Array.isArray(res.body.assessments) && res.body.assessments.length === 0) {
      console.log('  ✓ PASSED - Returns empty array for new user\n');
      passed++;
    } else {
      console.log(`  ✗ FAILED - Expected empty array, got: ${JSON.stringify(res.body)}\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Create some assessments for testing
  console.log('Creating test assessments...');
  await makeRequest('POST', '/api/assessments', { responses: VALID_RESPONSES }, token);
  await makeRequest('POST', '/api/assessments', { responses: { ...VALID_RESPONSES, q2: '50_plus_years' } }, token);
  await makeRequest('POST', '/api/assessments', { responses: { ...VALID_RESPONSES, q3: 'over_60' } }, token);
  console.log('Created 3 test assessments\n');

  // Test 4: Returns array of user's assessments
  console.log('Test 4: Returns array of user\'s assessments');
  try {
    const res = await makeRequest('GET', '/api/assessments', null, token);
    if (res.status === 200 && Array.isArray(res.body.assessments) && res.body.assessments.length === 3) {
      console.log(`  ✓ PASSED - Returns ${res.body.assessments.length} assessments\n`);
      passed++;
    } else {
      console.log(`  ✗ FAILED - Expected 3 assessments, got ${res.body.assessments?.length}\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 5: Each assessment includes: id, risk_score, risk_level, created_at
  console.log('Test 5: Each assessment includes: id, risk_score, risk_level, created_at');
  try {
    const res = await makeRequest('GET', '/api/assessments', null, token);
    if (res.status === 200 && res.body.assessments.length > 0) {
      const assessment = res.body.assessments[0];
      const hasAllFields =
        assessment.id !== undefined &&
        assessment.risk_score !== undefined &&
        assessment.risk_level !== undefined &&
        assessment.created_at !== undefined;

      // Should NOT include full responses in list view
      const excludesResponses = assessment.responses === undefined;

      if (hasAllFields && excludesResponses) {
        console.log(`  ✓ PASSED - Assessment has required fields: id=${assessment.id}, score=${assessment.risk_score}, level=${assessment.risk_level}\n`);
        passed++;
      } else {
        console.log(`  ✗ FAILED - Missing fields or includes responses. Fields: ${Object.keys(assessment).join(', ')}\n`);
        failed++;
      }
    } else {
      console.log('  ✗ FAILED - No assessments returned\n');
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 6: Assessments ordered by created_at desc (newest first)
  console.log('Test 6: Assessments ordered by created_at desc (newest first)');
  try {
    const res = await makeRequest('GET', '/api/assessments', null, token);
    if (res.status === 200 && res.body.assessments.length >= 2) {
      const dates = res.body.assessments.map(a => new Date(a.created_at).getTime());
      let isDescending = true;
      for (let i = 1; i < dates.length; i++) {
        if (dates[i] > dates[i - 1]) {
          isDescending = false;
          break;
        }
      }
      if (isDescending) {
        console.log('  ✓ PASSED - Assessments ordered by created_at descending\n');
        passed++;
      } else {
        console.log('  ✗ FAILED - Assessments not in descending order\n');
        failed++;
      }
    } else {
      console.log('  ✗ FAILED - Not enough assessments to test ordering\n');
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 7: Different user sees only their own assessments
  console.log('Test 7: Different user sees only their own assessments');
  try {
    // Create another user
    const otherEmail = `other${Date.now()}@example.com`;
    await makeRequest('POST', '/api/auth/register', {
      email: otherEmail,
      password: 'password123',
      name: 'Other User',
      organization_name: 'Other Org'
    });
    const otherLogin = await makeRequest('POST', '/api/auth/login', {
      email: otherEmail,
      password: 'password123'
    });
    const otherToken = otherLogin.body.token;

    // Get assessments for other user (should be empty)
    const res = await makeRequest('GET', '/api/assessments', null, otherToken);
    if (res.status === 200 && res.body.assessments.length === 0) {
      console.log('  ✓ PASSED - Other user sees only their own (empty) assessments\n');
      passed++;
    } else {
      console.log(`  ✗ FAILED - Other user saw ${res.body.assessments.length} assessments (should be 0)\n`);
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
