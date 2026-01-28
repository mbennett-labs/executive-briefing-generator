/**
 * Query Builder Service
 * Transforms questionnaire answers into targeted NotebookLM queries
 *
 * Answer keys are numeric strings: "1", "2", "3", etc.
 *
 * Question Mapping:
 * Data Sensitivity (Q1-8): "1"-"8"
 * Encryption (Q9-16): "9"-"16"
 * Compliance (Q17-24): "17"-"24"
 * Vendor Risk (Q25-32): "25"-"32"
 * Incident Response (Q33-40): "33"-"40"
 * Quantum Readiness (Q41-48): "41"-"48"
 */

const NOTEBOOKS = {
  QSL_QUANTUM: {
    name: 'QSL Quantum Security Research',
    url: 'https://notebooklm.google.com/notebook/b0ce9862-9ed3-486c-8e5c-b8743383d3a7'
  },
  NIST_PQC: {
    name: 'NIST PQC Standards',
    url: 'https://notebooklm.google.com/notebook/4a20d5d3-57a4-4ac6-bba1-fc182464a0a9'
  },
  HHS_HIPAA: {
    name: 'HHS HIPAA Portal',
    url: 'https://notebooklm.google.com/notebook/7a181258-6d88-4ec7-a92a-441f76731318'
  }
};

/**
 * Helper to format array or string values
 */
function formatAnswer(value, fallback = 'Not specified') {
  if (!value) return fallback;
  if (Array.isArray(value)) return value.join(', ');
  return value;
}

/**
 * Build Query 1: Data Sensitivity & HNDL Threat Analysis
 */
function buildDataSensitivityQuery(answers, orgProfile) {
  // Data Sensitivity questions use keys "1" through "8"
  const phiTypes = answers['1'] || 'Not specified';           // PHI types (array)
  const recordCount = answers['2'] || 'Not specified';        // Record count
  const retention = answers['3'] || 'Not specified';          // Retention period
  const longTermSensitive = answers['4'] || 'Unknown';        // Long-term sensitive (Yes/No)
  const classification = answers['5'] || 'Unknown';           // Classification maturity
  const dataMapped = answers['6'] || 'Unknown';               // Data mapped
  const accessLevel = answers['7'] || 'Unknown';              // Access level
  const dataInventory = answers['8'] || 'Unknown';            // Data inventory

  // Identify high-risk PHI types
  const highRiskTypes = ['Genetic data', 'Mental health', 'Substance abuse', 'HIV status'];
  const phiArray = Array.isArray(phiTypes) ? phiTypes : [];
  const hasHighRiskPHI = phiArray.some(t => highRiskTypes.includes(t));

  let query = `I'm preparing an executive briefing for a healthcare organization with these specific data characteristics:

ORGANIZATION PROFILE:
- Name: ${orgProfile.name || 'Healthcare Organization'}
- Type: ${orgProfile.type || 'Healthcare Provider'}
- Size: ${orgProfile.employee_count || 'Not specified'} employees
- Patient Records: ${recordCount}
- Data Retention Requirement: ${retention}

DATA SENSITIVITY FINDINGS:
- PHI Types Stored: ${formatAnswer(phiTypes)}
- Long-term sensitive data stored: ${longTermSensitive}
- Data classification maturity: ${classification}
- Data mapping status: ${dataMapped}
- Access controls: ${accessLevel}
- Data inventory: ${dataInventory}

Based on these SPECIFIC characteristics, analyze:

1. **HNDL Exposure Window**: Given their ${retention} retention period, when does their currently-encrypted data become vulnerable to quantum decryption? Calculate the specific timeline.

2. **Data Type Risk Ranking**: Which of their PHI types create the MOST long-term exposure? Rank and explain.`;

  if (hasHighRiskPHI) {
    query += `

3. **Lifetime Sensitivity Analysis**: They store high-risk data types (${phiArray.filter(t => highRiskTypes.includes(t)).join(', ')}). Explain why these create exceptional "harvest now, decrypt later" risk compared to changeable data like credit cards.`;
  }

  query += `

4. **Healthcare-Specific Context**: How do healthcare data retention requirements amplify quantum risk compared to other industries?

Be specific to their situation. Reference sources where possible. Write for a CISO audience.`;

  return {
    id: 'data_sensitivity',
    title: 'Data Sensitivity & HNDL Threat Analysis',
    notebook: NOTEBOOKS.QSL_QUANTUM,
    query: query,
    category: 'data_sensitivity'
  };
}

/**
 * Build Query 2: Encryption & Technical Migration Roadmap
 */
function buildEncryptionQuery(answers, orgProfile) {
  // Encryption questions use keys "9" through "16"
  const atRest = answers['9'] || 'Unknown';                   // Encryption at rest (array)
  const keyExchange = answers['10'] || 'Unknown';             // Key exchange algorithms (array)
  const tlsVersions = answers['11'] || 'Unknown';             // TLS versions (array)
  const kmsType = answers['12'] || 'Unknown';                 // KMS type
  const cryptoInventory = answers['13'] || 'Unknown';         // Crypto inventory status
  const algorithmStandards = answers['14'] || 'Unknown';      // Algorithm standards
  const pqcTesting = answers['15'] || 'No';                   // PQC testing status
  const vulnerablePercent = answers['16'] || 'Unknown';       // Vulnerable percentage

  const query = `I need technical migration guidance for a healthcare organization:

CURRENT ENCRYPTION STATE:
- Organization: ${orgProfile.name || 'Healthcare Organization'}
- Data at rest encryption: ${formatAnswer(atRest)}
- Key exchange algorithms: ${formatAnswer(keyExchange)}
- TLS versions: ${formatAnswer(tlsVersions)}
- Key Management System: ${kmsType}
- Cryptographic inventory status: ${cryptoInventory}
- Algorithm standards followed: ${algorithmStandards}
- PQC testing status: ${pqcTesting}
- Estimated quantum-vulnerable systems: ${vulnerablePercent}

Based on this technical profile, provide:

1. **Vulnerability Assessment**: Which algorithms in their stack are vulnerable to Shor's vs Grover's algorithm? Practical difference for priority?

2. **NIST Standards Application**: Which NIST PQC standard (FIPS 203, 204, 205) addresses each vulnerable algorithm? What replaces ${formatAnswer(keyExchange)}?

3. **Migration Priority**: Given ${vulnerablePercent} vulnerable and ${cryptoInventory} inventory status, what's the migration sequence?

4. **Infrastructure Gaps**: ${cryptoInventory === 'No' || cryptoInventory === 'None' ? 'They lack a cryptographic inventory. What must they build first?' : 'How should they leverage their existing infrastructure?'}

5. **Next Steps**: ${pqcTesting === 'No' || pqcTesting === 'Not started' ? 'They haven\'t begun PQC testing. What are the first 3 technical steps for the next 90 days?' : 'How do they move from testing to production?'}

6. **Hybrid Cryptography**: Should they implement hybrid mode during transition?

Reference NIST guidance and industry timelines. Be technically specific.`;

  return {
    id: 'encryption',
    title: 'Encryption & Technical Migration Roadmap',
    notebook: NOTEBOOKS.NIST_PQC,
    query: query,
    category: 'encryption'
  };
}

/**
 * Build Query 3: Compliance Gap Analysis
 */
function buildComplianceQuery(answers, orgProfile) {
  // Compliance questions use keys "17" through "24"
  const regulations = answers['17'] || 'HIPAA';               // Regulations (array)
  const hasComplianceProgram = answers['18'] || 'Unknown';    // Has compliance program
  const lastHIPAA = answers['19'] || 'Unknown';               // Last HIPAA assessment
  const baaStatus = answers['20'] || 'Unknown';               // BAA status
  const reviewFrequency = answers['21'] || 'Unknown';         // Review frequency
  const auditReadiness = answers['22'] || 'Unknown';          // Audit readiness
  const complianceLevel = answers['23'] || 'Unknown';         // Compliance level
  const documentationStatus = answers['24'] || 'Unknown';     // Documentation status

  const query = `I need HIPAA compliance guidance for a healthcare organization:

COMPLIANCE PROFILE:
- Organization: ${orgProfile.name || 'Healthcare Organization'}
- Applicable regulations: ${formatAnswer(regulations)}
- Formal compliance program: ${hasComplianceProgram}
- Last HIPAA Security Risk Assessment: ${lastHIPAA}
- BAA encryption requirements: ${baaStatus}
- Compliance review frequency: ${reviewFrequency}
- Audit readiness: ${auditReadiness}
- Current compliance level: ${complianceLevel}
- Documentation status: ${documentationStatus}

Based on this compliance posture, provide:

1. **HIPAA Security Rule Requirements**: Specific cryptographic control requirements for their situation. Reference actual regulatory text.

2. **Assessment Gap**: Their last assessment was ${lastHIPAA}. What compliance implications and likely audit findings?

3. **BAA Exposure**: With BAA status "${baaStatus}", what happens when vendor encryption becomes quantum-vulnerable?

4. **Post-Quantum Compliance**: Current PQC regulatory requirements? What should they document NOW for due diligence?

5. **Audit Preparation**: They're "${auditReadiness}" for audit. What documentation should they prepare for emerging cryptographic risks?

Reference HHS guidance, OCR enforcement, and HIPAA requirements.`;

  return {
    id: 'compliance',
    title: 'HIPAA Compliance Gap Analysis',
    notebook: NOTEBOOKS.HHS_HIPAA,
    query: query,
    category: 'compliance'
  };
}

/**
 * Build Query 4: Executive Synthesis
 */
function buildExecutiveSynthesisQuery(answers, orgProfile, scores) {
  const overallScore = scores?.overall || 50;
  const riskLevel = overallScore < 30 ? 'CRITICAL' : overallScore < 50 ? 'HIGH' : overallScore < 70 ? 'MODERATE' : 'LOW';

  // Build key findings from answers
  // Using numeric keys for quantum readiness questions (Q41-48)
  const keyFindings = [];

  // Check retention period (Q3)
  const retention = answers['3'] || '';
  if (retention.includes('30') || retention.includes('50') || retention.toLowerCase().includes('permanent')) {
    keyFindings.push('Extended data retention creates exceptional HNDL exposure');
  }

  // Check vulnerable percentage (Q16)
  const vulnerable = answers['16'] || '';
  if (vulnerable.includes('75') || vulnerable.includes('100') || vulnerable.toLowerCase().includes('most') || vulnerable.toLowerCase().includes('all')) {
    keyFindings.push('Majority of systems use quantum-vulnerable encryption');
  }

  // Check PQC roadmap (Q46 - assuming quantum readiness)
  const pqcRoadmap = answers['46'] || '';
  if (pqcRoadmap === 'No' || pqcRoadmap.toLowerCase().includes('no')) {
    keyFindings.push('No post-quantum cryptography migration roadmap exists');
  }

  // Check leadership awareness (Q41)
  const leadershipAwareness = answers['41'] || '';
  if (leadershipAwareness.toLowerCase().includes('not aware') || leadershipAwareness === 'No') {
    keyFindings.push('Executive leadership is not aware of quantum threats');
  }

  // Check HNDL monitoring (Q44 - assuming)
  const hndlMonitoring = answers['44'] || '';
  if (hndlMonitoring === 'No' || hndlMonitoring.toLowerCase().includes('no')) {
    keyFindings.push('No monitoring for "harvest now, decrypt later" attacks');
  }

  // Check PQC testing (Q15)
  const pqcTesting = answers['15'] || '';
  if (pqcTesting === 'No' || pqcTesting.toLowerCase().includes('not started')) {
    keyFindings.push('No PQC testing or evaluation has begun');
  }

  const query = `I need to synthesize an executive summary for a healthcare CISO:

ORGANIZATION:
- Name: ${orgProfile.name || 'Healthcare Organization'}
- Type: ${orgProfile.type || 'Healthcare Provider'}
- Size: ${orgProfile.employee_count || 'Not specified'} employees

ASSESSMENT RESULTS:
- Overall Risk Score: ${overallScore}/100 (${riskLevel} RISK)
- Data Sensitivity Score: ${scores?.data_sensitivity || 'N/A'}/100
- Encryption Score: ${scores?.encryption || 'N/A'}/100
- Compliance Score: ${scores?.compliance || 'N/A'}/100
- Vendor Risk Score: ${scores?.vendor_risk || 'N/A'}/100
- Incident Response Score: ${scores?.incident_response || 'N/A'}/100
- Quantum Readiness Score: ${scores?.quantum_readiness || 'N/A'}/100

KEY FINDINGS:
${keyFindings.length > 0 ? keyFindings.map((f, i) => `${i + 1}. ${f}`).join('\n') : '- Assessment data pending'}

Provide an executive-level synthesis:

1. **The "So What"**: Why should ${orgProfile.name || 'their'} board care NOW? Business case in 2-3 sentences.

2. **Single Most Important Action**: ONE thing this quarter. Be specific.

3. **Timeline Urgency**: When must migration be COMPLETED given their risk level?

4. **Budget Framework**: Realistic budget range for their size. Break into phases.

5. **Communication Strategy**: How to communicate urgency without panic? Analogies for non-technical execs?

6. **Quick Wins**: 2-3 things achievable in 30 days.

Write for C-suite. Direct about risk, constructive about solutions.`;

  return {
    id: 'executive_synthesis',
    title: 'Executive Synthesis & Recommendations',
    notebook: NOTEBOOKS.QSL_QUANTUM,
    query: query,
    category: 'synthesis'
  };
}

/**
 * Main function: Generate all queries for an assessment
 */
function generateAllQueries(assessmentData) {
  const { answers, orgProfile, scores } = assessmentData;

  return {
    queries: [
      buildDataSensitivityQuery(answers || {}, orgProfile || {}),
      buildEncryptionQuery(answers || {}, orgProfile || {}),
      buildComplianceQuery(answers || {}, orgProfile || {}),
      buildExecutiveSynthesisQuery(answers || {}, orgProfile || {}, scores)
    ],
    generatedAt: new Date().toISOString(),
    assessmentId: assessmentData.id
  };
}

module.exports = {
  generateAllQueries,
  buildDataSensitivityQuery,
  buildEncryptionQuery,
  buildComplianceQuery,
  buildExecutiveSynthesisQuery,
  NOTEBOOKS
};
