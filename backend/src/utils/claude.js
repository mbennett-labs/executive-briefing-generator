/**
 * Claude API Integration
 *
 * Utility for calling Claude API to generate executive briefing reports.
 * Uses native fetch for reliable HTTP requests.
 */

const { generatePrompt } = require('../prompts/executive-briefing');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 3000;  // Reduced from 8192 to avoid network issues with large requests

/**
 * Generate an executive briefing report using Claude
 *
 * @param {object} assessmentData - Assessment data for report generation
 * @param {string} assessmentData.org_name - Organization name
 * @param {string} assessmentData.org_type - Organization type
 * @param {string} assessmentData.employee_count - Employee count range
 * @param {object} assessmentData.responses - Question responses
 * @param {Array} assessmentData.questions - Question metadata
 * @param {object} assessmentData.category_scores - Category scores
 * @param {number} assessmentData.overall_score - Overall score
 * @param {number} assessmentData.percentile - Percentile ranking
 * @param {object} assessmentData.risk_level - Risk level object
 * @returns {Promise<object>} Generated report sections as JSON
 */
async function generateReport(assessmentData) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  // Generate the prompt
  const prompt = generatePrompt(assessmentData);

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    // Handle API errors
    if (!response.ok) {
      console.error('Claude API error response:', data);

      if (response.status === 401) {
        throw new Error('Invalid ANTHROPIC_API_KEY');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 500) {
        throw new Error('Claude API service error. Please try again.');
      }

      throw new Error(data.error?.message || `API error: ${response.status}`);
    }

    // Extract the text content
    const textContent = data.content?.find(c => c.type === 'text');
    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    // Parse the JSON response
    const reportContent = parseReportContent(textContent.text);

    return {
      success: true,
      report: reportContent,
      usage: {
        input_tokens: data.usage?.input_tokens,
        output_tokens: data.usage?.output_tokens
      }
    };
  } catch (error) {
    console.error('Claude API error:', error);

    // Re-throw with context if it's a network error
    if (error.cause) {
      throw new Error(`Report generation failed: Network error - ${error.cause.message}`);
    }

    throw new Error(`Report generation failed: ${error.message}`);
  }
}

/**
 * Parse the report content from Claude's response
 * Handles both JSON and markdown responses
 *
 * @param {string} text - Raw text from Claude
 * @returns {object} Parsed report sections
 */
function parseReportContent(text) {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate expected sections exist
      const expectedSections = [
        'executive_summary',
        'risk_dashboard',
        'data_sensitivity_analysis',
        'encryption_assessment',
        'compliance_vendor_risk',
        'incident_response',
        'remediation_roadmap',
        'next_steps'
      ];

      const sections = {};
      for (const section of expectedSections) {
        sections[section] = parsed[section] || '';
      }

      return sections;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
    }
  }

  // Fallback: return the raw text as executive summary
  return {
    executive_summary: text,
    risk_dashboard: '',
    data_sensitivity_analysis: '',
    encryption_assessment: '',
    compliance_vendor_risk: '',
    incident_response: '',
    remediation_roadmap: '',
    next_steps: ''
  };
}

module.exports = {
  generateReport,
  parseReportContent
};
