/**
 * Test script for story-004: Assessment questions data structure
 * Tests all acceptance criteria
 */

const { questions, TOTAL_QUESTIONS, SCORED_QUESTIONS, MIN_POSSIBLE_SCORE, MAX_POSSIBLE_SCORE } = require('../src/data/questions');

function runTests() {
  console.log('Testing story-004: Assessment questions data structure\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Questions array contains all 11 questions from PRD
  console.log('Test 1: Questions array contains all 11 questions from PRD');
  if (questions.length === 11 && TOTAL_QUESTIONS === 11) {
    console.log('  ✓ PASSED - 11 questions present\n');
    passed++;
  } else {
    console.log(`  ✗ FAILED - Expected 11 questions, found ${questions.length}\n`);
    failed++;
  }

  // Test 2: Each question has: id, text, type, options array
  console.log('Test 2: Each question has: id, text, type, options array');
  let allHaveRequiredFields = true;
  const missingFields = [];
  for (const q of questions) {
    if (!q.id) missingFields.push(`${q.id || 'unknown'}: missing id`);
    if (!q.text) missingFields.push(`${q.id}: missing text`);
    if (!q.type) missingFields.push(`${q.id}: missing type`);
    if (!Array.isArray(q.options)) missingFields.push(`${q.id}: missing options array`);
  }
  if (missingFields.length === 0) {
    console.log('  ✓ PASSED - All questions have id, text, type, and options array\n');
    passed++;
  } else {
    console.log(`  ✗ FAILED - Missing fields: ${missingFields.join(', ')}\n`);
    failed++;
  }

  // Test 3: Each option has: label, value, points (where applicable)
  console.log('Test 3: Each option has: label, value, points (where applicable)');
  let allOptionsValid = true;
  const optionIssues = [];
  for (const q of questions) {
    for (const opt of q.options) {
      if (!opt.label) optionIssues.push(`${q.id}: option missing label`);
      if (!opt.value) optionIssues.push(`${q.id}: option missing value`);
      // For scored questions (except multiselect which has separate scoring), options should have points
      if (q.scored && q.type === 'dropdown' && opt.points === undefined) {
        optionIssues.push(`${q.id}: scored dropdown option missing points`);
      }
    }
  }
  if (optionIssues.length === 0) {
    console.log('  ✓ PASSED - All options have label, value, and points where applicable\n');
    passed++;
  } else {
    console.log(`  ✗ FAILED - Option issues: ${optionIssues.slice(0, 5).join(', ')}${optionIssues.length > 5 ? '...' : ''}\n`);
    failed++;
  }

  // Test 4: Question 4 (regulatory) is multi-select type
  console.log('Test 4: Question 4 (regulatory) is multi-select type');
  const q4 = questions.find(q => q.id === 'q4');
  if (q4 && q4.type === 'multiselect' && q4.category === 'regulatory_complexity') {
    console.log('  ✓ PASSED - Q4 is multiselect type for regulatory complexity\n');
    passed++;
  } else {
    console.log(`  ✗ FAILED - Q4 type is "${q4?.type}" instead of "multiselect"\n`);
    failed++;
  }

  // Test 5: All other questions are single-select dropdown type
  console.log('Test 5: All other questions are single-select dropdown type');
  const nonDropdownQuestions = questions.filter(q => q.id !== 'q4' && q.type !== 'dropdown');
  if (nonDropdownQuestions.length === 0) {
    console.log('  ✓ PASSED - All non-Q4 questions are dropdown type\n');
    passed++;
  } else {
    console.log(`  ✗ FAILED - Non-dropdown questions found: ${nonDropdownQuestions.map(q => q.id).join(', ')}\n`);
    failed++;
  }

  // Test 6: Questions exported as JSON or constant for frontend use
  console.log('Test 6: Questions exported as JSON or constant for frontend use');
  try {
    const jsonData = require('../src/data/questions.json');
    if (jsonData.questions && jsonData.questions.length === 11) {
      console.log('  ✓ PASSED - Questions exported as JSON file (questions.json)\n');
      passed++;
    } else {
      console.log('  ✗ FAILED - JSON file exists but does not have 11 questions\n');
      failed++;
    }
  } catch (e) {
    console.log(`  ✗ FAILED - Could not load JSON file: ${e.message}\n`);
    failed++;
  }

  // Additional validation tests
  console.log('Test 7: Q1 (org size) is not scored, Q2-Q11 are scored');
  const q1 = questions.find(q => q.id === 'q1');
  const scoredQuestions = questions.filter(q => q.scored);
  if (q1 && q1.scored === false && scoredQuestions.length === 10) {
    console.log('  ✓ PASSED - Q1 not scored, 10 questions scored (Q2-Q11)\n');
    passed++;
  } else {
    console.log(`  ✗ FAILED - Q1 scored: ${q1?.scored}, total scored: ${scoredQuestions.length}\n`);
    failed++;
  }

  console.log('Test 8: Score range is 10-100 (min 10, max 100)');
  if (MIN_POSSIBLE_SCORE === 10 && MAX_POSSIBLE_SCORE === 100) {
    console.log('  ✓ PASSED - Score range is 10-100\n');
    passed++;
  } else {
    console.log(`  ✗ FAILED - Score range is ${MIN_POSSIBLE_SCORE}-${MAX_POSSIBLE_SCORE}\n`);
    failed++;
  }

  console.log('Test 9: Q4 multiselect has scoring ranges defined');
  if (q4 && q4.scoring && q4.scoring.ranges && q4.scoring.ranges.length === 5) {
    const ranges = q4.scoring.ranges;
    const correctRanges =
      ranges[0].min === 1 && ranges[0].max === 2 && ranges[0].points === 2 &&
      ranges[4].min === 9 && ranges[4].max === 10 && ranges[4].points === 10;
    if (correctRanges) {
      console.log('  ✓ PASSED - Q4 has correct scoring ranges (1-2: 2pts ... 9+: 10pts)\n');
      passed++;
    } else {
      console.log('  ✗ FAILED - Q4 scoring ranges incorrect\n');
      failed++;
    }
  } else {
    console.log('  ✗ FAILED - Q4 missing scoring ranges\n');
    failed++;
  }

  console.log('=====================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('=====================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
