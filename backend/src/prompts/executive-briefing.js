/**
 * Executive Briefing Prompt Template
 *
 * This prompt template generates personalized post-quantum security
 * executive briefings based on assessment responses and scores.
 *
 * Enhanced with NotebookLM synthesis integration for targeted,
 * research-backed content from curated sources.
 */

const CATEGORY_NAMES = {
  data_sensitivity: 'Data Sensitivity',
  encryption: 'Encryption Infrastructure',
  compliance: 'Compliance',
  vendor_risk: 'Vendor Risk',
  incident_response: 'Incident Response',
  quantum_readiness: 'Quantum Readiness'
};

// NotebookLM source descriptions for context
const NOTEBOOK_SOURCES = {
  qsl_quantum_security: {
    name: 'QSL Quantum Security Research',
    description: 'Quantum Shield Labs playbook, industry research, and threat timelines'
  },
  hhs_hipaa: {
    name: 'HHS HIPAA Compliance',
    description: 'HHS regulations, HIPAA compliance guidance, and healthcare security standards'
  },
  nist_pqc: {
    name: 'NIST PQC Standards',
    description: 'NIST FIPS 203/204/205, post-quantum cryptography standards, and migration guidance'
  }
};

/**
 * Generate the executive briefing prompt
 * @param {object} params - Assessment parameters
 * @param {string} params.org_name - Organization name
 * @param {string} params.org_type - Organization type (Hospital, Clinic, etc.)
 * @param {string} params.employee_count - Employee count range
 * @param {object} params.responses - Question responses keyed by question ID
 * @param {object} params.questions - Questions with text and options
 * @param {object} params.category_scores - Scores per category (0-100)
 * @param {number} params.overall_score - Overall assessment score (0-100)
 * @param {number} params.percentile - Percentile ranking vs industry
 * @param {object} params.risk_level - Risk level object with level and color
 * @param {object} [params.notebooklm_synthesis] - Optional synthesis from NotebookLM sources
 * @returns {string} The complete prompt for Claude
 */
function generatePrompt(params) {
  const {
    org_name,
    org_type,
    employee_count,
    responses,
    questions,
    category_scores,
    overall_score,
    percentile,
    risk_level,
    notebooklm_synthesis
  } = params;

  // Format responses for the prompt
  const formattedResponses = formatResponses(responses, questions);

  // Format category scores
  const formattedScores = Object.entries(category_scores)
    .map(([cat, score]) => `- ${CATEGORY_NAMES[cat]}: ${score}/100`)
    .join('\n');

  // Format NotebookLM synthesis if provided
  const synthesisSection = formatNotebookSynthesis(notebooklm_synthesis);
  const hasSynthesis = synthesisSection.length > 0;

  return `You are a post-quantum cryptography security expert creating a personalized executive briefing for a healthcare organization. Generate a comprehensive, actionable report based on the assessment data provided.${hasSynthesis ? '\n\n**IMPORTANT**: You have been provided with targeted research synthesis from curated NotebookLM sources. Use this synthesis to provide SPECIFIC, RESEARCH-BACKED recommendations rather than generic advice. Reference specific findings, statistics, and recommendations from the synthesis.' : ''}

## ORGANIZATION PROFILE
- Organization Name: ${org_name}
- Organization Type: ${org_type}
- Employee Count: ${employee_count}

## ASSESSMENT RESULTS
Overall Risk Score: ${overall_score}/100 (${risk_level.level})
Industry Percentile: ${percentile}th percentile

### Category Scores:
${formattedScores}

## DETAILED RESPONSES
${formattedResponses}
${synthesisSection}
## DOMAIN KNOWLEDGE - POST-QUANTUM CRYPTOGRAPHY

### The Quantum Threat
- Cryptographically Relevant Quantum Computers (CRQCs) are expected within 10-15 years
- "Harvest Now, Decrypt Later" (HNDL) attacks mean data stolen today can be decrypted when quantum computers arrive
- Healthcare data with long-term sensitivity (genetic, pediatric, mental health) is especially vulnerable
- NIST has standardized ML-KEM, ML-DSA, and SLH-DSA as post-quantum cryptographic algorithms

### Key Vulnerabilities
- RSA, ECC, and Diffie-Hellman key exchange are all vulnerable to Shor's algorithm
- AES-256 remains quantum-safe but key exchange mechanisms are vulnerable
- TLS 1.2/1.3 handshakes using ECDH are vulnerable during key exchange
- Most healthcare organizations have significant exposure through vendor dependencies

### Regulatory Landscape
- HIPAA requires "reasonable and appropriate" safeguards - PQC will become the standard
- NSM-10 mandates federal systems transition to PQC by 2035
- Industry expects healthcare-specific PQC guidance within 2-3 years
- Early adopters will have competitive advantage in vendor and partner relationships

## REPORT REQUIREMENTS

Generate an 8-section executive briefing with the following structure:

### 1. EXECUTIVE SUMMARY (1 page)
- Opening statement on quantum risk specific to ${org_name}
- Key risk score interpretation and percentile ranking
- 3 most critical findings from the assessment
- Business impact summary (consider ${org_type} context)
- Urgent call to action with timeline

### 2. RISK DASHBOARD
- Visual description of overall risk gauge
- Category-by-category risk breakdown
- Comparison to industry benchmarks
- Areas of strength (scores above industry average)
- Areas requiring immediate attention (lowest scoring categories)

### 3. DATA SENSITIVITY ANALYSIS
- Summary of PHI types and volume at risk
- Long-term data sensitivity assessment
- Data classification system evaluation
- Specific recommendations for data protection

### 4. ENCRYPTION INFRASTRUCTURE ASSESSMENT
- Current encryption standards evaluation
- Key management practices review
- Cryptographic inventory status
- PQC readiness of current infrastructure
- Specific vulnerabilities identified

### 5. COMPLIANCE AND VENDOR RISK
- Regulatory framework analysis
- Current compliance gaps related to cryptography
- Vendor risk exposure assessment
- Third-party PQC readiness concerns
- Contract and BAA recommendations

### 6. INCIDENT RESPONSE READINESS
- Current IR capability assessment
- Crypto-specific incident preparedness
- Recovery capability evaluation
- Recommendations for improvement

### 7. REMEDIATION ROADMAP
Generate a phased approach:
- **Phase 1 (0-6 months)**: Critical immediate actions
- **Phase 2 (6-12 months)**: Foundation building
- **Phase 3 (12-24 months)**: Full PQC implementation
- Include specific, actionable steps for each phase
- Prioritize based on assessment responses

### 8. NEXT STEPS AND RESOURCES
- Immediate actions (next 30 days)
- Key stakeholder engagement recommendations
- Budget considerations
- Recommended partnerships and resources
- Timeline for follow-up assessment

## OUTPUT FORMAT

Return your response as a JSON object with the following structure:
{
  "executive_summary": "...",
  "risk_dashboard": "...",
  "data_sensitivity_analysis": "...",
  "encryption_assessment": "...",
  "compliance_vendor_risk": "...",
  "incident_response": "...",
  "remediation_roadmap": "...",
  "next_steps": "..."
}

Each section should use Markdown formatting for headers, bullet points, and emphasis. Be specific and actionable, referencing the actual assessment responses. The tone should be:
- Executive-level (assume C-suite audience)
- Urgent but not alarmist
- Technically accurate but accessible
- Personalized to ${org_name} and ${org_type} context

Generate the complete executive briefing now.`;
}

/**
 * Format responses for inclusion in the prompt
 * @param {object} responses - Question responses
 * @param {Array} questions - Question metadata
 * @returns {string} Formatted response text
 */
function formatResponses(responses, questions) {
  const grouped = {};

  for (const question of questions) {
    const category = question.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }

    const response = responses[question.id];
    const formattedResponse = Array.isArray(response)
      ? response.join(', ')
      : response || 'No response';

    grouped[category].push({
      question: question.question_text,
      response: formattedResponse
    });
  }

  let output = '';
  for (const [category, qas] of Object.entries(grouped)) {
    output += `\n### ${CATEGORY_NAMES[category] || category}\n`;
    for (const qa of qas) {
      output += `Q: ${qa.question}\nA: ${qa.response}\n\n`;
    }
  }

  return output;
}

/**
 * Format NotebookLM synthesis for inclusion in the prompt
 * @param {object} synthesis - Synthesis responses from NotebookLM sources
 * @returns {string} Formatted synthesis text
 */
function formatNotebookSynthesis(synthesis) {
  if (!synthesis || typeof synthesis !== 'object') {
    return '';
  }

  const entries = Object.entries(synthesis).filter(([_, value]) => value && value.trim());

  if (entries.length === 0) {
    return '';
  }

  let output = '\n## NOTEBOOKLM RESEARCH SYNTHESIS\n\n';
  output += '**The following research synthesis has been generated from curated sources specific to this organization\'s profile. Use these findings to inform your recommendations.**\n\n';

  for (const [sourceKey, content] of entries) {
    const source = NOTEBOOK_SOURCES[sourceKey];
    const sourceName = source ? source.name : sourceKey;
    const sourceDesc = source ? ` (${source.description})` : '';

    output += `### ${sourceName}${sourceDesc}\n\n`;
    output += content.trim();
    output += '\n\n';
  }

  output += '---\n\n';
  output += '**Instructions**: Incorporate the above research synthesis into your executive briefing. Reference specific findings, statistics, timelines, and recommendations from the synthesis. Do NOT use generic advice - use the specific insights provided above.\n\n';

  return output;
}

module.exports = {
  generatePrompt,
  formatNotebookSynthesis,
  formatResponses,
  CATEGORY_NAMES
};
