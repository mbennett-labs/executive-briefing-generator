/**
 * Assessments Routes
 * Story-006: Submit assessment endpoint
 * Story-007: Get user assessments endpoint
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Assessment = require('../models/assessment');
const { calculateRiskScore } = require('../services/scoring');
const { questions } = require('../data/questions');

/**
 * Validate that all 11 questions are answered
 * @param {object} responses - Response object
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validateResponses(responses) {
  const errors = [];

  if (!responses || typeof responses !== 'object') {
    return { valid: false, errors: ['Responses must be a valid object'] };
  }

  // Check each question has a response
  for (const question of questions) {
    const response = responses[question.id];

    if (response === undefined || response === null || response === '') {
      errors.push(`Question ${question.id} is required`);
      continue;
    }

    // Validate response format based on question type
    if (question.type === 'multiselect') {
      if (!Array.isArray(response)) {
        errors.push(`Question ${question.id} must be an array`);
        continue;
      }
      if (response.length === 0) {
        errors.push(`Question ${question.id} requires at least one selection`);
        continue;
      }
      // Validate each selection is a valid option
      const validValues = question.options.map(o => o.value);
      for (const value of response) {
        if (!validValues.includes(value)) {
          errors.push(`Question ${question.id} has invalid selection: ${value}`);
        }
      }
    } else {
      // Dropdown - validate single value
      if (typeof response !== 'string') {
        errors.push(`Question ${question.id} must be a string`);
        continue;
      }
      const validValues = question.options.map(o => o.value);
      if (!validValues.includes(response)) {
        errors.push(`Question ${question.id} has invalid value: ${response}`);
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
    const { responses } = req.body;

    // Validate all 11 questions are answered
    const validation = validateResponses(responses);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Calculate risk score
    const scoreResult = calculateRiskScore(responses);

    // Save assessment to database
    const assessment = await Assessment.create({
      user_id: req.user.id,
      responses,
      risk_score: scoreResult.totalScore,
      risk_level: scoreResult.riskLevel
    });

    // Return assessment with full score details
    res.status(201).json({
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
