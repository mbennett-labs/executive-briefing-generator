/**
 * Admin Routes
 * Handles admin panel operations for NotebookLM workflow
 */

const express = require('express');
const router = express.Router();
const { generateAllQueries } = require('../services/queryBuilder');
const db = require('../db');

/**
 * GET /api/admin/assessments
 * List all assessments pending report generation
 */
router.get('/assessments', async (req, res) => {
  try {
    const assessments = await db('assessments')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(50);

    res.json({ assessments });
  } catch (error) {
    console.error('[Admin] Error fetching assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

/**
 * GET /api/admin/assessments/:id
 * Get assessment details with generated queries
 */
router.get('/assessments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get assessment
    const assessment = await db('assessments').where({ id }).first();
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Get user/org info
    const user = await db('users').where({ id: assessment.user_id }).first();

    // Parse answers
    const answers = typeof assessment.responses === 'string'
      ? JSON.parse(assessment.responses)
      : assessment.responses;

    // Parse scores
    let scores = assessment.scores;
    if (typeof scores === 'string') {
      try {
        scores = JSON.parse(scores);
      } catch (e) {
        scores = {};
      }
    }

    // Build org profile
    const orgProfile = {
      name: user?.organization_name || assessment.organization_name || 'Healthcare Organization',
      type: user?.organization_type || assessment.organization_type || 'Healthcare Provider',
      employee_count: user?.employee_count || assessment.employee_count || 'Not specified'
    };

    // Build scores object
    const scoresObj = {
      overall: assessment.overall_score || assessment.risk_score || 50,
      data_sensitivity: scores?.data_sensitivity,
      encryption: scores?.encryption,
      compliance: scores?.compliance,
      vendor_risk: scores?.vendor_risk,
      incident_response: scores?.incident_response,
      quantum_readiness: scores?.quantum_readiness
    };

    // Generate queries
    const queryData = generateAllQueries({
      id: assessment.id,
      answers: answers || {},
      orgProfile,
      scores: scoresObj
    });

    // Get any existing NotebookLM responses
    const responses = await db('notebooklm_responses')
      .where({ assessment_id: id })
      .select('*');

    const responsesMap = {};
    responses.forEach(r => {
      responsesMap[r.query_id] = r.response_text;
    });

    res.json({
      assessment,
      orgProfile,
      scores: scoresObj,
      queries: queryData.queries,
      responses: responsesMap,
      generatedAt: queryData.generatedAt
    });
  } catch (error) {
    console.error('[Admin] Error fetching assessment:', error);
    res.status(500).json({ error: 'Failed to fetch assessment details' });
  }
});

/**
 * POST /api/admin/assessments/:id/responses
 * Save NotebookLM responses for an assessment
 */
router.post('/assessments/:id/responses', async (req, res) => {
  try {
    const { id } = req.params;
    const { responses } = req.body; // { query_id: response_text, ... }

    // Validate assessment exists
    const assessment = await db('assessments').where({ id }).first();
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Validate responses object
    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({ error: 'Invalid responses object' });
    }

    // Save each response
    for (const [queryId, responseText] of Object.entries(responses)) {
      // Check if response already exists
      const existing = await db('notebooklm_responses')
        .where({ assessment_id: id, query_id: queryId })
        .first();

      if (existing) {
        // Update existing
        await db('notebooklm_responses')
          .where({ assessment_id: id, query_id: queryId })
          .update({
            response_text: responseText,
            updated_at: new Date().toISOString()
          });
      } else {
        // Insert new
        await db('notebooklm_responses')
          .insert({
            assessment_id: id,
            query_id: queryId,
            response_text: responseText,
            created_at: new Date().toISOString()
          });
      }
    }

    console.log('[Admin] NotebookLM responses saved', {
      assessmentId: id,
      queryIds: Object.keys(responses),
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Responses saved' });
  } catch (error) {
    console.error('[Admin] Error saving responses:', error);
    res.status(500).json({ error: 'Failed to save responses' });
  }
});

/**
 * POST /api/admin/assessments/:id/generate
 * Generate final report using NotebookLM responses + Claude personalization
 */
router.post('/assessments/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;

    // Get assessment
    const assessment = await db('assessments').where({ id }).first();
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Get NotebookLM responses
    const responses = await db('notebooklm_responses')
      .where({ assessment_id: id })
      .select('*');

    if (responses.length < 4) {
      return res.status(400).json({
        error: 'Missing NotebookLM responses',
        message: `Please complete all 4 queries before generating report. Currently have ${responses.length}/4.`,
        completedQueries: responses.map(r => r.query_id)
      });
    }

    // Combine responses into content for Claude
    const notebookContent = {};
    responses.forEach(r => {
      notebookContent[r.query_id] = r.response_text;
    });

    // Get user info
    const user = await db('users').where({ id: assessment.user_id }).first();

    // Parse responses and scores
    const assessmentResponses = typeof assessment.responses === 'string'
      ? JSON.parse(assessment.responses)
      : assessment.responses || {};

    let categoryScores = assessment.scores;
    if (typeof categoryScores === 'string') {
      try {
        categoryScores = JSON.parse(categoryScores);
      } catch (e) {
        categoryScores = {};
      }
    }

    // Get questions for prompt
    const questions = await db('questions').select('*').orderBy('order_index', 'asc');

    // Import required modules for report generation
    const { generateReport } = require('../utils/claude');
    const { getRiskLevel } = require('../utils/scoring');
    const { getPercentile } = require('../data/benchmarks');
    const Report = require('../models/report');

    const overallScore = assessment.overall_score || assessment.risk_score || 50;
    const riskLevel = getRiskLevel(overallScore);
    const percentile = getPercentile(overallScore);

    // Prepare assessment data with NotebookLM synthesis
    const assessmentData = {
      org_name: user?.organization_name || assessment.organization_name || 'Healthcare Organization',
      org_type: user?.organization_type || assessment.organization_type || 'Hospital',
      employee_count: user?.employee_count || assessment.employee_count || '1000-5000',
      responses: assessmentResponses,
      questions,
      category_scores: categoryScores || {},
      overall_score: overallScore,
      percentile,
      risk_level: riskLevel,
      notebooklm_synthesis: notebookContent
    };

    console.log('[Admin] Generating report with NotebookLM content', {
      assessmentId: id,
      notebookQueries: Object.keys(notebookContent),
      timestamp: new Date().toISOString()
    });

    // Generate report using Claude
    const result = await generateReport(assessmentData);

    if (!result.success) {
      return res.status(500).json({
        error: 'Report generation failed',
        details: result.error
      });
    }

    // Save the report
    const report = await Report.create({
      assessment_id: id,
      content: result.report,
      synthesis_used: true
    });

    console.log('[Admin] Report generated successfully', {
      assessmentId: id,
      reportId: report.id,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      reportId: report.id,
      message: 'Report generated with NotebookLM enrichment'
    });
  } catch (error) {
    console.error('[Admin] Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report: ' + error.message });
  }
});

module.exports = router;
