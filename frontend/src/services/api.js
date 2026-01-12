/**
 * API Service
 * Handles all HTTP requests to the backend
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://executive-briefing-generator-production.up.railway.app/api';
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  console.log(`[API] ${options.method || 'GET'} ${endpoint}`);

  let response;
  try {
    response = await fetch(url, config);
  } catch (fetchError) {
    console.error('[API] Network error:', fetchError);
    const error = new Error('Network error: ' + fetchError.message);
    error.status = 0;
    error.data = { error: 'Network error' };
    throw error;
  }

  console.log(`[API] Response status: ${response.status}`);

  let data;
  try {
    data = await response.json();
    console.log('[API] Response data:', data);
  } catch (parseError) {
    console.error('[API] JSON parse error:', parseError);
    const error = new Error('Invalid response format');
    error.status = response.status;
    error.data = { error: 'Invalid JSON response' };
    throw error;
  }

  if (!response.ok) {
    console.error('[API] Error response:', { status: response.status, data });
    const error = new Error(data.error || 'An error occurred');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth endpoints
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),

  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),

  // Questions endpoint
  getQuestions: () => request('/questions'),

  // Assessments endpoints
  submitAssessment: (data) => request('/assessments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  getAssessments: () => request('/assessments'),

  getAssessment: (id) => request(`/assessments/${id}`),

  // Reports endpoints
  generateReport: (assessmentId) => request(`/reports/${assessmentId}/generate`, {
    method: 'POST'
  }),

  // Poll for job status (background job pattern)
  getJobStatus: (jobId) => request(`/reports/job/${jobId}`),

  getReport: (assessmentId) => request(`/reports/${assessmentId}`),

  emailReport: (assessmentId) => request(`/reports/${assessmentId}/email`, {
    method: 'POST'
  }),

  // Download report (returns URL for direct download)
  getReportDownloadUrl: (assessmentId) => `${API_BASE}/reports/${assessmentId}/download`
};

export default api;
