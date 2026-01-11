/**
 * Assessments Routes
 * Handles 48-question post-quantum security assessments
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const Assessment = require('../models/assessment');
const { calculateScores, getRiskLevel } = require('../utils/scoring');
const { getPercentile, getBenchmarkComparison } = require('../data/benchmarks');

/**
 * Validate assessment submission
 * @param {object} body - Request body
 * @param {Array} questions - Questions from database
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validateSubmission(body, questions) {
  const errors = [];
  const { organization_name, organization_type, employee_count, responses } = body;

  // Validate organization details
  if (!organization_name || typeof organization_name !== 'string') {
    errors.push('organization_name is required');
  }
  if (!organization_type || typeof organization_type !== 'string') {
    errors.push('organization_type is required');
  }
  if (!employee_count || typeof employee_count !== 'string') {
    errors.push('employee_count is required');
  }

  // Validate responses object
  if (!responses || typeof responses !== 'object') {
    errors.push('responses must be a valid object');
    return { valid: false, errors };
  }

  // Check each question has a response
  for (const question of questions) {
    const response = responses[question.id];

    if (response === undefined || response === null || response === '') {
      errors.push(`Question ${question.id} is required`);
      continue;
    }

    // Validate response format based on question type
    if (question.answer_type === 'multi-select') {
      if (!Array.isArray(response)) {
        errors.push(`Question ${question.id} must be an array`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// POST /api/assessments - Submit a new assessment
router.post('/', requireAuth, async (req, res) => {
  try {
    const { organization_name, organization_type, employee_count, responses } = req.body;

    // Fetch questions from database
    const questions = await db('questions').select('*').orderBy('order_index', 'asc');

    // Validate submission
    const validation = validateSubmission(req.body, questions);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Calculate scores using the new scoring utility
    const { category_scores, overall_score } = calculateScores(responses, questions);

    // Get risk level
    const riskLevel = getRiskLevel(overall_score);

    // Get percentile and benchmark comparison
    const percentile = getPercentile(overall_score);
    const benchmarks = getBenchmarkComparison(category_scores, overall_score);

    // Save assessment to database
    const assessment = await Assessment.create({
      user_id: req.user.id,
      organization_name,
      organization_type,
      employee_count,
      responses,
      scores: category_scores,
      overall_score,
      risk_level: riskLevel.level
    });

    // Return assessment with full score details
    res.status(201).json({
      id: assessment.id,
      scores: {
        category_scores,
        overall_score,
        risk_level: riskLevel.level,
        risk_color: riskLevel.color,
        percentile,
        benchmarks
      }
    });
  } catch (error) {
    console.error('Assessment submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/assessments - Get user's assessments
router.get('/', requireAuth, async (req, res) => {
  try {
    const assessments = await Assessment.findByUserId(req.user.id);

    // Return assessments with summary info (ordered by created_at desc from model)
    const summaries = assessments.map(a => ({
      id: a.id,
      risk_score: a.risk_score,
      risk_level: a.risk_level,
      created_at: a.created_at
    }));

    res.status(200).json({ assessments: summaries });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/assessments/:id - Get a single assessment with full details
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const assessmentId = parseInt(req.params.id, 10);

    if (isNaN(assessmentId)) {
      return res.status(400).json({ error: 'Invalid assessment ID' });
    }

    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Verify assessment belongs to authenticated user
    if (assessment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate full scoring details from stored responses
    const scoreResult = calculateRiskScore(assessment.responses);

    res.status(200).json({
      assessment: Assessment.toPublic(assessment),
      scoring: {
        totalScore: scoreResult.totalScore,
        riskLevel: scoreResult.riskLevel,
        riskColor: scoreResult.riskColor,
        urgency: scoreResult.urgency,
        weakestAreas: scoreResult.weakestAreas
      }
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
