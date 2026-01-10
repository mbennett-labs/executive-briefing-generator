/**
 * Test script for story-005: Risk score calculation logic
 * Tests all acceptance criteria including edge cases
 */

const {
  calculateRiskScore,
  getQuestionPoints,
  getQ4Points,
  getRiskLevel,
  getWeakestAreas,
  RISK_LEVELS
} = require('../src/services/scoring');

function runTests() {
  console.log('Testing story-005: Risk score calculation logic\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Function accepts assessment responses object
  console.log('Test 1: Function accepts assessment responses object');
  try {
    const result = calculateRiskScore({
      q2: '7_10_years',
      q3: 'under_10',
      q4: ['hipaa'],
      q5: '1_10',
      q6: 'none',
      q7: 'none',
      q8: 'minimal',
      q9: 'none',
      q10: 'active',
      q11: 'complete'
    });
    if (result && typeof result.totalScore === 'number') {
      console.log('  ✓ PASSED - Function accepts responses and returns score object\n');
      passed++;
    } else {
      console.log('  ✗ FAILED - Invalid response format\n');
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 2: Sums points from questions 2-11 (Q1 not scored)
  console.log('Test 2: Sums points from questions 2-11 (Q1 is org size, not scored)');
  try {
    const result = calculateRiskScore({
      q1: 'over_5m', // Should be ignored
      q2: '7_10_years', // 2 points
      q3: 'under_10', // 2 points
      q4: ['hipaa'], // 1 selection = 2 points
      q5: '1_10', // 2 points
      q6: 'none', // 2 points
      q7: 'none', // 2 points
      q8: 'minimal', // 2 points
      q9: 'none', // 2 points
      q10: 'active', // 2 points
      q11: 'complete' // 2 points
    });
    // Total should be 20 (all minimum scores)
    if (result.totalScore === 20 && !result.questionScores.q1) {
      console.log('  ✓ PASSED - Q1 not included in scoring, Q2-Q11 summed correctly\n');
      passed++;
    } else {
      console.log(`  ✗ FAILED - Expected 20, got ${result.totalScore}, q1 in scores: ${!!result.questionScores.q1}\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 3: Question 4 (regulatory) counts checkboxes and maps to points
  console.log('Test 3: Question 4 (regulatory) counts checkboxes and maps to points');
  try {
    const tests = [
      { selections: ['hipaa'], expected: 2 },
      { selections: ['hipaa', 'hitech'], expected: 2 },
      { selections: ['hipaa', 'hitech', 'soc2'], expected: 4 },
      { selections: ['hipaa', 'hitech', 'soc2', 'pci_dss'], expected: 4 },
      { selections: ['hipaa', 'hitech', 'soc2', 'pci_dss', 'gdpr'], expected: 6 },
      { selections: ['hipaa', 'hitech', 'soc2', 'pci_dss', 'gdpr', 'fda'], expected: 6 },
      { selections: ['hipaa', 'hitech', 'soc2', 'pci_dss', 'gdpr', 'fda', 'nih'], expected: 8 },
      { selections: ['hipaa', 'hitech', 'soc2', 'pci_dss', 'gdpr', 'fda', 'nih', 'state_privacy'], expected: 8 },
      { selections: ['hipaa', 'hitech', 'soc2', 'pci_dss', 'gdpr', 'fda', 'nih', 'state_privacy', 'medicare_medicaid'], expected: 10 }
    ];

    let allPassed = true;
    for (const test of tests) {
      const points = getQ4Points(test.selections.length);
      if (points !== test.expected) {
        console.log(`  ✗ FAILED - ${test.selections.length} selections: expected ${test.expected}, got ${points}`);
        allPassed = false;
      }
    }
    if (allPassed) {
      console.log('  ✓ PASSED - Q4 checkbox count maps to points correctly\n');
      passed++;
    } else {
      console.log('\n');
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 4: Returns total score (10-100 range)
  console.log('Test 4: Returns total score (10-100 range)');
  try {
    // Test minimum score (all lowest options)
    const minResult = calculateRiskScore({
      q2: '7_10_years',
      q3: 'under_10',
      q4: ['hipaa'],
      q5: '1_10',
      q6: 'none',
      q7: 'none',
      q8: 'minimal',
      q9: 'none',
      q10: 'active',
      q11: 'complete'
    });

    // Test maximum score (all highest options)
    const maxResult = calculateRiskScore({
      q2: '50_plus_years',
      q3: 'over_60',
      q4: ['hipaa', 'hitech', 'soc2', 'pci_dss', 'gdpr', 'fda', 'nih', 'state_privacy', 'medicare_medicaid'],
      q5: 'over_100',
      q6: 'major',
      q7: 'federal',
      q8: 'critical',
      q9: 'major',
      q10: 'none',
      q11: 'unknown'
    });

    if (minResult.totalScore >= 10 && minResult.totalScore <= 100 &&
        maxResult.totalScore >= 10 && maxResult.totalScore <= 100 &&
        minResult.totalScore === 20 && maxResult.totalScore === 100) {
      console.log(`  ✓ PASSED - Min score: ${minResult.totalScore}, Max score: ${maxResult.totalScore}\n`);
      passed++;
    } else {
      console.log(`  ✗ FAILED - Min: ${minResult.totalScore} (expected 20), Max: ${maxResult.totalScore} (expected 100)\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 5: Returns risk level mapping
  console.log('Test 5: Returns risk level: LOW (10-30), MODERATE (31-50), HIGH (51-70), CRITICAL (71-85), SEVERE (86-100)');
  try {
    const tests = [
      { score: 10, expected: 'LOW' },
      { score: 30, expected: 'LOW' },
      { score: 31, expected: 'MODERATE' },
      { score: 50, expected: 'MODERATE' },
      { score: 51, expected: 'HIGH' },
      { score: 70, expected: 'HIGH' },
      { score: 71, expected: 'CRITICAL' },
      { score: 85, expected: 'CRITICAL' },
      { score: 86, expected: 'SEVERE' },
      { score: 100, expected: 'SEVERE' }
    ];

    let allPassed = true;
    for (const test of tests) {
      const level = getRiskLevel(test.score);
      if (level.label !== test.expected) {
        console.log(`  ✗ Score ${test.score}: expected ${test.expected}, got ${level.label}`);
        allPassed = false;
      }
    }
    if (allPassed) {
      console.log('  ✓ PASSED - All risk level boundaries correct\n');
      passed++;
    } else {
      console.log('\n');
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 6: Returns top 3 highest-scoring question IDs as weakest areas
  console.log('Test 6: Returns top 3 highest-scoring question IDs as weakest areas');
  try {
    const result = calculateRiskScore({
      q2: '50_plus_years', // 10 points - should be in top 3
      q3: 'under_10', // 2 points
      q4: ['hipaa'], // 2 points
      q5: 'over_100', // 10 points - should be in top 3
      q6: 'none', // 2 points
      q7: 'none', // 2 points
      q8: 'critical', // 10 points - should be in top 3
      q9: 'none', // 2 points
      q10: 'active', // 2 points
      q11: 'complete' // 2 points
    });

    const weakestIds = result.weakestAreas.map(w => w.questionId);
    const hasCorrectTop3 =
      weakestIds.includes('q2') &&
      weakestIds.includes('q5') &&
      weakestIds.includes('q8') &&
      result.weakestAreas.length === 3;

    if (hasCorrectTop3) {
      console.log(`  ✓ PASSED - Top 3 weakest areas identified: ${weakestIds.join(', ')}\n`);
      passed++;
    } else {
      console.log(`  ✗ FAILED - Expected q2, q5, q8 in top 3, got: ${weakestIds.join(', ')}\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 7: Edge case - minimum possible score
  console.log('Test 7: Edge case - minimum possible score (all lowest options)');
  try {
    const result = calculateRiskScore({
      q2: '7_10_years',
      q3: 'under_10',
      q4: ['hipaa'],
      q5: '1_10',
      q6: 'none',
      q7: 'none',
      q8: 'minimal',
      q9: 'none',
      q10: 'active',
      q11: 'complete'
    });

    if (result.totalScore === 20 && result.riskLevel === 'LOW') {
      console.log(`  ✓ PASSED - Minimum score: ${result.totalScore}, Level: ${result.riskLevel}\n`);
      passed++;
    } else {
      console.log(`  ✗ FAILED - Score: ${result.totalScore}, Level: ${result.riskLevel}\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 8: Edge case - maximum possible score
  console.log('Test 8: Edge case - maximum possible score (all highest options)');
  try {
    const result = calculateRiskScore({
      q2: '50_plus_years',
      q3: 'over_60',
      q4: ['hipaa', 'hitech', 'soc2', 'pci_dss', 'gdpr', 'fda', 'nih', 'state_privacy', 'medicare_medicaid'],
      q5: 'over_100',
      q6: 'major',
      q7: 'federal',
      q8: 'critical',
      q9: 'major',
      q10: 'none',
      q11: 'unknown'
    });

    if (result.totalScore === 100 && result.riskLevel === 'SEVERE') {
      console.log(`  ✓ PASSED - Maximum score: ${result.totalScore}, Level: ${result.riskLevel}\n`);
      passed++;
    } else {
      console.log(`  ✗ FAILED - Score: ${result.totalScore}, Level: ${result.riskLevel}\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 9: Edge case - mixed score (middle range)
  console.log('Test 9: Edge case - mixed score (middle range)');
  try {
    const result = calculateRiskScore({
      q2: '20_30_years', // 6 points
      q3: '25_40', // 6 points
      q4: ['hipaa', 'hitech', 'soc2', 'pci_dss', 'gdpr'], // 5 = 6 points
      q5: '26_50', // 6 points
      q6: 'moderate', // 6 points
      q7: 'regional', // 4 points
      q8: 'moderate', // 6 points
      q9: 'one_breach', // 6 points
      q10: 'it_aware', // 6 points
      q11: 'planned' // 6 points
    });

    // Expected: 6+6+6+6+6+4+6+6+6+6 = 58 (HIGH risk)
    if (result.totalScore === 58 && result.riskLevel === 'HIGH') {
      console.log(`  ✓ PASSED - Mixed score: ${result.totalScore}, Level: ${result.riskLevel}\n`);
      passed++;
    } else {
      console.log(`  ✗ FAILED - Score: ${result.totalScore} (expected 58), Level: ${result.riskLevel}\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 10: Error handling - invalid responses
  console.log('Test 10: Error handling - invalid/null responses');
  try {
    let errorThrown = false;
    try {
      calculateRiskScore(null);
    } catch (e) {
      errorThrown = true;
    }
    if (errorThrown) {
      console.log('  ✓ PASSED - Error thrown for null responses\n');
      passed++;
    } else {
      console.log('  ✗ FAILED - No error thrown for null responses\n');
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  // Test 11: Weakest areas include question details
  console.log('Test 11: Weakest areas include question details');
  try {
    const result = calculateRiskScore({
      q2: '50_plus_years',
      q3: 'under_10',
      q4: ['hipaa'],
      q5: '1_10',
      q6: 'none',
      q7: 'none',
      q8: 'minimal',
      q9: 'none',
      q10: 'active',
      q11: 'complete'
    });

    const firstWeakest = result.weakestAreas[0];
    if (firstWeakest.questionId && firstWeakest.score && firstWeakest.question && firstWeakest.question.text) {
      console.log(`  ✓ PASSED - Weakest area includes: questionId, score, and question details\n`);
      passed++;
    } else {
      console.log(`  ✗ FAILED - Missing required properties in weakest area\n`);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAILED -', e.message, '\n');
    failed++;
  }

  console.log('=====================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('=====================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
