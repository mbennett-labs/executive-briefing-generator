/**
 * Scoring Algorithm for Post-Quantum Security Assessment
 *
 * Calculates category scores and overall score based on assessment responses.
 * Each answer is scored 0-100 based on the organization's security posture.
 * Better security practices = higher scores.
 */

// Category weights (must sum to 1.0)
const CATEGORY_WEIGHTS = {
  data_sensitivity: 0.20,      // 20%
  encryption: 0.25,            // 25%
  compliance: 0.15,            // 15%
  vendor_risk: 0.15,           // 15%
  incident_response: 0.10,     // 10%
  quantum_readiness: 0.15      // 15%
};

// Risk level thresholds
const RISK_LEVELS = {
  CRITICAL: { min: 0, max: 30, level: 'Critical', color: 'red' },
  HIGH: { min: 31, max: 50, level: 'High', color: 'orange' },
  MODERATE: { min: 51, max: 70, level: 'Moderate', color: 'yellow' },
  LOW: { min: 71, max: 85, level: 'Low', color: 'lightgreen' },
  PREPARED: { min: 86, max: 100, level: 'Prepared', color: 'green' }
};

/**
 * Get risk level from score
 * @param {number} score - Score from 0-100
 * @returns {object} Object with level (string) and color (string)
 */
function getRiskLevel(score) {
  if (score <= RISK_LEVELS.CRITICAL.max) {
    return { level: RISK_LEVELS.CRITICAL.level, color: RISK_LEVELS.CRITICAL.color };
  }
  if (score <= RISK_LEVELS.HIGH.max) {
    return { level: RISK_LEVELS.HIGH.level, color: RISK_LEVELS.HIGH.color };
  }
  if (score <= RISK_LEVELS.MODERATE.max) {
    return { level: RISK_LEVELS.MODERATE.level, color: RISK_LEVELS.MODERATE.color };
  }
  if (score <= RISK_LEVELS.LOW.max) {
    return { level: RISK_LEVELS.LOW.level, color: RISK_LEVELS.LOW.color };
  }
  return { level: RISK_LEVELS.PREPARED.level, color: RISK_LEVELS.PREPARED.color };
}

// Scoring mappings for different answer types
// For range/radio questions, later options typically indicate better security posture
// For multi-select, fewer selections of sensitive data types = better score

/**
 * Score a multi-select answer (like PHI types or cloud providers)
 * Fewer selections typically indicates less exposure/risk
 * @param {string[]} selections - Array of selected options
 * @param {number} maxOptions - Maximum number of options available
 * @param {boolean} invertScore - If true, more selections = higher score (for protective measures)
 * @returns {number} Score from 0-100
 */
function scoreMultiSelect(selections, maxOptions, invertScore = false) {
  if (!Array.isArray(selections) || selections.length === 0) {
    return invertScore ? 0 : 100;
  }

  const ratio = selections.length / maxOptions;
  const baseScore = Math.round((1 - ratio) * 100);

  return invertScore ? (100 - baseScore) : baseScore;
}

/**
 * Score a range/radio answer based on option index
 * Higher index = better security posture (questions are designed this way)
 * @param {string} selection - Selected option value
 * @param {string[]} options - Array of all available options
 * @returns {number} Score from 0-100
 */
function scoreRange(selection, options) {
  if (!selection || !Array.isArray(options) || options.length === 0) {
    return 0;
  }

  const index = options.indexOf(selection);
  if (index === -1) return 0;

  // Linear scoring: first option = 0, last option = 100
  const maxIndex = options.length - 1;
  if (maxIndex === 0) return 100;

  return Math.round((index / maxIndex) * 100);
}

/**
 * Score a yes-no question
 * @param {string} selection - 'Yes', 'No', or 'Unsure'
 * @param {boolean} yesIsBetter - If true, 'Yes' = 100, 'No' = 0
 * @returns {number} Score from 0-100
 */
function scoreYesNo(selection, yesIsBetter = false) {
  if (selection === 'Yes') return yesIsBetter ? 100 : 0;
  if (selection === 'No') return yesIsBetter ? 0 : 100;
  return 50; // Unsure
}

/**
 * Score a single question response
 * @param {number} questionId - Question ID
 * @param {*} response - Response value(s)
 * @param {object} questionMeta - Question metadata (answer_type, answer_options)
 * @returns {number} Score from 0-100
 */
function scoreQuestion(questionId, response, questionMeta) {
  const { answer_type, answer_options } = questionMeta;
  const options = typeof answer_options === 'string'
    ? JSON.parse(answer_options)
    : answer_options;

  switch (answer_type) {
    case 'multi-select':
      // For data sensitivity questions, more PHI types = more risk (lower score)
      // Question 1 (PHI types): more = worse
      // Question 28 (cloud providers): neutral, but more = more complexity
      return scoreMultiSelect(response, options.length, false);

    case 'range':
      // Range questions are designed with better options at higher indices
      return scoreRange(response, options);

    case 'yes-no':
      // For Q4 (long-term sensitive data): Yes = worse security posture
      // Storing 10+ year sensitive data increases quantum risk
      return scoreYesNo(response, false);

    default:
      return 0;
  }
}

/**
 * Calculate scores for all categories from assessment responses
 * @param {object} responses - Object mapping question IDs to response values
 * @param {Array} questions - Array of question objects with metadata
 * @returns {object} Object with category_scores and overall_score
 */
function calculateScores(responses, questions) {
  if (!responses || typeof responses !== 'object') {
    throw new Error('Responses must be a valid object');
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Questions array is required');
  }

  // Group questions by category
  const questionsByCategory = {};
  for (const question of questions) {
    if (!questionsByCategory[question.category]) {
      questionsByCategory[question.category] = [];
    }
    questionsByCategory[question.category].push(question);
  }

  // Calculate score for each category
  const category_scores = {};

  for (const [category, categoryQuestions] of Object.entries(questionsByCategory)) {
    let categoryTotal = 0;
    let answeredCount = 0;

    for (const question of categoryQuestions) {
      const response = responses[question.id];
      if (response !== undefined && response !== null) {
        const score = scoreQuestion(question.id, response, {
          answer_type: question.answer_type,
          answer_options: question.answer_options
        });
        categoryTotal += score;
        answeredCount++;
      }
    }

    // Average score for category (0-100)
    category_scores[category] = answeredCount > 0
      ? Math.round(categoryTotal / answeredCount)
      : 0;
  }

  // Calculate weighted overall score
  let overall_score = 0;
  for (const [category, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    const categoryScore = category_scores[category] || 0;
    overall_score += categoryScore * weight;
  }
  overall_score = Math.round(overall_score);

  return {
    category_scores,
    overall_score
  };
}

module.exports = {
  calculateScores,
  getRiskLevel,
  scoreQuestion,
  scoreMultiSelect,
  scoreRange,
  scoreYesNo,
  CATEGORY_WEIGHTS,
  RISK_LEVELS
};
