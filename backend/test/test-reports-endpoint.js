/**
 * Test Suite: Reports Endpoint
 * Story-015: Generate report endpoint
 */

const API_BASE = 'http://localhost:3001/api';

// Test data
const testUser = {
  email: `test-reports-${Date.now()}@example.com`,
  password: 'TestPass123!',
  name: 'Reports Tester',
  organization_name: 'Test Hospital'
};

const testUser2 = {
  email: `test-other-${Date.now()}@example.com`,
  password: 'TestPass123!',
  name: 'Other User',
  organization_name: 'Other Org'
};

const sampleResponses = {
  q1: '250k_1m',
  q2: '50_plus_years',
  q3: 'over_60',
  q4: ['hipaa', 'hitech', 'pci_dss'],
  q5: '51_100',
  q6: 'significant',
  q7: 'state',
  q8: 'critical',
  q9: 'one_breach',
  q10: 'minimal',
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

  // Handle PDF responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/pdf')) {
    const buffer = await response.arrayBuffer();
    return { status: response.status, data: null, buffer: Buffer.from(buffer) };
  }

  // Handle non-JSON responses (like HTML error pages)
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    return { status: response.status, data: { error: text.substring(0, 100) }, text };
  }

  const data = await response.json();
  return { status: response.status, data };
}

async function runTests() {
  console.log('\n=== Reports Endpoint Tests ===\n');
  let passed = 0;
  let failed = 0;

  // Setup: Register users and create an assessment
  console.log('Setting up test data...');

  // Register first user
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });

  const loginResult = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testUser.email, password: testUser.password })
  });

  if (!loginResult.data.token) {
    console.error('Failed to login user 1:', loginResult);
    process.exit(1);
  }
  userToken = loginResult.data.token;
  console.log('User 1 logged in');

  // Register second user
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser2)
  });

  const login2Result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testUser2.email, password: testUser2.password })
  });

  if (!login2Result.data.token) {
    console.error('Failed to login user 2:', login2Result);
    process.exit(1);
  }
  user2Token = login2Result.data.token;
  console.log('User 2 logged in');

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
  console.log(`Created test assessment ID: ${assessmentId}\n`);

  // Test 1: Returns 401 if not authenticated
  {
    const result = await request(`/reports/${assessmentId}`, {
      method: 'POST'
    });
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
    const result = await request('/reports/abc', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (result.status === 400 && result.data.error === 'Invalid assessment ID') {
      console.log('✓ Test 2: Returns 400 for invalid assessment ID');
      passed++;
    } else {
      console.log(`✗ Test 2: Expected 400 with "Invalid assessment ID", got ${result.status}: ${result.data?.error}`);
      failed++;
    }
  }

  // Test 3: Returns 404 if assessment not found
  {
    const result = await request('/reports/99999', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (result.status === 404 && result.data.error === 'Assessment not found') {
      console.log('✓ Test 3: Returns 404 if assessment not found');
      passed++;
    } else {
      console.log(`✗ Test 3: Expected 404 with "Assessment not found", got ${result.status}: ${result.data?.error}`);
      failed++;
    }
  }

  // Test 4: Returns 403 if assessment belongs to different user
  {
    const result = await request(`/reports/${assessmentId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    if (result.status === 403 && result.data.error === 'Access denied') {
      console.log('✓ Test 4: Returns 403 if assessment belongs to different user');
      passed++;
    } else {
      console.log(`✗ Test 4: Expected 403 with "Access denied", got ${result.status}: ${result.data?.error}`);
      failed++;
    }
  }

  // Test 5: Returns 200 with report on success
  {
    const result = await request(`/reports/${assessmentId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (result.status === 200 &&
        result.data.report &&
        result.data.download_url) {
      console.log('✓ Test 5: Returns 200 with report on success');
      passed++;
    } else {
      console.log(`✗ Test 5: Expected 200 with report, got ${result.status}`);
      console.log('  Data:', result.data);
      failed++;
    }
  }

  // Test 6: Report record has correct fields
  {
    const result = await request(`/reports/${assessmentId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const report = result.data.report;
    if (report &&
        report.id &&
        report.assessment_id === assessmentId &&
        report.pdf_url &&
        report.email_sent === false &&
        report.created_at) {
      console.log('✓ Test 6: Report record has correct fields');
      passed++;
    } else {
      console.log('✗ Test 6: Report missing required fields');
      console.log('  Got:', report);
      failed++;
    }
  }

  // Test 7: PDF URL is valid format
  {
    const result = await request(`/reports/${assessmentId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const pdfUrl = result.data.download_url;
    if (pdfUrl && pdfUrl.startsWith('/reports/') && pdfUrl.endsWith('.pdf')) {
      console.log('✓ Test 7: PDF URL is valid format');
      passed++;
    } else {
      console.log(`✗ Test 7: Invalid PDF URL format: ${pdfUrl}`);
      failed++;
    }
  }

  // Test 8: Can download PDF via /download endpoint
  {
    const result = await request(`/reports/${assessmentId}/download`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (result.status === 200 &&
        result.buffer &&
        result.buffer.slice(0, 5).toString() === '%PDF-') {
      console.log('✓ Test 8: Can download PDF via /download endpoint');
      passed++;
    } else {
      console.log(`✗ Test 8: Failed to download PDF, status: ${result.status}`);
      failed++;
    }
  }

  // Test 9: Download endpoint returns 403 for other user
  {
    const result = await request(`/reports/${assessmentId}/download`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    if (result.status === 403) {
      console.log('✓ Test 9: Download endpoint returns 403 for other user');
      passed++;
    } else {
      console.log(`✗ Test 9: Expected 403, got ${result.status}`);
      failed++;
    }
  }

  // Test 10: GET /reports/:assessmentId returns existing report
  {
    // First generate a report
    await request(`/reports/${assessmentId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });

    // Then get it
    const result = await request(`/reports/${assessmentId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (result.status === 200 && result.data.report) {
      console.log('✓ Test 10: GET /reports/:assessmentId returns existing report');
      passed++;
    } else {
      console.log(`✗ Test 10: Expected 200 with report, got ${result.status}`);
      failed++;
    }
  }

  // Test 11: GET returns 404 for assessment without report
  {
    // Create a new assessment without generating a report
    const newAssessment = await request('/assessments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ responses: sampleResponses })
    });
    const newAssessmentId = newAssessment.data.assessment.id;

    const result = await request(`/reports/${newAssessmentId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (result.status === 404) {
      console.log('✓ Test 11: GET returns 404 for assessment without report');
      passed++;
    } else {
      console.log(`✗ Test 11: Expected 404, got ${result.status}`);
      failed++;
    }
  }

  // Test 12: Download endpoint returns 401 without auth
  {
    const result = await request(`/reports/${assessmentId}/download`);
    if (result.status === 401) {
      console.log('✓ Test 12: Download endpoint returns 401 without auth');
      passed++;
    } else {
      console.log(`✗ Test 12: Expected 401, got ${result.status}`);
      failed++;
    }
  }

  // Summary
  console.log(`\n=== Results: ${passed}/${passed + failed} tests passed ===\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
