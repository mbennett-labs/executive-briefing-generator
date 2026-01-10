/**
 * API Service
 * Handles all HTTP requests to the backend
 */

const API_BASE = 'https://executive-briefing-generator-production.up.railway.app';

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

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
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
  submitAssessment: (responses) => request('/assessments', {
    method: 'POST',
    body: JSON.stringify({ responses })
  }),

  getAssessments: () => request('/assessments'),

  getAssessment: (id) => request(`/assessments/${id}`),

  // Reports endpoints
  generateReport: (assessmentId) => request(`/reports/${assessmentId}`, {
    method: 'POST'
  }),

  getReport: (assessmentId) => request(`/reports/${assessmentId}`),

  emailReport: (assessmentId) => request(`/reports/${assessmentId}/email`, {
    method: 'POST'
  }),

  // Download report (returns URL for direct download)
  getReportDownloadUrl: (assessmentId) => `/api/reports/${assessmentId}/download`
};

export default api;
