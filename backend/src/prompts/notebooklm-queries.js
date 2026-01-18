/**
 * NotebookLM Query Builder
 *
 * Generates targeted queries for NotebookLM based on questionnaire responses.
 * Routes queries to the appropriate notebook based on category.
 *
 * Four NotebookLM Sources:
 * 1. PRD Design for AI Agents (METHODOLOGY) - internal use only
 * 2. QSL Quantum Security Research (MAIN CONTENT) - data sensitivity, vendor risk, incident response
 * 3. HHS Portal for HIPAA (COMPLIANCE) - compliance questions, regulatory guidance
 * 4. NIST PQC Standards (TECHNICAL) - encryption, quantum readiness
 */

// Notebook configuration with URLs and descriptions
const NOTEBOOKS = {
  QSL_QUANTUM_SECURITY: {
    id: 'qsl_quantum_security',
    name: 'QSL Quantum Security Research',
    url: 'https://notebooklm.google.com/notebook/b0ce9862-9ed3-486c-8e5c-b8743383d3a7',
    sources: 18,
    description: 'Full playbook, QSL blog posts, industry research, threat timelines',
    purpose: 'Primary source for executive briefings - general quantum risk content'
  },
  HHS_HIPAA: {
    id: 'hhs_hipaa',
    name: 'HHS Portal for HIPAA and Health Privacy Rights',
    url: 'https://notebooklm.google.com/notebook/7a181258-6d88-4ec7-a92a-441f76731318',
    sources: 3,
    description: 'HHS regulations, HIPAA compliance, Cloud Security Alliance quantum-safe working group',
    purpose: 'Healthcare compliance and regulatory guidance'
  },
  NIST_PQC: {
    id: 'nist_pqc',
    name: 'NIST Post-Quantum Cryptography Standards and Migration',
    url: 'https://notebooklm.google.com/notebook/4a20d5d3-57a4-4ac6-bba1-fc182464a0a9',
    sources: 4,
    description: 'NIST FIPS 203/204/205, IBM Quantum roadmap, CSA standards',
    purpose: 'Technical standards and migration guidance'
  }
};

// Map question categories to notebooks
const CATEGORY_TO_NOTEBOOK = {
  // Data Sensitivity queries → QSL (general risk context)
  data_retention: 'QSL_QUANTUM_SECURITY',
  research_activity: 'QSL_QUANTUM_SECURITY',

  // Encryption/Technical queries → NIST PQC
  legacy_systems: 'NIST_PQC',
  migration_readiness: 'NIST_PQC',
  quantum_awareness: 'NIST_PQC',

  // Compliance queries → HHS HIPAA
  regulatory_complexity: 'HHS_HIPAA',
  critical_infrastructure: 'HHS_HIPAA',

  // Vendor Risk queries → QSL
  vendor_count: 'QSL_QUANTUM_SECURITY',

  // Incident Response queries → QSL
  breach_history: 'QSL_QUANTUM_SECURITY',
  patient_safety_dependency: 'QSL_QUANTUM_SECURITY'
};

// Aggregate categories for report sections
const REPORT_SECTIONS = {
  data_sensitivity: {
    name: 'Data Sensitivity Analysis',
    notebook: 'QSL_QUANTUM_SECURITY',
    questionCategories: ['data_retention', 'research_activity']
  },
  encryption: {
    name: 'Encryption Infrastructure',
    notebook: 'NIST_PQC',
    questionCategories: ['legacy_systems', 'migration_readiness']
  },
  compliance: {
    name: 'Compliance & Regulatory',
    notebook: 'HHS_HIPAA',
    questionCategories: ['regulatory_complexity', 'critical_infrastructure']
  },
  vendor_risk: {
    name: 'Vendor Risk',
    notebook: 'QSL_QUANTUM_SECURITY',
    questionCategories: ['vendor_count']
  },
  incident_response: {
    name: 'Incident Response',
    notebook: 'QSL_QUANTUM_SECURITY',
    questionCategories: ['breach_history', 'patient_safety_dependency']
  },
  quantum_readiness: {
    name: 'Quantum Readiness',
    notebook: 'NIST_PQC',
    questionCategories: ['quantum_awareness']
  }
};

// Human-readable labels for response values, organized by question
const RESPONSE_LABELS = {
  // Q1 - Organization size
  q1: {
    under_50k: 'under 50,000 patients (small practice/clinic)',
    '50k_250k': '50,000-250,000 patients (mid-size hospital)',
    '250k_1m': '250,000-1,000,000 patients (large hospital/small system)',
    '1m_5m': '1,000,000-5,000,000 patients (regional health system)',
    over_5m: 'over 5,000,000 patients (large health system)'
  },

  // Q2 - Data retention
  q2: {
    '7_10_years': '7-10 years',
    '10_20_years': '10-20 years',
    '20_30_years': '20-30 years',
    '30_50_years': '30-50 years',
    '50_plus_years': '50+ years or indefinitely'
  },

  // Q3 - Legacy systems
  q3: {
    under_10: 'less than 10%',
    '10_25': '10-25%',
    '25_40': '25-40%',
    '40_60': '40-60%',
    over_60: 'over 60%'
  },

  // Q5 - Vendor count
  q5: {
    '1_10': '1-10 vendors',
    '11_25': '11-25 vendors',
    '26_50': '26-50 vendors',
    '51_100': '51-100 vendors',
    over_100: 'over 100 vendors'
  },

  // Q6 - Research activity
  q6: {
    none: 'no research activity',
    minor: 'minor research programs',
    moderate: 'moderate research activity',
    significant: 'significant research programs',
    major: 'major research institution'
  },

  // Q7 - Critical infrastructure
  q7: {
    none: 'no special designation',
    regional: 'regional emergency response role',
    state: 'state-level critical infrastructure',
    federal: 'federal critical infrastructure designation'
  },

  // Q8 - Patient safety dependency
  q8: {
    minimal: 'minimal (mostly paper-based)',
    low: 'low (some digital, paper backup for everything)',
    moderate: 'moderate (digital primary, paper backup available)',
    high: 'high (fully digital, limited paper backup)',
    critical: 'critical (100% digital, no paper alternative)'
  },

  // Q9 - Breach history
  q9: {
    none: 'no breaches',
    minor: 'minor incident, no patient data exposed',
    one_breach: 'one breach with patient data exposed',
    multiple: 'multiple breaches',
    major: 'major breach with regulatory penalties'
  },

  // Q10 - Quantum awareness
  q10: {
    active: 'active quantum migration planning underway',
    briefed: 'board/leadership briefed, planning to start',
    it_aware: 'IT team aware, no formal planning',
    minimal: 'minimal awareness, no planning',
    none: 'no awareness of quantum threats'
  },

  // Q11 - Migration readiness
  q11: {
    complete: 'complete inventory with quantum-readiness assessment',
    partial: 'partial inventory completed',
    planned: 'inventory planned but not started',
    know_key: 'no inventory, but know key systems',
    unknown: 'no inventory, unknown cryptographic posture'
  }
};

/**
 * Normalize response key to get value from responses object
 * Handles: numeric keys (responses[3]), string numeric keys (responses['3']), and q-prefixed (responses.q3)
 * @param {object} responses - The responses object
 * @param {number|string} questionNum - The question number (e.g., 3, '3', or 'q3')
 */
function getResponse(responses, questionNum) {
  if (!responses) return undefined;

  // Extract numeric part if it's like 'q3'
  const num = typeof questionNum === 'string' && questionNum.startsWith('q')
    ? parseInt(questionNum.substring(1), 10)
    : parseInt(questionNum, 10);

  // Try all possible key formats: numeric, string numeric, and q-prefixed
  return responses[num] || responses[String(num)] || responses[`q${num}`] || responses[questionNum];
}

/**
 * Get human-readable label for a response value
 * @param {string} questionId - The question ID (e.g., 'q2')
 * @param {string} value - The response value
 */
function getResponseLabel(questionId, value) {
  const questionLabels = RESPONSE_LABELS[questionId];
  if (questionLabels && questionLabels[value]) {
    return questionLabels[value];
  }
  return value;
}

/**
 * Get regulatory frameworks as a readable list
 */
function formatRegulatory(selections) {
  if (!Array.isArray(selections) || selections.length === 0) {
    return 'unknown regulatory requirements';
  }
  const labels = {
    hipaa: 'HIPAA',
    hitech: 'HITECH',
    state_privacy: 'State privacy laws',
    medicare_medicaid: 'Medicare/Medicaid',
    joint_commission: 'Joint Commission',
    soc2: 'SOC 2',
    pci_dss: 'PCI-DSS',
    gdpr: 'GDPR',
    fda: 'FDA regulations',
    nih: 'NIH/Research requirements'
  };
  return selections.map(s => labels[s] || s).join(', ');
}

/**
 * Build Data Sensitivity query for QSL Notebook
 * Uses Q3 (retention period) and Q5 (data classification)
 */
function buildDataSensitivityQuery(responses, orgProfile) {
  // DB stores human-readable strings directly, use them as-is
  const retention = getResponse(responses, 3) || 'not specified';
  const dataClassification = getResponse(responses, 5) || 'not specified';

  return {
    notebook: NOTEBOOKS.QSL_QUANTUM_SECURITY,
    section: 'Data Sensitivity Analysis',
    query: `Based on a ${orgProfile.type} healthcare organization with these specific characteristics:
- Organization: ${orgProfile.name}
- Size: ${orgProfile.size}
- Data retention period: ${retention}
- Data classification status: ${dataClassification}

Provide specific analysis on:
1. Why their "${retention}" retention creates quantum exposure risks
2. "Harvest now, decrypt later" (HNDL) attack risks specific to their data retention period
3. Which data categories should be prioritized for quantum-safe migration
4. Specific timeline recommendations based on their data sensitivity profile
5. How their data classification status affects quantum risk management`
  };
}

/**
 * Build Encryption Infrastructure query for NIST Notebook
 * Uses Q9-Q16 encryption section questions
 */
function buildEncryptionQuery(responses, orgProfile) {
  const encryptionAtRest = getResponse(responses, 9) || 'not specified';
  const pqcTesting = getResponse(responses, 15) || 'not specified';
  const vulnerablePercentage = getResponse(responses, 16) || 'not specified';

  return {
    notebook: NOTEBOOKS.NIST_PQC,
    section: 'Encryption Infrastructure Assessment',
    query: `For a ${orgProfile.type} healthcare organization with these cryptographic characteristics:
- Organization: ${orgProfile.name}
- Encryption at rest: ${encryptionAtRest}
- PQC testing status: ${pqcTesting}
- Quantum-vulnerable systems: ${vulnerablePercentage}

Analyze and provide:
1. Which NIST PQC standards (FIPS 203, 204, 205) should they prioritize first
2. Specific vulnerabilities in their current encryption approach
3. Migration approach recommendations given PQC testing status: "${pqcTesting}"
4. Hybrid cryptography implementation guidance for healthcare systems
5. Timeline and phasing recommendations for their maturity level`
  };
}

/**
 * Build Compliance query for HHS Notebook
 * Uses Q17-Q24 compliance section questions
 */
function buildComplianceQuery(responses, orgProfile) {
  const regulatoryFrameworks = getResponse(responses, 17);  // Q17: regulatory frameworks (multiselect)
  const complianceStatus = getResponse(responses, 20) || 'not specified'; // Q20: compliance status
  const auditFrequency = getResponse(responses, 21) || 'not specified'; // Q21: audit frequency

  // Format regulatory frameworks list
  let regulatoryList = 'not specified';
  let regulatoryCount = 0;
  if (Array.isArray(regulatoryFrameworks)) {
    regulatoryList = regulatoryFrameworks.join(', ');
    regulatoryCount = regulatoryFrameworks.length;
  } else if (regulatoryFrameworks) {
    regulatoryList = String(regulatoryFrameworks);
    regulatoryCount = 1;
  }

  return {
    notebook: NOTEBOOKS.HHS_HIPAA,
    section: 'Compliance & Regulatory Analysis',
    query: `For a ${orgProfile.type} healthcare organization with this regulatory profile:
- Organization: ${orgProfile.name}
- Regulatory frameworks: ${regulatoryList} (${regulatoryCount} total)
- Current compliance status: ${complianceStatus}
- Audit frequency: ${auditFrequency}

Provide specific guidance on:
1. HIPAA implications for quantum-vulnerable encryption
2. How their compliance status ("${complianceStatus}") affects PQC migration urgency
3. Regulatory timeline expectations for post-quantum cryptography adoption
4. BAA (Business Associate Agreement) considerations for quantum readiness
5. Audit readiness recommendations for quantum-safe compliance
6. State-specific requirements if applicable based on their framework list`
  };
}

/**
 * Build Vendor Risk query for QSL Notebook
 * Uses Q25-Q32 vendor risk section questions
 */
function buildVendorRiskQuery(responses, orgProfile) {
  const vendorCount = getResponse(responses, 25) || 'not specified'; // Q25: vendor count
  const vendorAssessment = getResponse(responses, 26) || 'not specified'; // Q26: vendor security assessment
  const vendorPQCRequirements = getResponse(responses, 28) || 'not specified'; // Q28: PQC requirements in contracts

  return {
    notebook: NOTEBOOKS.QSL_QUANTUM_SECURITY,
    section: 'Vendor Risk Assessment',
    query: `For a ${orgProfile.type} healthcare organization with this vendor ecosystem:
- Organization: ${orgProfile.name}
- Third-party vendors with PHI access: ${vendorCount}
- Vendor security assessment status: ${vendorAssessment}
- PQC requirements in vendor contracts: ${vendorPQCRequirements}

Analyze:
1. Supply chain quantum risk exposure given "${vendorCount}" vendors
2. Vendor assessment questionnaire recommendations for quantum readiness
3. Contract and BAA language updates needed for PQC requirements
4. Prioritization framework for vendor quantum risk assessment
5. Third-party risk management timeline recommendations`
  };
}

/**
 * Build Incident Response query for QSL Notebook
 * Uses Q33-Q40 incident response section questions
 */
function buildIncidentResponseQuery(responses, orgProfile) {
  const irPlanStatus = getResponse(responses, 33) || 'not specified'; // Q33: IR plan status
  const cryptoIncidentProcedures = getResponse(responses, 34) || 'not specified'; // Q34: crypto-specific procedures
  const recoveryCapability = getResponse(responses, 37) || 'not specified'; // Q37: recovery capability
  const hndlMonitoring = getResponse(responses, 40) || 'not specified'; // Q40: HNDL monitoring

  return {
    notebook: NOTEBOOKS.QSL_QUANTUM_SECURITY,
    section: 'Incident Response Readiness',
    query: `For a ${orgProfile.type} healthcare organization with this incident response profile:
- Organization: ${orgProfile.name}
- IR plan status: ${irPlanStatus}
- Crypto-specific incident procedures: ${cryptoIncidentProcedures}
- Recovery capability: ${recoveryCapability}
- HNDL attack monitoring: ${hndlMonitoring}

Provide:
1. Quantum-specific incident response procedure recommendations
2. How their IR plan status ("${irPlanStatus}") should inform quantum security priorities
3. HNDL attack detection and monitoring recommendations given current state: "${hndlMonitoring}"
4. Recovery capability requirements and improvements needed
5. Tabletop exercise scenarios for quantum-related incidents`
  };
}

/**
 * Build Quantum Readiness query for NIST Notebook
 * Uses Q41-Q48 quantum readiness section questions
 */
function buildQuantumReadinessQuery(responses, orgProfile) {
  const executiveAwareness = getResponse(responses, 41) || 'not specified'; // Q41: executive awareness
  const pqcRoadmap = getResponse(responses, 42) || 'not specified'; // Q42: PQC roadmap status
  const pqcBudget = getResponse(responses, 43) || 'not specified'; // Q43: budget allocated
  const cryptoInventory = getResponse(responses, 46) || 'not specified'; // Q46: cryptographic inventory

  return {
    notebook: NOTEBOOKS.NIST_PQC,
    section: 'Quantum Readiness Assessment',
    query: `For a ${orgProfile.type} healthcare organization at this quantum readiness level:
- Organization: ${orgProfile.name}
- Executive awareness: ${executiveAwareness}
- PQC roadmap status: ${pqcRoadmap}
- Budget allocated for PQC: ${pqcBudget}
- Cryptographic inventory status: ${cryptoInventory}

Provide:
1. Maturity assessment based on their current state
2. Immediate next steps given awareness level: "${executiveAwareness}"
3. Cryptographic discovery methodology recommendations
4. Budget estimation framework given current allocation: "${pqcBudget}"
5. Executive communication recommendations for quantum risk
6. Benchmark comparison to healthcare industry peers`
  };
}

/**
 * Generate all NotebookLM queries for an assessment
 *
 * @param {object} params - Assessment parameters
 * @param {string} params.org_name - Organization name
 * @param {string} params.org_type - Organization type
 * @param {string} params.employee_count - Employee count range
 * @param {object} params.responses - Questionnaire responses keyed by question ID
 * @param {number} params.overall_score - Overall risk score
 * @param {string} params.risk_level - Risk level (LOW, MODERATE, HIGH, CRITICAL, SEVERE)
 * @returns {object} Generated queries organized by notebook
 */
function generateNotebookQueries(params) {
  const {
    org_name,
    org_type,
    employee_count,
    responses,
    overall_score,
    risk_level
  } = params;

  // Build organization profile for query context
  const orgProfile = {
    name: org_name || 'Healthcare Organization',
    type: org_type || 'Hospital',
    size: employee_count || 'unknown size'
  };

  // Generate all section queries
  const queries = {
    data_sensitivity: buildDataSensitivityQuery(responses, orgProfile),
    encryption: buildEncryptionQuery(responses, orgProfile),
    compliance: buildComplianceQuery(responses, orgProfile),
    vendor_risk: buildVendorRiskQuery(responses, orgProfile),
    incident_response: buildIncidentResponseQuery(responses, orgProfile),
    quantum_readiness: buildQuantumReadinessQuery(responses, orgProfile)
  };

  // Group queries by notebook for efficiency
  const byNotebook = {
    [NOTEBOOKS.QSL_QUANTUM_SECURITY.id]: {
      notebook: NOTEBOOKS.QSL_QUANTUM_SECURITY,
      queries: []
    },
    [NOTEBOOKS.HHS_HIPAA.id]: {
      notebook: NOTEBOOKS.HHS_HIPAA,
      queries: []
    },
    [NOTEBOOKS.NIST_PQC.id]: {
      notebook: NOTEBOOKS.NIST_PQC,
      queries: []
    }
  };

  // Organize queries by their target notebook
  for (const [sectionKey, queryData] of Object.entries(queries)) {
    const notebookId = queryData.notebook.id;
    byNotebook[notebookId].queries.push({
      section: sectionKey,
      sectionName: queryData.section,
      query: queryData.query
    });
  }

  // Generate combined queries for each notebook (more efficient for user)
  const combinedQueries = {};
  for (const [notebookId, data] of Object.entries(byNotebook)) {
    if (data.queries.length > 0) {
      combinedQueries[notebookId] = {
        notebook: data.notebook,
        combinedQuery: buildCombinedQuery(data.queries, orgProfile, overall_score, risk_level),
        individualQueries: data.queries
      };
    }
  }

  return {
    organization: orgProfile,
    riskScore: overall_score,
    riskLevel: risk_level,
    queriesBySection: queries,
    queriesByNotebook: combinedQueries,
    notebooks: NOTEBOOKS,
    instructions: generateUserInstructions(combinedQueries)
  };
}

/**
 * Build a combined query for a notebook (all sections)
 */
function buildCombinedQuery(queries, orgProfile, overallScore, riskLevel) {
  const sections = queries.map(q => q.sectionName).join(', ');
  const queryTexts = queries.map((q, i) => `--- ${q.sectionName} ---\n${q.query}`).join('\n\n');

  return `# Executive Briefing Research Request
## Organization Profile
- Name: ${orgProfile.name}
- Type: ${orgProfile.type}
- Size: ${orgProfile.size}
- Overall Risk Score: ${overallScore}/100 (${riskLevel})

## Sections Covered: ${sections}

Please analyze the following areas and provide specific, actionable insights for this healthcare organization:

${queryTexts}

## Output Format
For each section, provide:
1. Key findings specific to this organization's situation
2. Specific recommendations (not generic advice)
3. Priority actions with rationale
4. Relevant statistics, timelines, or benchmarks from the source materials`;
}

/**
 * Generate user instructions for the manual NotebookLM workflow
 */
function generateUserInstructions(combinedQueries) {
  const steps = [];
  let stepNum = 1;

  for (const [notebookId, data] of Object.entries(combinedQueries)) {
    steps.push({
      step: stepNum++,
      notebook: data.notebook.name,
      url: data.notebook.url,
      sections: data.individualQueries.map(q => q.sectionName),
      instruction: `Open ${data.notebook.name} and paste the combined query. Copy the response back to the application.`
    });
  }

  return {
    overview: 'To generate a personalized executive briefing, query each NotebookLM source with the generated queries below. Copy each response back to complete the report.',
    steps,
    totalNotebooks: steps.length
  };
}

/**
 * Format a single query for display/copy
 */
function formatQueryForCopy(queryData) {
  return `${queryData.query}`;
}

module.exports = {
  generateNotebookQueries,
  formatQueryForCopy,
  buildDataSensitivityQuery,
  buildEncryptionQuery,
  buildComplianceQuery,
  buildVendorRiskQuery,
  buildIncidentResponseQuery,
  buildQuantumReadinessQuery,
  NOTEBOOKS,
  CATEGORY_TO_NOTEBOOK,
  REPORT_SECTIONS
};
