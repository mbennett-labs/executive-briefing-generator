/**
 * Test script for NotebookLM Query Builder
 * Run with: node backend/src/prompts/notebooklm-queries.test.js
 */

const { generateNotebookQueries, NOTEBOOKS } = require('./notebooklm-queries');

// Sample questionnaire data from specification
const sampleData = {
  org_name: 'Regional Medical Center of Maryland',
  org_type: 'Hospital',
  employee_count: '500-1000 employees',
  responses: {
    // Q1 - Organization size
    q1: '250k_1m',
    // Q2 - Data retention
    q2: '50_plus_years',
    // Q3 - Legacy systems
    q3: 'over_60',
    // Q4 - Regulatory frameworks (multiselect)
    q4: ['hipaa', 'hitech', 'state_privacy', 'medicare_medicaid', 'joint_commission'],
    // Q5 - Vendor count
    q5: '51_100',
    // Q6 - Research activity
    q6: 'moderate',
    // Q7 - Critical infrastructure
    q7: 'regional',
    // Q8 - Digital dependency
    q8: 'high',
    // Q9 - Breach history
    q9: 'none',
    // Q10 - Quantum awareness
    q10: 'minimal',
    // Q11 - Migration readiness
    q11: 'unknown'
  },
  overall_score: 78,
  risk_level: 'CRITICAL'
};

console.log('='.repeat(80));
console.log('NOTEBOOKLM QUERY BUILDER TEST');
console.log('='.repeat(80));
console.log();

// Generate queries
const result = generateNotebookQueries(sampleData);

console.log('ORGANIZATION PROFILE:');
console.log('-'.repeat(40));
console.log(`Name: ${result.organization.name}`);
console.log(`Type: ${result.organization.type}`);
console.log(`Size: ${result.organization.size}`);
console.log(`Risk Score: ${result.riskScore}/100 (${result.riskLevel})`);
console.log();

console.log('AVAILABLE NOTEBOOKS:');
console.log('-'.repeat(40));
for (const [key, notebook] of Object.entries(NOTEBOOKS)) {
  console.log(`- ${notebook.name}`);
  console.log(`  URL: ${notebook.url}`);
  console.log(`  Sources: ${notebook.sources}`);
  console.log();
}

console.log('USER INSTRUCTIONS:');
console.log('-'.repeat(40));
console.log(result.instructions.overview);
console.log();
for (const step of result.instructions.steps) {
  console.log(`Step ${step.step}: ${step.notebook}`);
  console.log(`  URL: ${step.url}`);
  console.log(`  Sections: ${step.sections.join(', ')}`);
  console.log();
}

console.log('='.repeat(80));
console.log('GENERATED QUERIES BY NOTEBOOK');
console.log('='.repeat(80));
console.log();

for (const [notebookId, data] of Object.entries(result.queriesByNotebook)) {
  console.log(`\n${'#'.repeat(80)}`);
  console.log(`# ${data.notebook.name.toUpperCase()}`);
  console.log(`# URL: ${data.notebook.url}`);
  console.log(`${'#'.repeat(80)}\n`);

  console.log('COMBINED QUERY (copy this to NotebookLM):');
  console.log('-'.repeat(40));
  console.log(data.combinedQuery);
  console.log();
}

console.log('='.repeat(80));
console.log('INDIVIDUAL SECTION QUERIES');
console.log('='.repeat(80));

for (const [section, query] of Object.entries(result.queriesBySection)) {
  console.log(`\n--- ${query.section} ---`);
  console.log(`Notebook: ${query.notebook.name}`);
  console.log();
  console.log(query.query);
  console.log();
}

console.log('='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
