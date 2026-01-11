/**
 * Claude API Integration
 *
 * Utility for calling Claude API to generate executive briefing reports.
 * Uses the Anthropic SDK with claude-3-5-sonnet model.
 */

const Anthropic = require('@anthropic-ai/sdk');
const { generatePrompt } = require('../prompts/executive-briefing');

// Initialize Anthropic client (uses ANTHROPIC_API_KEY env var by default)
let anthropicClient = null;

function getClient() {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

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
  const client = getClient();

  // Generate the prompt
  const prompt = generatePrompt(assessmentData);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract the text content
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    // Parse the JSON response
    const reportContent = parseReportContent(textContent.text);

    return {
      success: true,
      report: reportContent,
      usage: {
        input_tokens: response.usage?.input_tokens,
        output_tokens: response.usage?.output_tokens
      }
    };
  } catch (error) {
    console.error('Claude API error:', error);

    // Handle specific error types
    if (error.status === 401) {
      throw new Error('Invalid ANTHROPIC_API_KEY');
    }
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (error.status === 500) {
      throw new Error('Claude API service error. Please try again.');
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
