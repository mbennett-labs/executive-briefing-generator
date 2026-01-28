/**
 * Query Builder Service
 * Transforms questionnaire answers into targeted NotebookLM queries
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
 * Build Query 1: Data Sensitivity & HNDL Threat Analysis
 */
function buildDataSensitivityQuery(answers, orgProfile) {
  // Extract relevant answers
  const phiTypes = answers.q1_phi_types || answers.data_sensitivity?.q1 || 'Not specified';
  const recordCount = answers.q2_record_count || answers.data_sensitivity?.q2 || 'Not specified';
  const retention = answers.q3_retention_period || answers.data_sensitivity?.q3 || 'Not specified';
  const longTermSensitive = answers.q4_long_term_sensitive || answers.data_sensitivity?.q4 || 'Unknown';
  const classification = answers.q5_classification || answers.data_sensitivity?.q5 || 'Unknown';
  const accessCount = answers.q6_access_count || answers.data_sensitivity?.q6 || 'Unknown';

  // Identify high-risk PHI types
  const highRiskTypes = ['Genetic data', 'Mental health', 'Substance abuse', 'HIV status'];
  const hasHighRiskPHI = Array.isArray(phiTypes)
    ? phiTypes.some(t => highRiskTypes.includes(t))
    : false;

  let query = `I'm preparing an executive briefing for a healthcare organization with these specific data characteristics:

ORGANIZATION PROFILE:
- Name: ${orgProfile.name || 'Healthcare Organization'}
- Type: ${orgProfile.type || 'Healthcare Provider'}
- Size: ${orgProfile.employee_count || 'Not specified'} employees
- Patient Records: ${recordCount}
- Data Retention Requirement: ${retention}

DATA SENSITIVITY FINDINGS:
- PHI Types Stored: ${Array.isArray(phiTypes) ? phiTypes.join(', ') : phiTypes}
- Long-term sensitive data stored: ${longTermSensitive}
- Data classification maturity: ${classification}
- People with access to sensitive data: ${accessCount}

Based on these SPECIFIC characteristics, analyze:

1. **HNDL Exposure Window**: Given their ${retention} retention period, when does their currently-encrypted data become vulnerable to quantum decryption? Calculate the specific timeline.

2. **Data Type Risk Ranking**: Which of their PHI types create the MOST long-term exposure? Rank and explain.`;

  if (hasHighRiskPHI) {
    query += `

3. **Lifetime Sensitivity Analysis**: They store high-risk data types. Explain why these create exceptional "harvest now, decrypt later" risk compared to changeable data like credit cards.`;
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
  const atRest = answers.q9_encryption_at_rest || answers.encryption?.q9 || 'Unknown';
  const inTransit = answers.q10_encryption_in_transit || answers.encryption?.q10 || 'Unknown';
  const keyExchange = answers.q11_key_exchange || answers.encryption?.q11 || 'Unknown';
  const hasKMS = answers.q12_kms || answers.encryption?.q12 || 'Unknown';
  const hasInventory = answers.q14_crypto_inventory || answers.encryption?.q14 || 'Unknown';
  const pqcTesting = answers.q15_pqc_testing || answers.encryption?.q15 || 'No';
  const vulnerablePercent = answers.q16_vulnerable_percentage || answers.encryption?.q16 || 'Unknown';

  const query = `I need technical migration guidance for a healthcare organization:

CURRENT ENCRYPTION STATE:
- Organization: ${orgProfile.name || 'Healthcare Organization'}
- Data at rest: ${atRest}
- Data in transit: ${inTransit}
- Key exchange algorithms: ${keyExchange}
- Centralized KMS: ${hasKMS}
- Complete cryptographic inventory: ${hasInventory}
- PQC testing status: ${pqcTesting}
- Estimated quantum-vulnerable systems: ${vulnerablePercent}

Based on this technical profile, provide:

1. **Vulnerability Assessment**: Which algorithms in their stack are vulnerable to Shor's vs Grover's algorithm? Practical difference for priority?

2. **NIST Standards Application**: Which NIST PQC standard (FIPS 203, 204, 205) addresses each vulnerable algorithm? What replaces ${keyExchange}?

3. **Migration Priority**: Given ${vulnerablePercent} vulnerable and ${hasInventory} inventory status, what's the migration sequence?

4. **Infrastructure Gaps**: ${hasKMS === 'No' || hasInventory === 'No' ? 'They lack centralized KMS and/or inventory. What must they build first?' : 'How should they leverage their existing infrastructure?'}

5. **Next Steps**: ${pqcTesting === 'No' ? 'They haven\'t begun PQC testing. What are the first 3 technical steps for the next 90 days?' : 'How do they move from testing to production?'}

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
  const regulations = answers.q17_regulations || answers.compliance?.q17 || 'HIPAA';
  const lastHIPAA = answers.q18_last_hipaa_assessment || answers.compliance?.q18 || 'Unknown';
  const keyPolicy = answers.q19_key_policy || answers.compliance?.q19 || 'Unknown';
  const baaStatus = answers.q20_baa_status || answers.compliance?.q20 || 'Unknown';
  const auditReady = answers.q21_audit_readiness || answers.compliance?.q21 || 'Unknown';
  const pqcCompliance = answers.q23_pqc_compliance || answers.compliance?.q23 || 'No';

  const query = `I need HIPAA compliance guidance for a healthcare organization:

COMPLIANCE PROFILE:
- Organization: ${orgProfile.name || 'Healthcare Organization'}
- Applicable regulations: ${Array.isArray(regulations) ? regulations.join(', ') : regulations}
- Last HIPAA Security Risk Assessment: ${lastHIPAA}
- Encryption key management policy: ${keyPolicy}
- BAAs address encryption requirements: ${baaStatus}
- Current audit readiness: ${auditReady}
- PQC compliance assessment: ${pqcCompliance}

Based on this compliance posture, provide:

1. **HIPAA Security Rule Requirements**: Specific cryptographic control requirements for their situation. Reference actual regulatory text.

2. **Assessment Gap**: Their last assessment was ${lastHIPAA}. What compliance implications and likely audit findings?

3. **BAA Exposure**: With BAAs ${baaStatus} addressing encryption, what happens when vendor encryption becomes quantum-vulnerable?

4. **Post-Quantum Compliance**: Current PQC regulatory requirements? What should they document NOW for due diligence?

5. **Audit Preparation**: They're "${auditReady}" for audit. What documentation should they prepare for emerging cryptographic risks?

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

  // Build key findings from worst answers
  const keyFindings = [];

  if (answers.q3_retention_period?.includes('30') || answers.q3_retention_period?.includes('50')) {
    keyFindings.push('Extended data retention creates exceptional HNDL exposure');
  }
  if (answers.q16_vulnerable_percentage?.includes('75') || answers.q16_vulnerable_percentage?.includes('100')) {
    keyFindings.push('Majority of systems use quantum-vulnerable encryption');
  }
  if (answers.q42_pqc_roadmap === 'No') {
    keyFindings.push('No post-quantum cryptography migration roadmap exists');
  }
  if (answers.q41_leadership_awareness === 'Not aware') {
    keyFindings.push('Executive leadership is not aware of quantum threats');
  }
  if (answers.q40_hndl_monitoring === 'No') {
    keyFindings.push('No monitoring for "harvest now, decrypt later" attacks');
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
      buildDataSensitivityQuery(answers, orgProfile),
      buildEncryptionQuery(answers, orgProfile),
      buildComplianceQuery(answers, orgProfile),
      buildExecutiveSynthesisQuery(answers, orgProfile, scores)
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
