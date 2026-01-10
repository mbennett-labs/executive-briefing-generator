/**
 * Risk Score Calculation Service
 * Story-005: Risk score calculation logic
 *
 * Calculates total risk score from assessment responses (Q2-Q11)
 * Q1 is organization size - not scored, used for cost projections
 * Q4 is multiselect - scoring based on count of selections
 */

const { questions } = require('../data/questions');

// Risk level thresholds and mappings
const RISK_LEVELS = {
  LOW: { min: 10, max: 30, label: 'LOW', color: 'green', urgency: 'Plan within 12-18 months' },
  MODERATE: { min: 31, max: 50, label: 'MODERATE', color: 'yellow', urgency: 'Start planning within 6 months' },
  HIGH: { min: 51, max: 70, label: 'HIGH', color: 'orange', urgency: 'Begin migration planning immediately' },
  CRITICAL: { min: 71, max: 85, label: 'CRITICAL', color: 'red', urgency: 'Urgent action required' },
  SEVERE: { min: 86, max: 100, label: 'SEVERE', color: 'darkred', urgency: 'Emergency response needed' }
};

/**
 * Get points for Q4 (regulatory complexity) based on number of selections
 * @param {number} count - Number of regulatory frameworks selected
 * @returns {number} Points value
 */
function getQ4Points(count) {
  if (count <= 0) return 0;
  if (count <= 2) return 2;
  if (count <= 4) return 4;
  if (count <= 6) return 6;
  if (count <= 8) return 8;
  return 10; // 9+
}

/**
 * Get points for a single question response
 * @param {string} questionId - Question ID (e.g., 'q2')
 * @param {string|string[]} response - Response value or array of values for multiselect
 * @returns {number} Points for this question
 */
function getQuestionPoints(questionId, response) {
  const question = questions.find(q => q.id === questionId);

  if (!question || !question.scored) {
    return 0;
  }

  // Handle multiselect (Q4)
  if (question.type === 'multiselect') {
    const selections = Array.isArray(response) ? response : [];
    return getQ4Points(selections.length);
  }

  // Handle dropdown - find the option and return its points
  const option = question.options.find(opt => opt.value === response);
  return option ? option.points : 0;
}

/**
 * Determine risk level from total score
 * @param {number} score - Total risk score
 * @returns {object} Risk level object with label, color, and urgency
 */
function getRiskLevel(score) {
  if (score <= RISK_LEVELS.LOW.max) return RISK_LEVELS.LOW;
  if (score <= RISK_LEVELS.MODERATE.max) return RISK_LEVELS.MODERATE;
  if (score <= RISK_LEVELS.HIGH.max) return RISK_LEVELS.HIGH;
  if (score <= RISK_LEVELS.CRITICAL.max) return RISK_LEVELS.CRITICAL;
  return RISK_LEVELS.SEVERE;
}

/**
 * Get top N highest-scoring questions (weakest areas)
 * @param {object} questionScores - Object mapping question IDs to their scores
 * @param {number} n - Number of top questions to return
 * @returns {Array} Array of question IDs sorted by score descending
 */
function getWeakestAreas(questionScores, n = 3) {
  return Object.entries(questionScores)
    .filter(([id]) => id !== 'q1') // Exclude Q1 (not scored)
    .sort((a, b) => b[1] - a[1]) // Sort by score descending
    .slice(0, n)
    .map(([id, score]) => ({
      questionId: id,
      score,
      question: questions.find(q => q.id === id)
    }));
}

/**
 * Calculate risk score from assessment responses
 * @param {object} responses - Object mapping question IDs to response values
 *                            e.g., { q1: 'under_50k', q2: '10_20_years', q4: ['hipaa', 'hitech'], ... }
 * @returns {object} Score results including total, risk level, and weakest areas
 */
function calculateRiskScore(responses) {
  if (!responses || typeof responses !== 'object') {
    throw new Error('Responses must be a valid object');
  }

  const questionScores = {};
  let totalScore = 0;

  // Calculate score for each scored question (Q2-Q11)
  for (const question of questions) {
    if (!question.scored) continue;

    const response = responses[question.id];
    const points = getQuestionPoints(question.id, response);

    questionScores[question.id] = points;
    totalScore += points;
  }

  // Ensure score is within valid range
  totalScore = Math.max(10, Math.min(100, totalScore));

  // Get risk level
  const riskLevel = getRiskLevel(totalScore);

  // Get top 3 weakest areas
  const weakestAreas = getWeakestAreas(questionScores, 3);

  return {
    totalScore,
    riskLevel: riskLevel.label,
    riskColor: riskLevel.color,
    urgency: riskLevel.urgency,
    questionScores,
    weakestAreas
  };
}

module.exports = {
  calculateRiskScore,
  getQuestionPoints,
  getQ4Points,
  getRiskLevel,
  getWeakestAreas,
  RISK_LEVELS
};
