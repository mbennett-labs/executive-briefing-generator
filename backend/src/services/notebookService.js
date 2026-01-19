/**
 * NotebookLM Service
 *
 * Integrates NotebookLM automation with report generation.
 * Queries NotebookLM notebooks to get sourced content for executive briefings.
 */

const { generateNotebookQueries } = require('../prompts/notebooklm-queries');
const { NotebookLMAutomation } = require('../../../scripts/notebooklm-automation');

/**
 * Get sourced content from NotebookLM for an assessment
 *
 * @param {object} assessmentData - Assessment data for query generation
 * @param {string} assessmentData.org_name - Organization name
 * @param {string} assessmentData.org_type - Organization type
 * @param {string} assessmentData.employee_count - Employee count range
 * @param {object} assessmentData.responses - Questionnaire responses
 * @param {number} assessmentData.overall_score - Overall risk score
 * @param {string} assessmentData.risk_level - Risk level (LOW, MODERATE, HIGH, etc.)
 * @returns {Promise<object>} Combined sourced content from all notebooks
 */
async function getSourcedContent(assessmentData) {
  const {
    org_name,
    org_type,
    employee_count,
    responses,
    overall_score,
    risk_level
  } = assessmentData;

  // Build org profile for query generation
  const orgProfile = {
    name: org_name || 'Healthcare Organization',
    type: org_type || 'Hospital',
    size: employee_count || 'unknown'
  };

  console.log('[NotebookService] Generating queries for assessment', {
    org_name: orgProfile.name,
    risk_level,
    timestamp: new Date().toISOString()
  });

  // Generate NotebookLM queries based on assessment
  const queryResult = generateNotebookQueries({
    org_name: orgProfile.name,
    org_type: orgProfile.type,
    employee_count: orgProfile.size,
    responses,
    overall_score,
    risk_level
  });

  const sourcedContent = {
    success: false,
    notebooks: {},
    errors: [],
    queriedAt: new Date().toISOString()
  };

  let automation = null;

  try {
    // Initialize automation
    automation = new NotebookLMAutomation();

    console.log('[NotebookService] Setting up browser automation');
    await automation.setupBrowser();

    console.log('[NotebookService] Authenticating with NotebookLM');
    const authenticated = await automation.authenticateNotebookLM();

    if (!authenticated) {
      throw new Error('NotebookLM authentication failed');
    }

    // Query each notebook
    const notebookQueries = queryResult.queriesByNotebook;

    for (const [notebookId, notebookData] of Object.entries(notebookQueries)) {
      try {
        console.log(`[NotebookService] Querying notebook: ${notebookData.notebook.name}`);

        const response = await automation.queryNotebookLM(notebookData.combinedQuery);

        sourcedContent.notebooks[notebookId] = {
          name: notebookData.notebook.name,
          response: response,
          sections: notebookData.individualQueries.map(q => q.sectionName),
          queriedAt: new Date().toISOString()
        };

        console.log(`[NotebookService] Successfully queried ${notebookData.notebook.name}`);

      } catch (queryError) {
        console.error(`[NotebookService] Failed to query ${notebookId}:`, queryError.message);
        sourcedContent.errors.push({
          notebook: notebookId,
          error: queryError.message
        });
      }
    }

    // Mark success if we got at least one notebook response
    sourcedContent.success = Object.keys(sourcedContent.notebooks).length > 0;

    console.log('[NotebookService] Query complete', {
      notebooksQueried: Object.keys(sourcedContent.notebooks).length,
      errors: sourcedContent.errors.length
    });

  } catch (error) {
    console.error('[NotebookService] Automation failed:', error.message);
    sourcedContent.errors.push({
      notebook: 'automation',
      error: error.message
    });
  } finally {
    // Clean up browser
    if (automation) {
      try {
        await automation.closeBrowser();
      } catch (closeError) {
        console.error('[NotebookService] Error closing browser:', closeError.message);
      }
    }
  }

  return sourcedContent;
}

/**
 * Format sourced content for inclusion in Claude prompt
 *
 * @param {object} sourcedContent - Content from getSourcedContent
 * @returns {string} Formatted string for prompt inclusion
 */
function formatSourcedContentForPrompt(sourcedContent) {
  if (!sourcedContent || !sourcedContent.success) {
    return '';
  }

  const sections = [];

  for (const [notebookId, data] of Object.entries(sourcedContent.notebooks)) {
    if (data.response) {
      sections.push(`
## Sourced Content: ${data.name}
Sections covered: ${data.sections.join(', ')}

${data.response}
`);
    }
  }

  if (sections.length === 0) {
    return '';
  }

  return `
=== NOTEBOOKLM SOURCED CONTENT ===
The following content has been sourced from authoritative references:

${sections.join('\n---\n')}

=== END SOURCED CONTENT ===
`;
}

module.exports = {
  getSourcedContent,
  formatSourcedContentForPrompt
};
