/**
 * Test Suite: Report Content Generation
 * Story-013: PDF report content generation
 */

const {
  generateReportContent,
  getOrgSize,
  calculateCostProjections,
  generateBudgetEstimate,
  generateRecommendations,
  formatCurrency,
  formatNumber,
  ORG_SIZE_CONFIG,
  EXECUTIVE_SUMMARIES,
  RECOMMENDATIONS,
  STATIC_CONTENT
} = require('../src/services/reportContent');

// Sample test data
const sampleUser = {
  id: 1,
  name: 'Jane Smith',
  email: 'jane@hospital.org',
  organization_name: 'Metro General Hospital'
};

const sampleAssessment = {
  id: 42,
  user_id: 1,
  responses: {
    q1: '250k_1m', // Large hospital
    q2: '50_plus_years',
    q3: 'over_60',
    q4: ['hipaa', 'hitech', 'pci_dss', 'state_privacy'],
    q5: '51_100',
    q6: 'significant',
    q7: 'state',
    q8: 'critical',
    q9: 'one_breach',
    q10: 'minimal',
    q11: 'unknown'
  },
  risk_score: 78,
  risk_level: 'CRITICAL',
  created_at: '2026-01-10T10:30:00.000Z'
};

const sampleScoring = {
  totalScore: 78,
  riskLevel: 'CRITICAL',
  riskColor: 'red',
  urgency: 'Urgent action required',
  weakestAreas: [
    {
      questionId: 'q2',
      score: 10,
      question: {
        id: 'q2',
        text: 'How long does your organization retain patient records?',
        category: 'data_retention'
      }
    },
    {
      questionId: 'q11',
      score: 10,
      question: {
        id: 'q11',
        text: 'Has your organization inventoried its current cryptographic systems?',
        category: 'migration_readiness'
      }
    },
    {
      questionId: 'q3',
      score: 10,
      question: {
        id: 'q3',
        text: 'What percentage of your critical systems are more than 10 years old?',
        category: 'legacy_systems'
      }
    }
  ]
};

function runTests() {
  console.log('\n=== Report Content Generation Tests ===\n');
  let passed = 0;
  let failed = 0;

  // Test 1: generateReportContent accepts assessment data and user info
  {
    try {
      const content = generateReportContent({
        assessment: sampleAssessment,
        user: sampleUser,
        scoring: sampleScoring
      });
      if (content && typeof content === 'object') {
        console.log('✓ Test 1: Function accepts assessment data and user info');
        passed++;
      } else {
        console.log('✗ Test 1: Function should return an object');
        failed++;
      }
    } catch (err) {
      console.log('✗ Test 1: Function threw error:', err.message);
      failed++;
    }
  }

  // Test 2: Generates executive summary paragraph based on risk level
  {
    const content = generateReportContent({
      assessment: sampleAssessment,
      user: sampleUser,
      scoring: sampleScoring
    });

    if (content.executiveSummary &&
        content.executiveSummary.summary &&
        content.executiveSummary.summary.includes('Metro General Hospital') &&
        content.executiveSummary.summary.includes('78/100') &&
        content.executiveSummary.summary.includes('CRITICAL')) {
      console.log('✓ Test 2: Generates executive summary paragraph based on risk level');
      passed++;
    } else {
      console.log('✗ Test 2: Executive summary should include org name, score, and risk level');
      console.log('  Got:', content.executiveSummary?.summary?.substring(0, 100));
      failed++;
    }
  }

  // Test 3: Calculates cost projections based on org size
  {
    const content = generateReportContent({
      assessment: sampleAssessment,
      user: sampleUser,
      scoring: sampleScoring
    });

    const costs = content.costOfInaction;
    if (costs &&
        costs.projections &&
        costs.projections.breachCost &&
        costs.projections.regulatoryFines &&
        costs.projections.total &&
        costs.projections.total.value > 0) {
      console.log('✓ Test 3: Calculates cost projections based on org size');
      passed++;
    } else {
      console.log('✗ Test 3: Cost projections should include breach cost, fines, and total');
      failed++;
    }
  }

  // Test 4: Generates 3 priority recommendations based on weakest areas
  {
    const content = generateReportContent({
      assessment: sampleAssessment,
      user: sampleUser,
      scoring: sampleScoring
    });

    const recs = content.recommendations;
    if (recs &&
        recs.items &&
        recs.items.length === 3 &&
        recs.items[0].rank === 1 &&
        recs.items[0].title &&
        recs.items[0].actions &&
        recs.items[0].actions.length > 0) {
      console.log('✓ Test 4: Generates 3 priority recommendations based on weakest areas');
      passed++;
    } else {
      console.log('✗ Test 4: Should generate exactly 3 recommendations with title and actions');
      console.log('  Got:', recs?.items?.length, 'recommendations');
      failed++;
    }
  }

  // Test 5: Generates budget estimate based on org size
  {
    const content = generateReportContent({
      assessment: sampleAssessment,
      user: sampleUser,
      scoring: sampleScoring
    });

    const budget = content.budgetEstimate;
    if (budget &&
        budget.phases &&
        budget.phases.length === 4 &&
        budget.total &&
        budget.total.budgetRange &&
        budget.total.duration) {
      console.log('✓ Test 5: Generates budget estimate based on org size');
      passed++;
    } else {
      console.log('✗ Test 5: Budget should include phases, total range, and duration');
      failed++;
    }
  }

  // Test 6: All text content returned as structured object
  {
    const content = generateReportContent({
      assessment: sampleAssessment,
      user: sampleUser,
      scoring: sampleScoring
    });

    const requiredSections = [
      'metadata',
      'coverPage',
      'executiveSummary',
      'riskProfile',
      'quantumThreat',
      'costOfInaction',
      'recommendations',
      'budgetEstimate',
      'timeline',
      'nextSteps'
    ];

    const missingSections = requiredSections.filter(s => !content[s]);

    if (missingSections.length === 0) {
      console.log('✓ Test 6: All text content returned as structured object');
      passed++;
    } else {
      console.log('✗ Test 6: Missing sections:', missingSections.join(', '));
      failed++;
    }
  }

  // Test 7: Includes static content sections (quantum threat explanation)
  {
    const content = generateReportContent({
      assessment: sampleAssessment,
      user: sampleUser,
      scoring: sampleScoring
    });

    if (content.quantumThreat &&
        content.quantumThreat.title &&
        content.quantumThreat.sections &&
        content.quantumThreat.sections.length >= 3) {
      console.log('✓ Test 7: Includes quantum threat explanation static content');
      passed++;
    } else {
      console.log('✗ Test 7: Quantum threat section should have title and 3+ sections');
      failed++;
    }
  }

  // Test 8: Includes static content sections (timeline)
  {
    const content = generateReportContent({
      assessment: sampleAssessment,
      user: sampleUser,
      scoring: sampleScoring
    });

    if (content.timeline &&
        content.timeline.title &&
        content.timeline.sections &&
        content.timeline.sections.length >= 3) {
      console.log('✓ Test 8: Includes timeline static content');
      passed++;
    } else {
      console.log('✗ Test 8: Timeline section should have title and 3+ sections');
      failed++;
    }
  }

  // Test 9: Executive summary varies by risk level
  {
    const lowRiskAssessment = {
      ...sampleAssessment,
      risk_score: 25,
      risk_level: 'LOW'
    };
    const lowRiskScoring = {
      ...sampleScoring,
      totalScore: 25,
      riskLevel: 'LOW'
    };

    const lowContent = generateReportContent({
      assessment: lowRiskAssessment,
      user: sampleUser,
      scoring: lowRiskScoring
    });

    const highContent = generateReportContent({
      assessment: sampleAssessment,
      user: sampleUser,
      scoring: sampleScoring
    });

    if (lowContent.executiveSummary.summary !== highContent.executiveSummary.summary &&
        lowContent.executiveSummary.summary.includes('LOW') &&
        highContent.executiveSummary.summary.includes('CRITICAL')) {
      console.log('✓ Test 9: Executive summary varies by risk level');
      passed++;
    } else {
      console.log('✗ Test 9: Different risk levels should produce different summaries');
      failed++;
    }
  }

  // Test 10: Cost projections scale with organization size
  {
    const smallOrgAssessment = {
      ...sampleAssessment,
      responses: { ...sampleAssessment.responses, q1: 'under_50k' }
    };
    const largeOrgAssessment = {
      ...sampleAssessment,
      responses: { ...sampleAssessment.responses, q1: 'over_5m' }
    };

    const smallContent = generateReportContent({
      assessment: smallOrgAssessment,
      user: sampleUser,
      scoring: sampleScoring
    });

    const largeContent = generateReportContent({
      assessment: largeOrgAssessment,
      user: sampleUser,
      scoring: sampleScoring
    });

    if (largeContent.costOfInaction.projections.total.value >
        smallContent.costOfInaction.projections.total.value) {
      console.log('✓ Test 10: Cost projections scale with organization size');
      passed++;
    } else {
      console.log('✗ Test 10: Larger orgs should have higher cost projections');
      console.log('  Small org:', smallContent.costOfInaction.projections.total.formatted);
      console.log('  Large org:', largeContent.costOfInaction.projections.total.formatted);
      failed++;
    }
  }

  // Test 11: Budget estimates scale with organization size
  {
    const smallOrgAssessment = {
      ...sampleAssessment,
      responses: { ...sampleAssessment.responses, q1: 'under_50k' }
    };
    const largeOrgAssessment = {
      ...sampleAssessment,
      responses: { ...sampleAssessment.responses, q1: 'over_5m' }
    };

    const smallContent = generateReportContent({
      assessment: smallOrgAssessment,
      user: sampleUser,
      scoring: sampleScoring
    });

    const largeContent = generateReportContent({
      assessment: largeOrgAssessment,
      user: sampleUser,
      scoring: sampleScoring
    });

    // Parse currency strings to compare
    const smallMax = parseInt(smallContent.budgetEstimate.total.budgetRange.max.replace(/[^0-9]/g, ''));
    const largeMax = parseInt(largeContent.budgetEstimate.total.budgetRange.max.replace(/[^0-9]/g, ''));

    if (largeMax > smallMax) {
      console.log('✓ Test 11: Budget estimates scale with organization size');
      passed++;
    } else {
      console.log('✗ Test 11: Larger orgs should have higher budget estimates');
      console.log('  Small org:', smallContent.budgetEstimate.total.budgetRange.max);
      console.log('  Large org:', largeContent.budgetEstimate.total.budgetRange.max);
      failed++;
    }
  }

  // Test 12: Recommendations match weakest areas categories
  {
    const content = generateReportContent({
      assessment: sampleAssessment,
      user: sampleUser,
      scoring: sampleScoring
    });

    const recCategories = content.recommendations.items.map(r => r.category);
    const weakestCategories = sampleScoring.weakestAreas.map(w => w.question.category);

    const matchCount = recCategories.filter(c => weakestCategories.includes(c)).length;

    if (matchCount >= 2) {
      console.log('✓ Test 12: Recommendations match weakest areas categories');
      passed++;
    } else {
      console.log('✗ Test 12: At least 2 recommendations should match weakest area categories');
      console.log('  Rec categories:', recCategories);
      console.log('  Weakest categories:', weakestCategories);
      failed++;
    }
  }

  // Test 13: Cover page has required fields
  {
    const content = generateReportContent({
      assessment: sampleAssessment,
      user: sampleUser,
      scoring: sampleScoring
    });

    const cover = content.coverPage;
    if (cover.title &&
        cover.organizationName === 'Metro General Hospital' &&
        cover.date &&
        cover.preparedBy) {
      console.log('✓ Test 13: Cover page has required fields');
      passed++;
    } else {
      console.log('✗ Test 13: Cover page missing required fields');
      failed++;
    }
  }

  // Test 14: Next steps includes QSL contact info
  {
    const content = generateReportContent({
      assessment: sampleAssessment,
      user: sampleUser,
      scoring: sampleScoring
    });

    if (content.nextSteps &&
        content.nextSteps.contact &&
        content.nextSteps.contact.website &&
        content.nextSteps.contact.email &&
        content.nextSteps.offerings &&
        content.nextSteps.offerings.length > 0) {
      console.log('✓ Test 14: Next steps includes QSL contact info and offerings');
      passed++;
    } else {
      console.log('✗ Test 14: Next steps should include contact info and offerings');
      failed++;
    }
  }

  // Summary
  console.log(`\n=== Results: ${passed}/${passed + failed} tests passed ===\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
