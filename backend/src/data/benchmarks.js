/**
 * Healthcare Industry Benchmark Data
 *
 * Average scores and percentile thresholds based on typical
 * healthcare organization security posture assessments.
 */

// Average scores per category for healthcare industry
const HEALTHCARE_AVERAGES = {
  data_sensitivity: 45,      // Most orgs have significant PHI exposure
  encryption: 52,            // Moderate encryption practices
  compliance: 58,            // Reasonable compliance due to HIPAA
  vendor_risk: 42,           // Vendor management often weak
  incident_response: 48,     // Room for improvement
  quantum_readiness: 25,     // Very few are PQC-ready
  overall: 47                // Weighted average
};

// Percentile thresholds (score needed to be at or above percentile)
const PERCENTILE_THRESHOLDS = {
  25: 35,   // Bottom quartile: score < 35
  50: 47,   // Median: score 35-47
  75: 62,   // Third quartile: score 48-62
  90: 78    // Top 10%: score 63-78, above 78 = top 10%
};

/**
 * Get percentile ranking for a given score
 * @param {number} score - Overall score (0-100)
 * @returns {number} Percentile ranking (0-100)
 */
function getPercentile(score) {
  if (score < PERCENTILE_THRESHOLDS[25]) {
    // Linear interpolation from 0 to 25th percentile
    return Math.round((score / PERCENTILE_THRESHOLDS[25]) * 25);
  }
  if (score < PERCENTILE_THRESHOLDS[50]) {
    // Linear interpolation from 25th to 50th percentile
    const range = PERCENTILE_THRESHOLDS[50] - PERCENTILE_THRESHOLDS[25];
    const offset = score - PERCENTILE_THRESHOLDS[25];
    return Math.round(25 + (offset / range) * 25);
  }
  if (score < PERCENTILE_THRESHOLDS[75]) {
    // Linear interpolation from 50th to 75th percentile
    const range = PERCENTILE_THRESHOLDS[75] - PERCENTILE_THRESHOLDS[50];
    const offset = score - PERCENTILE_THRESHOLDS[50];
    return Math.round(50 + (offset / range) * 25);
  }
  if (score < PERCENTILE_THRESHOLDS[90]) {
    // Linear interpolation from 75th to 90th percentile
    const range = PERCENTILE_THRESHOLDS[90] - PERCENTILE_THRESHOLDS[75];
    const offset = score - PERCENTILE_THRESHOLDS[75];
    return Math.round(75 + (offset / range) * 15);
  }
  // Above 90th percentile
  // Linear interpolation from 90 to 100
  const range = 100 - PERCENTILE_THRESHOLDS[90];
  const offset = Math.min(score - PERCENTILE_THRESHOLDS[90], range);
  return Math.round(90 + (offset / range) * 10);
}

/**
 * Get benchmark comparison for all categories
 * @param {object} categoryScores - Object with category scores
 * @param {number} overallScore - Overall assessment score
 * @returns {object} Comparison object with differences from average
 */
function getBenchmarkComparison(categoryScores, overallScore) {
  const comparison = {
    categories: {},
    overall: {
      score: overallScore,
      average: HEALTHCARE_AVERAGES.overall,
      difference: overallScore - HEALTHCARE_AVERAGES.overall,
      percentile: getPercentile(overallScore)
    }
  };

  for (const [category, score] of Object.entries(categoryScores)) {
    const average = HEALTHCARE_AVERAGES[category] || 50;
    comparison.categories[category] = {
      score,
      average,
      difference: score - average,
      status: score >= average ? 'above' : 'below'
    };
  }

  return comparison;
}

module.exports = {
  HEALTHCARE_AVERAGES,
  PERCENTILE_THRESHOLDS,
  getPercentile,
  getBenchmarkComparison
};
