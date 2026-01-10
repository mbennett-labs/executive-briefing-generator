/**
 * Assessment Questions Data Structure
 * Story-004: Assessment questions data structure
 *
 * All 11 questions from PRD with proper schema:
 * - id: unique identifier
 * - text: question text
 * - type: 'dropdown' or 'multiselect'
 * - options: array with label, value, and points (where applicable)
 *
 * Q1 is for organization size (used for cost projections, not scored)
 * Q2-Q11 are scored questions (10-100 point range total)
 * Q4 is multi-select type, all others are dropdown
 */

const questions = [
  {
    id: 'q1',
    text: 'How many patients does your organization serve annually?',
    type: 'dropdown',
    category: 'organization_size',
    scored: false,
    options: [
      { label: 'Under 50,000 patients (Small practice/clinic)', value: 'under_50k', size: 'small' },
      { label: '50,000 - 250,000 patients (Mid-size hospital)', value: '50k_250k', size: 'midsize' },
      { label: '250,000 - 1,000,000 patients (Large hospital/small system)', value: '250k_1m', size: 'large' },
      { label: '1,000,000 - 5,000,000 patients (Regional health system)', value: '1m_5m', size: 'regional' },
      { label: 'Over 5,000,000 patients (Large health system)', value: 'over_5m', size: 'enterprise' }
    ]
  },
  {
    id: 'q2',
    text: 'How long does your organization retain patient records?',
    type: 'dropdown',
    category: 'data_retention',
    scored: true,
    options: [
      { label: '7-10 years', value: '7_10_years', points: 2 },
      { label: '10-20 years', value: '10_20_years', points: 4 },
      { label: '20-30 years', value: '20_30_years', points: 6 },
      { label: '30-50 years', value: '30_50_years', points: 8 },
      { label: '50+ years or indefinitely', value: '50_plus_years', points: 10 }
    ]
  },
  {
    id: 'q3',
    text: 'What percentage of your critical systems are more than 10 years old?',
    type: 'dropdown',
    category: 'legacy_systems',
    scored: true,
    options: [
      { label: 'Less than 10%', value: 'under_10', points: 2 },
      { label: '10-25%', value: '10_25', points: 4 },
      { label: '25-40%', value: '25_40', points: 6 },
      { label: '40-60%', value: '40_60', points: 8 },
      { label: 'Over 60%', value: 'over_60', points: 10 }
    ]
  },
  {
    id: 'q4',
    text: 'How many regulatory frameworks does your organization comply with?',
    type: 'multiselect',
    category: 'regulatory_complexity',
    scored: true,
    options: [
      { label: 'HIPAA', value: 'hipaa' },
      { label: 'HITECH', value: 'hitech' },
      { label: 'State privacy laws (e.g., CCPA, state health laws)', value: 'state_privacy' },
      { label: 'Medicare/Medicaid requirements', value: 'medicare_medicaid' },
      { label: 'Joint Commission', value: 'joint_commission' },
      { label: 'SOC 2', value: 'soc2' },
      { label: 'PCI-DSS (if processing payments)', value: 'pci_dss' },
      { label: 'GDPR (if serving EU patients)', value: 'gdpr' },
      { label: 'FDA regulations (if medical devices)', value: 'fda' },
      { label: 'Research/NIH requirements', value: 'nih' }
    ],
    scoring: {
      description: 'Points based on number of frameworks selected',
      ranges: [
        { min: 1, max: 2, points: 2 },
        { min: 3, max: 4, points: 4 },
        { min: 5, max: 6, points: 6 },
        { min: 7, max: 8, points: 8 },
        { min: 9, max: 10, points: 10 }
      ]
    }
  },
  {
    id: 'q5',
    text: 'Approximately how many third-party vendors have access to your patient data or systems?',
    type: 'dropdown',
    category: 'vendor_count',
    scored: true,
    options: [
      { label: '1-10 vendors', value: '1_10', points: 2 },
      { label: '11-25 vendors', value: '11_25', points: 4 },
      { label: '26-50 vendors', value: '26_50', points: 6 },
      { label: '51-100 vendors', value: '51_100', points: 8 },
      { label: 'Over 100 vendors', value: 'over_100', points: 10 }
    ]
  },
  {
    id: 'q6',
    text: 'Does your organization conduct medical research or clinical trials?',
    type: 'dropdown',
    category: 'research_activity',
    scored: true,
    options: [
      { label: 'No research activity', value: 'none', points: 2 },
      { label: 'Minor research programs', value: 'minor', points: 4 },
      { label: 'Moderate research activity', value: 'moderate', points: 6 },
      { label: 'Significant research programs', value: 'significant', points: 8 },
      { label: 'Major research institution', value: 'major', points: 10 }
    ]
  },
  {
    id: 'q7',
    text: 'Is your organization designated as critical infrastructure or part of emergency response systems?',
    type: 'dropdown',
    category: 'critical_infrastructure',
    scored: true,
    options: [
      { label: 'No special designation', value: 'none', points: 2 },
      { label: 'Regional emergency response role', value: 'regional', points: 4 },
      { label: 'State-level critical infrastructure', value: 'state', points: 7 },
      { label: 'Federal critical infrastructure designation', value: 'federal', points: 10 }
    ]
  },
  {
    id: 'q8',
    text: 'How dependent are your patient care operations on networked digital systems?',
    type: 'dropdown',
    category: 'patient_safety_dependency',
    scored: true,
    options: [
      { label: 'Minimal - mostly paper-based', value: 'minimal', points: 2 },
      { label: 'Low - some digital, paper backup for everything', value: 'low', points: 4 },
      { label: 'Moderate - digital primary, paper backup available', value: 'moderate', points: 6 },
      { label: 'High - fully digital, limited paper backup', value: 'high', points: 8 },
      { label: 'Critical - 100% digital, no paper alternative', value: 'critical', points: 10 }
    ]
  },
  {
    id: 'q9',
    text: 'Has your organization experienced a data breach in the past 5 years?',
    type: 'dropdown',
    category: 'breach_history',
    scored: true,
    options: [
      { label: 'No breaches', value: 'none', points: 2 },
      { label: 'Minor incident, no patient data exposed', value: 'minor', points: 4 },
      { label: 'One breach with patient data exposed', value: 'one_breach', points: 6 },
      { label: 'Multiple breaches', value: 'multiple', points: 8 },
      { label: 'Major breach with regulatory penalties', value: 'major', points: 10 }
    ]
  },
  {
    id: 'q10',
    text: 'What is your organization\'s current level of quantum threat awareness?',
    type: 'dropdown',
    category: 'quantum_awareness',
    scored: true,
    options: [
      { label: 'Active quantum migration planning underway', value: 'active', points: 2 },
      { label: 'Board/leadership briefed, planning to start', value: 'briefed', points: 4 },
      { label: 'IT team aware, no formal planning', value: 'it_aware', points: 6 },
      { label: 'Minimal awareness, no planning', value: 'minimal', points: 8 },
      { label: 'No awareness of quantum threats', value: 'none', points: 10 }
    ]
  },
  {
    id: 'q11',
    text: 'Has your organization inventoried its current cryptographic systems?',
    type: 'dropdown',
    category: 'migration_readiness',
    scored: true,
    options: [
      { label: 'Complete inventory with quantum-readiness assessment', value: 'complete', points: 2 },
      { label: 'Partial inventory completed', value: 'partial', points: 4 },
      { label: 'Inventory planned but not started', value: 'planned', points: 6 },
      { label: 'No inventory, but know key systems', value: 'know_key', points: 8 },
      { label: 'No inventory, unknown cryptographic posture', value: 'unknown', points: 10 }
    ]
  }
];

// Export as both CommonJS and as a constant for direct import
module.exports = {
  questions,
  TOTAL_QUESTIONS: questions.length,
  SCORED_QUESTIONS: questions.filter(q => q.scored).length,
  MIN_POSSIBLE_SCORE: 10,
  MAX_POSSIBLE_SCORE: 100
};
