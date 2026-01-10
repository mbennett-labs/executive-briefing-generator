/**
 * Test script for story-006: Submit assessment endpoint
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
  console.log('Testing story-006: Submit assessment endpoint\n');
  let passed = 0;
  let failed = 0;

  // Setup: Create a test user and get token
  const testEmail = `assessmenttest${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  console.log('Setup: Creating test user and getting JWT token...');

  // Register user
  const registerRes = await makeRequest('POST', '/api/auth/register', {
    email: testEmail,
    password: testPassword,
    name: 'Assessment Test User',
    organization_name: 'Test Org'
  });

  if (registerRes.status !== 201) {
    console.log('Setup failed - could not create test user');
    process.exit(1);
  }

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

  // Test 1: POST /api/assessments requires authentication (JWT)
  console.log('Test 1: POST /api/assessments requires authentication (JWT)');
  try {
    const res = await makeRequest('POST', '/api/assessments', { responses: VALID_RESPONSES });
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
    const res = await makeRequest('POST', '/api/assessments', { responses: VALID_RESPONSES }, 'invalid-token');
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

  // Test 3: Accepts responses object matching question structure
  console.log('Test 3: Accepts responses object matching question structure');
  try {
    const res = await makeRequest('POST', '/api/assessments', { responses: VALID_RESPONSES }, token);
    if (res.status === 201 && res.body.assessment) {
      console.log('  ✓ PASSED - Accepts valid responses and creates assessment\n');
      passed++;
    } else {
      console.log(`  ✗ FAILED - Status: ${res.status}, Body: ${JSON.stringify(res.body)}\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 4: Validates all 11 questions are answered - missing question
  console.log('Test 4: Validates all 11 questions are answered (returns 400 if missing)');
  try {
    const incompleteResponses = { ...VALID_RESPONSES };
    delete incompleteResponses.q5;
    delete incompleteResponses.q9;

    const res = await makeRequest('POST', '/api/assessments', { responses: incompleteResponses }, token);
    if (res.status === 400 && res.body.error === 'Validation failed') {
      console.log('  ✓ PASSED - Returns 400 when questions are missing\n');
      passed++;
    } else {
      console.log(`  ✗ FAILED - Expected 400 validation error, got ${res.status}\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 5: Returns 400 if validation fails (invalid option value)
  console.log('Test 5: Returns 400 if validation fails (invalid option value)');
  try {
    const invalidResponses = { ...VALID_RESPONSES, q2: 'invalid_value' };
    const res = await makeRequest('POST', '/api/assessments', { responses: invalidResponses }, token);
    if (res.status === 400 && res.body.error === 'Validation failed') {
      console.log('  ✓ PASSED - Returns 400 for invalid option value\n');
      passed++;
    } else {
      console.log(`  ✗ FAILED - Expected 400 validation error, got ${res.status}\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 6: Calculates risk score using scoring logic
  console.log('Test 6: Calculates risk score using scoring logic');
  try {
    const res = await makeRequest('POST', '/api/assessments', { responses: VALID_RESPONSES }, token);
    if (res.status === 201 &&
        res.body.assessment.risk_score &&
        res.body.scoring &&
        res.body.scoring.totalScore === res.body.assessment.risk_score) {
      console.log(`  ✓ PASSED - Risk score calculated: ${res.body.assessment.risk_score}\n`);
      passed++;
    } else {
      console.log(`  ✗ FAILED - Risk score not properly calculated\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 7: Saves assessment to database linked to user
  console.log('Test 7: Saves assessment to database linked to user');
  try {
    const res = await makeRequest('POST', '/api/assessments', { responses: VALID_RESPONSES }, token);
    if (res.status === 201 &&
        res.body.assessment.id &&
        res.body.assessment.user_id &&
        res.body.assessment.created_at) {
      console.log(`  ✓ PASSED - Assessment saved with ID: ${res.body.assessment.id}\n`);
      passed++;
    } else {
      console.log(`  ✗ FAILED - Assessment not properly saved to database\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 8: Returns 201 with assessment object including score and risk_level
  console.log('Test 8: Returns 201 with assessment object including score and risk_level');
  try {
    const res = await makeRequest('POST', '/api/assessments', { responses: VALID_RESPONSES }, token);
    if (res.status === 201 &&
        res.body.assessment &&
        typeof res.body.assessment.risk_score === 'number' &&
        typeof res.body.assessment.risk_level === 'string' &&
        res.body.scoring.weakestAreas &&
        res.body.scoring.weakestAreas.length === 3) {
      console.log(`  ✓ PASSED - Returns assessment with score: ${res.body.assessment.risk_score}, level: ${res.body.assessment.risk_level}\n`);
      passed++;
    } else {
      console.log(`  ✗ FAILED - Response missing required fields\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 9: Q4 multiselect validation - must be array
  console.log('Test 9: Q4 multiselect validation - must be array');
  try {
    const invalidQ4 = { ...VALID_RESPONSES, q4: 'hipaa' }; // string instead of array
    const res = await makeRequest('POST', '/api/assessments', { responses: invalidQ4 }, token);
    if (res.status === 400 && res.body.details.some(e => e.includes('q4'))) {
      console.log('  ✓ PASSED - Q4 rejects non-array value\n');
      passed++;
    } else {
      console.log(`  ✗ FAILED - Expected 400 for non-array Q4, got ${res.status}\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 10: Q4 multiselect validation - requires at least one selection
  console.log('Test 10: Q4 multiselect validation - requires at least one selection');
  try {
    const emptyQ4 = { ...VALID_RESPONSES, q4: [] };
    const res = await makeRequest('POST', '/api/assessments', { responses: emptyQ4 }, token);
    if (res.status === 400 && res.body.details.some(e => e.includes('q4'))) {
      console.log('  ✓ PASSED - Q4 rejects empty array\n');
      passed++;
    } else {
      console.log(`  ✗ FAILED - Expected 400 for empty Q4 array, got ${res.status}\n`);
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
