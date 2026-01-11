/**
 * Unit tests for scoring algorithm
 * Run with: node src/utils/scoring.test.js
 */

const assert = require('assert');
const {
  calculateScores,
  getRiskLevel,
  scoreQuestion,
  scoreMultiSelect,
  scoreRange,
  scoreYesNo,
  CATEGORY_WEIGHTS,
  RISK_LEVELS
} = require('./scoring');

console.log('Running scoring utility tests...\n');

// Test 1: Category weights sum to 1.0
console.log('Test 1: Category weights sum to 1.0');
const weightSum = Object.values(CATEGORY_WEIGHTS).reduce((sum, w) => sum + w, 0);
assert.strictEqual(weightSum, 1.0, 'Weights should sum to 1.0');
console.log('  PASS\n');

// Test 2: scoreRange function
console.log('Test 2: scoreRange function');
const rangeOptions = ['Bad', 'Poor', 'Fair', 'Good', 'Excellent'];
assert.strictEqual(scoreRange('Bad', rangeOptions), 0, 'First option should be 0');
assert.strictEqual(scoreRange('Excellent', rangeOptions), 100, 'Last option should be 100');
assert.strictEqual(scoreRange('Fair', rangeOptions), 50, 'Middle option should be 50');
assert.strictEqual(scoreRange('Unknown', rangeOptions), 0, 'Unknown option should be 0');
console.log('  PASS\n');

// Test 3: scoreMultiSelect function
console.log('Test 3: scoreMultiSelect function');
assert.strictEqual(scoreMultiSelect([], 10), 100, 'No selections should be 100');
assert.strictEqual(scoreMultiSelect(['a', 'b', 'c', 'd', 'e'], 5), 0, 'All selections should be 0');
assert.strictEqual(scoreMultiSelect(['a', 'b'], 4), 50, 'Half selections should be 50');
console.log('  PASS\n');

// Test 4: scoreYesNo function
console.log('Test 4: scoreYesNo function');
assert.strictEqual(scoreYesNo('Yes', false), 0, 'Yes with yesIsBetter=false should be 0');
assert.strictEqual(scoreYesNo('No', false), 100, 'No with yesIsBetter=false should be 100');
assert.strictEqual(scoreYesNo('Yes', true), 100, 'Yes with yesIsBetter=true should be 100');
assert.strictEqual(scoreYesNo('Unsure', false), 50, 'Unsure should be 50');
console.log('  PASS\n');

// Test 5: scoreQuestion function
console.log('Test 5: scoreQuestion function');
const rangeQuestionMeta = {
  answer_type: 'range',
  answer_options: JSON.stringify(['Never', '1 year ago', '6 months ago', 'Recently'])
};
assert.strictEqual(scoreQuestion(1, 'Never', rangeQuestionMeta), 0);
assert.strictEqual(scoreQuestion(1, 'Recently', rangeQuestionMeta), 100);
console.log('  PASS\n');

// Test 6: calculateScores function
console.log('Test 6: calculateScores function');
const mockQuestions = [
  { id: 1, category: 'data_sensitivity', answer_type: 'range', answer_options: ['Low', 'Medium', 'High'] },
  { id: 2, category: 'data_sensitivity', answer_type: 'range', answer_options: ['Low', 'Medium', 'High'] },
  { id: 3, category: 'encryption', answer_type: 'range', answer_options: ['None', 'Basic', 'Advanced'] },
  { id: 4, category: 'encryption', answer_type: 'range', answer_options: ['None', 'Basic', 'Advanced'] },
  { id: 5, category: 'compliance', answer_type: 'range', answer_options: ['No', 'Partial', 'Full'] },
  { id: 6, category: 'compliance', answer_type: 'range', answer_options: ['No', 'Partial', 'Full'] },
  { id: 7, category: 'vendor_risk', answer_type: 'range', answer_options: ['Poor', 'Fair', 'Good'] },
  { id: 8, category: 'vendor_risk', answer_type: 'range', answer_options: ['Poor', 'Fair', 'Good'] },
  { id: 9, category: 'incident_response', answer_type: 'range', answer_options: ['None', 'Some', 'Complete'] },
  { id: 10, category: 'incident_response', answer_type: 'range', answer_options: ['None', 'Some', 'Complete'] },
  { id: 11, category: 'quantum_readiness', answer_type: 'range', answer_options: ['Unaware', 'Aware', 'Prepared'] },
  { id: 12, category: 'quantum_readiness', answer_type: 'range', answer_options: ['Unaware', 'Aware', 'Prepared'] }
];

// All best answers
const bestResponses = {
  1: 'High', 2: 'High',       // data_sensitivity: 100
  3: 'Advanced', 4: 'Advanced', // encryption: 100
  5: 'Full', 6: 'Full',       // compliance: 100
  7: 'Good', 8: 'Good',       // vendor_risk: 100
  9: 'Complete', 10: 'Complete', // incident_response: 100
  11: 'Prepared', 12: 'Prepared'  // quantum_readiness: 100
};

const bestResult = calculateScores(bestResponses, mockQuestions);
assert.strictEqual(bestResult.overall_score, 100, 'All best answers should give 100');
assert.strictEqual(bestResult.category_scores.data_sensitivity, 100);
assert.strictEqual(bestResult.category_scores.encryption, 100);
console.log('  PASS\n');

// All worst answers
const worstResponses = {
  1: 'Low', 2: 'Low',
  3: 'None', 4: 'None',
  5: 'No', 6: 'No',
  7: 'Poor', 8: 'Poor',
  9: 'None', 10: 'None',
  11: 'Unaware', 12: 'Unaware'
};

const worstResult = calculateScores(worstResponses, mockQuestions);
assert.strictEqual(worstResult.overall_score, 0, 'All worst answers should give 0');
console.log('  PASS\n');

// Test 7: Mixed responses produce weighted average
console.log('Test 7: Mixed responses with weighted average');
const mixedResponses = {
  1: 'High', 2: 'High',       // data_sensitivity: 100 * 0.20 = 20
  3: 'None', 4: 'None',       // encryption: 0 * 0.25 = 0
  5: 'Full', 6: 'Full',       // compliance: 100 * 0.15 = 15
  7: 'Poor', 8: 'Poor',       // vendor_risk: 0 * 0.15 = 0
  9: 'Complete', 10: 'Complete', // incident_response: 100 * 0.10 = 10
  11: 'Unaware', 12: 'Unaware'  // quantum_readiness: 0 * 0.15 = 0
};

const mixedResult = calculateScores(mixedResponses, mockQuestions);
assert.strictEqual(mixedResult.overall_score, 45, 'Mixed responses should give weighted average: 20+0+15+0+10+0=45');
console.log('  PASS\n');

// Test 8: Returns object with category_scores and overall_score
console.log('Test 8: Return object structure');
assert.ok('category_scores' in bestResult, 'Result should have category_scores');
assert.ok('overall_score' in bestResult, 'Result should have overall_score');
assert.ok(typeof bestResult.category_scores === 'object', 'category_scores should be object');
assert.ok(typeof bestResult.overall_score === 'number', 'overall_score should be number');
console.log('  PASS\n');

// Test 9: getRiskLevel function - Critical
console.log('Test 9: getRiskLevel function - Critical (0-30)');
assert.deepStrictEqual(getRiskLevel(0), { level: 'Critical', color: 'red' });
assert.deepStrictEqual(getRiskLevel(15), { level: 'Critical', color: 'red' });
assert.deepStrictEqual(getRiskLevel(30), { level: 'Critical', color: 'red' });
console.log('  PASS\n');

// Test 10: getRiskLevel function - High
console.log('Test 10: getRiskLevel function - High (31-50)');
assert.deepStrictEqual(getRiskLevel(31), { level: 'High', color: 'orange' });
assert.deepStrictEqual(getRiskLevel(40), { level: 'High', color: 'orange' });
assert.deepStrictEqual(getRiskLevel(50), { level: 'High', color: 'orange' });
console.log('  PASS\n');

// Test 11: getRiskLevel function - Moderate
console.log('Test 11: getRiskLevel function - Moderate (51-70)');
assert.deepStrictEqual(getRiskLevel(51), { level: 'Moderate', color: 'yellow' });
assert.deepStrictEqual(getRiskLevel(60), { level: 'Moderate', color: 'yellow' });
assert.deepStrictEqual(getRiskLevel(70), { level: 'Moderate', color: 'yellow' });
console.log('  PASS\n');

// Test 12: getRiskLevel function - Low
console.log('Test 12: getRiskLevel function - Low (71-85)');
assert.deepStrictEqual(getRiskLevel(71), { level: 'Low', color: 'lightgreen' });
assert.deepStrictEqual(getRiskLevel(78), { level: 'Low', color: 'lightgreen' });
assert.deepStrictEqual(getRiskLevel(85), { level: 'Low', color: 'lightgreen' });
console.log('  PASS\n');

// Test 13: getRiskLevel function - Prepared
console.log('Test 13: getRiskLevel function - Prepared (86-100)');
assert.deepStrictEqual(getRiskLevel(86), { level: 'Prepared', color: 'green' });
assert.deepStrictEqual(getRiskLevel(93), { level: 'Prepared', color: 'green' });
assert.deepStrictEqual(getRiskLevel(100), { level: 'Prepared', color: 'green' });
console.log('  PASS\n');

console.log('All tests passed!');
