/**
 * Test Suite: GET /api/assessments/:id - Get Single Assessment
 * Story-012 backend support
 */

const API_BASE = 'http://localhost:3001/api';

// Test data
const testUser = {
  email: `test-single-${Date.now()}@example.com`,
  password: 'TestPass123!',
  name: 'Single Assessment Tester',
  organization_name: 'Test Org'
};

const testUser2 = {
  email: `test-other-${Date.now()}@example.com`,
  password: 'TestPass123!',
  name: 'Other User',
  organization_name: 'Other Org'
};

const sampleResponses = {
  q1: '50k_250k',
  q2: '50_plus_years',
  q3: 'over_60',
  q4: ['hipaa', 'hitech', 'pci_dss'],
  q5: '51_100',
  q6: 'significant',
  q7: 'federal',
  q8: 'critical',
  q9: 'major',
  q10: 'none',
  q11: 'unknown'
};

let userToken = null;
let user2Token = null;
let assessmentId = null;

async function request(endpoint, options = {}) {
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  if (options.body) {
    config.body = options.body;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();
  return { status: response.status, data };
}

async function runTests() {
  console.log('\\n=== GET /api/assessments/:id Tests ===\\n');
  let passed = 0;
  let failed = 0;

  // Setup: Register users and create an assessment
  console.log('Setting up test data...');

  // Register first user
  const regResult = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  console.log('Register user 1:', regResult.status);

  const loginResult = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testUser.email, password: testUser.password })
  });

  if (!loginResult.data.token) {
    console.error('Failed to login user 1:', loginResult);
    process.exit(1);
  }
  userToken = loginResult.data.token;
  console.log('Login user 1: success');

  // Register second user
  const reg2Result = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser2)
  });
  console.log('Register user 2:', reg2Result.status);

  const login2Result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testUser2.email, password: testUser2.password })
  });

  if (!login2Result.data.token) {
    console.error('Failed to login user 2:', login2Result);
    process.exit(1);
  }
  user2Token = login2Result.data.token;
  console.log('Login user 2: success');

  // Create an assessment
  const assessmentResult = await request('/assessments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ responses: sampleResponses })
  });

  if (!assessmentResult.data.assessment) {
    console.error('Failed to create assessment:', assessmentResult);
    process.exit(1);
  }

  assessmentId = assessmentResult.data.assessment.id;
  console.log(`Created test assessment ID: ${assessmentId}\\n`);

  // Test 1: Returns 401 if not authenticated
  {
    const result = await request(`/assessments/${assessmentId}`);
    if (result.status === 401) {
      console.log('✓ Test 1: Returns 401 if not authenticated');
      passed++;
    } else {
      console.log(`✗ Test 1: Expected 401, got ${result.status}`);
      failed++;
    }
  }

  // Test 2: Returns 400 for invalid assessment ID
  {
    const result = await request('/assessments/abc', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (result.status === 400 && result.data.error === 'Invalid assessment ID') {
      console.log('✓ Test 2: Returns 400 for invalid assessment ID');
      passed++;
    } else {
      console.log(`✗ Test 2: Expected 400 with "Invalid assessment ID", got ${result.status}: ${result.data.error}`);
      failed++;
    }
  }

  // Test 3: Returns 404 if assessment not found
  {
    const result = await request('/assessments/99999', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (result.status === 404 && result.data.error === 'Assessment not found') {
      console.log('✓ Test 3: Returns 404 if assessment not found');
      passed++;
    } else {
      console.log(`✗ Test 3: Expected 404 with "Assessment not found", got ${result.status}: ${result.data.error}`);
      failed++;
    }
  }

  // Test 4: Returns 403 if assessment belongs to different user
  {
    const result = await request(`/assessments/${assessmentId}`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    if (result.status === 403 && result.data.error === 'Access denied') {
      console.log('✓ Test 4: Returns 403 if assessment belongs to different user');
      passed++;
    } else {
      console.log(`✗ Test 4: Expected 403 with "Access denied", got ${result.status}: ${result.data.error}`);
      failed++;
    }
  }

  // Test 5: Returns 200 with assessment and scoring for owner
  {
    const result = await request(`/assessments/${assessmentId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (result.status === 200 && result.data.assessment && result.data.scoring) {
      console.log('✓ Test 5: Returns 200 with assessment and scoring for owner');
      passed++;
    } else {
      console.log(`✗ Test 5: Expected 200 with assessment and scoring, got ${result.status}`);
      failed++;
    }
  }

  // Test 6: Assessment object has correct fields
  {
    const result = await request(`/assessments/${assessmentId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const a = result.data.assessment;
    if (a.id && a.user_id && a.responses && a.risk_score && a.risk_level && a.created_at) {
      console.log('✓ Test 6: Assessment object has correct fields');
      passed++;
    } else {
      console.log('✗ Test 6: Assessment missing required fields');
      console.log('  Got:', Object.keys(a));
      failed++;
    }
  }

  // Test 7: Scoring object has correct fields
  {
    const result = await request(`/assessments/${assessmentId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const s = result.data.scoring;
    if (s.totalScore && s.riskLevel && s.riskColor && s.urgency && Array.isArray(s.weakestAreas)) {
      console.log('✓ Test 7: Scoring object has correct fields');
      passed++;
    } else {
      console.log('✗ Test 7: Scoring missing required fields');
      console.log('  Got:', Object.keys(s));
      failed++;
    }
  }

  // Test 8: Weakest areas have question details
  {
    const result = await request(`/assessments/${assessmentId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const weakest = result.data.scoring.weakestAreas;
    if (weakest.length === 3 && weakest[0].questionId && weakest[0].question && weakest[0].score) {
      console.log('✓ Test 8: Weakest areas have question details');
      passed++;
    } else {
      console.log('✗ Test 8: Weakest areas missing details');
      console.log('  Got:', weakest);
      failed++;
    }
  }

  // Summary
  console.log(`\\n=== Results: ${passed}/${passed + failed} tests passed ===\\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
