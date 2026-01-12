/**
 * Reports Routes
 * Handles AI-generated executive briefing reports
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const Assessment = require('../models/assessment');
const Report = require('../models/report');
const User = require('../models/user');
const { calculateScores, getRiskLevel } = require('../utils/scoring');
const { getPercentile } = require('../data/benchmarks');
const { generateReport } = require('../utils/claude');
const { generateReportContent } = require('../services/reportContent');
const { generatePDF, generatePDFBuffer } = require('../services/pdfGenerator');
const { sendReportEmail } = require('../services/emailService');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '..', '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

/**
 * POST /api/reports/:assessmentId/generate
 * Generate an AI-powered executive briefing using Claude
 */
router.post('/:assessmentId/generate', requireAuth, async (req, res) => {
  const assessmentId = parseInt(req.params.assessmentId, 10);

  // Log request details
  console.log('[Report Generation] Starting request', {
    assessmentId,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  try {
    if (isNaN(assessmentId)) {
      console.error('[Report Generation] Invalid assessment ID:', req.params.assessmentId);
      return res.status(400).json({ error: 'Invalid assessment ID', timestamp: Date.now() });
    }

    // Find the assessment
    console.log('[Report Generation] Fetching assessment:', assessmentId);
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      console.error('[Report Generation] Assessment not found:', assessmentId);
      return res.status(404).json({ error: 'Assessment not found', timestamp: Date.now() });
    }

    // Verify ownership
    if (assessment.user_id !== req.user.id) {
      console.error('[Report Generation] Access denied - user mismatch', {
        assessmentUserId: assessment.user_id,
        requestUserId: req.user.id
      });
      return res.status(403).json({ error: 'Access denied', timestamp: Date.now() });
    }

    // Parse JSON fields from database (SQLite stores as strings)
    const responses = typeof assessment.responses === 'string'
      ? JSON.parse(assessment.responses)
      : assessment.responses || {};

    // Log assessment details
    console.log('[Report Generation] Assessment loaded', {
      assessmentId,
      organization_name: assessment.organization_name,
      responsesCount: Object.keys(responses).length
    });

    // Get questions for scoring context
    const questions = await db('questions').select('*').orderBy('order_index', 'asc');
    console.log('[Report Generation] Questions loaded:', questions.length);

    // Get or calculate scores - parse if stored as JSON string
    let category_scores = assessment.scores;
    if (typeof category_scores === 'string') {
      try {
        category_scores = JSON.parse(category_scores);
      } catch (e) {
        category_scores = null;
      }
    }

    let overall_score = assessment.overall_score || assessment.risk_score;

    if (!category_scores && responses) {
      const calculated = calculateScores(responses, questions);
      category_scores = calculated.category_scores;
      overall_score = calculated.overall_score;
    }

    const risk_level = getRiskLevel(overall_score);
    const percentile = getPercentile(overall_score);

    // Prepare data for Claude
    const assessmentData = {
      org_name: assessment.organization_name || 'Healthcare Organization',
      org_type: assessment.organization_type || 'Hospital',
      employee_count: assessment.employee_count || '1000-5000',
      responses,
      questions,
      category_scores: category_scores || {},
      overall_score,
      percentile,
      risk_level
    };

    // Generate report using Claude
    console.log('[Report Generation] Claude API call starting', {
      assessmentId,
      org_name: assessmentData.org_name,
      dataSize: JSON.stringify(assessmentData).length
    });

    let result;
    try {
      result = await generateReport(assessmentData);
      console.log('[Report Generation] Claude API response received', {
        assessmentId,
        success: result.success,
        usage: result.usage
      });
    } catch (claudeError) {
      console.error('[Report Generation] Claude API error', {
        assessmentId,
        error: claudeError.message,
        response: claudeError.response?.data || claudeError.response,
        stack: claudeError.stack
      });
      return res.status(500).json({
        error: 'Claude API error: ' + claudeError.message,
        timestamp: Date.now()
      });
    }

    if (!result.success) {
      console.error('[Report Generation] Report generation failed - no success flag', {
        assessmentId,
        result
      });
      return res.status(500).json({
        error: 'Report generation failed',
        timestamp: Date.now()
      });
    }

    // ==========================================================================
    // RETURN REPORT DIRECTLY - Skip database save to avoid foreign key issues
    // Database persistence disabled for now - can be re-enabled later
    // ==========================================================================
    console.log('[Report Generation] Complete - Returning report directly to frontend', {
      assessmentId,
      contentSize: JSON.stringify(result.report).length,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      content: result.report,
      usage: result.usage
    });

  } catch (error) {
    console.error('[Report Generation] Unexpected error', {
      assessmentId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: error.message || 'Failed to generate report',
      timestamp: Date.now()
    });
  }
});

/**
 * POST /api/reports/:assessmentId
 * Generate a PDF report for an assessment (legacy endpoint)
 */
router.post('/:assessmentId', requireAuth, async (req, res) => {
  try {
    const assessmentId = parseInt(req.params.assessmentId, 10);

    // Validate assessment ID
    if (isNaN(assessmentId)) {
      return res.status(400).json({ error: 'Invalid assessment ID' });
    }

    // Find the assessment
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Verify assessment belongs to authenticated user
    if (assessment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user info for the report
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(500).json({ error: 'User not found' });
    }

    // Calculate scoring details
    const scoring = calculateRiskScore(assessment.responses);

    // Generate report content
    const reportContent = generateReportContent({
      assessment: Assessment.toPublic(assessment),
      user: User.toPublic(user),
      scoring
    });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `report-${assessmentId}-${timestamp}.pdf`;
    const pdfPath = path.join(reportsDir, filename);

    // Generate PDF file
    await generatePDF(reportContent, pdfPath);

    // Create relative URL for the PDF
    const pdfUrl = `/reports/${filename}`;

    // Store report record in database with error handling
    console.log('[PDF Report] [DB] Starting database insert', {
      assessmentId,
      pdfUrl,
      timestamp: new Date().toISOString()
    });

    let report;
    try {
      report = await Report.create({
        assessment_id: assessmentId,
        pdf_url: pdfUrl
      });
    } catch (dbError) {
      console.error('[PDF Report] [DB] DATABASE INSERT FAILED', {
        assessmentId,
        error: dbError.message,
        code: dbError.code,
        stack: dbError.stack,
        timestamp: new Date().toISOString()
      });
      return res.status(500).json({
        error: 'Failed to save report to database: ' + dbError.message,
        errorCode: dbError.code || 'DB_INSERT_FAILED'
      });
    }

    if (!report || !report.id) {
      console.error('[PDF Report] [DB] INSERT VERIFICATION FAILED', {
        assessmentId,
        report,
        timestamp: new Date().toISOString()
      });
      return res.status(500).json({
        error: 'Database insert returned invalid result',
        errorCode: 'DB_INSERT_NO_RESULT'
      });
    }

    console.log('[PDF Report] [DB] Insert successful', {
      assessmentId,
      reportId: report.id,
      timestamp: new Date().toISOString()
    });

    // Return success with report info
    res.status(200).json({
      message: 'Report generated successfully',
      report: Report.toPublic(report),
      download_url: pdfUrl
    });

  } catch (error) {
    console.error('[PDF Report] Unexpected error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Failed to generate report: ' + error.message });
  }
});

/**
 * GET /api/reports/:assessmentId
 * Get existing report for an assessment
 */
router.get('/:assessmentId', requireAuth, async (req, res) => {
  try {
    const assessmentId = parseInt(req.params.assessmentId, 10);

    if (isNaN(assessmentId)) {
      return res.status(400).json({ error: 'Invalid assessment ID' });
    }

    // Find the assessment first to verify ownership
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (assessment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find the most recent report for this assessment
    const report = await Report.findByAssessmentId(assessmentId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found. Generate one first.' });
    }

    res.status(200).json({
      report: Report.toPublic(report)
    });

  } catch (error) {
    console.error('[Get Report] Unexpected error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      error: 'Failed to retrieve report: ' + error.message,
      timestamp: Date.now()
    });
  }
});

/**
 * GET /api/reports/:assessmentId/download
 * Download the PDF report directly
 */
router.get('/:assessmentId/download', requireAuth, async (req, res) => {
  try {
    const assessmentId = parseInt(req.params.assessmentId, 10);

    if (isNaN(assessmentId)) {
      return res.status(400).json({ error: 'Invalid assessment ID' });
    }

    // Find the assessment to verify ownership
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (assessment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user info
    const user = await User.findById(req.user.id);

    // Calculate scoring
    const scoring = calculateRiskScore(assessment.responses);

    // Generate report content
    const reportContent = generateReportContent({
      assessment: Assessment.toPublic(assessment),
      user: User.toPublic(user),
      scoring
    });

    // Generate PDF buffer for streaming
    const pdfBuffer = await generatePDFBuffer(reportContent);

    // Set response headers for PDF download
    const filename = `Quantum-Risk-Report-${assessmentId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('[Download Report] Unexpected error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      error: 'Failed to download report: ' + error.message,
      timestamp: Date.now()
    });
  }
});

/**
 * POST /api/reports/:assessmentId/email
 * Send PDF report to user's email
 * Story-016: Email report delivery
 */
router.post('/:assessmentId/email', requireAuth, async (req, res) => {
  try {
    const assessmentId = parseInt(req.params.assessmentId, 10);

    // Validate assessment ID
    if (isNaN(assessmentId)) {
      return res.status(400).json({ error: 'Invalid assessment ID' });
    }

    // Find the assessment
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Verify assessment belongs to authenticated user
    if (assessment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user info
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(500).json({ error: 'User not found' });
    }

    // Calculate scoring details
    const scoring = calculateRiskScore(assessment.responses);

    // Generate report content
    const reportContent = generateReportContent({
      assessment: Assessment.toPublic(assessment),
      user: User.toPublic(user),
      scoring
    });

    // Generate PDF buffer for email attachment
    const pdfBuffer = await generatePDFBuffer(reportContent);

    // Create filename for attachment
    const pdfFilename = `Quantum-Risk-Executive-Briefing-${user.organization_name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;

    // Send email with PDF attachment
    await sendReportEmail({
      to: user.email,
      userName: user.name,
      organizationName: user.organization_name,
      riskScore: scoring.totalScore,
      riskLevel: scoring.riskLevel,
      pdfBuffer,
      pdfFilename
    });

    // Find or create report record with error handling
    console.log('[Email Report] [DB] Finding or creating report record', {
      assessmentId,
      timestamp: new Date().toISOString()
    });

    let report;
    try {
      report = await Report.findByAssessmentId(assessmentId);

      if (!report) {
        console.log('[Email Report] [DB] No existing report, creating new record', {
          assessmentId,
          timestamp: new Date().toISOString()
        });
        report = await Report.create({
          assessment_id: assessmentId,
          pdf_url: null
        });
      }
    } catch (dbError) {
      console.error('[Email Report] [DB] DATABASE OPERATION FAILED', {
        assessmentId,
        error: dbError.message,
        code: dbError.code,
        stack: dbError.stack,
        timestamp: new Date().toISOString()
      });
      // Email was sent but DB save failed - log this critical issue
      console.error('[Email Report] WARNING: Email was sent but report record failed to save!');
      return res.status(500).json({
        error: 'Email sent but failed to save report record: ' + dbError.message,
        emailSent: true,
        errorCode: dbError.code || 'DB_OPERATION_FAILED'
      });
    }

    if (!report || !report.id) {
      console.error('[Email Report] [DB] REPORT RECORD VERIFICATION FAILED', {
        assessmentId,
        report,
        timestamp: new Date().toISOString()
      });
      return res.status(500).json({
        error: 'Failed to create or find report record',
        emailSent: true,
        errorCode: 'DB_NO_RESULT'
      });
    }

    // Update email_sent flag with error handling
    try {
      await Report.markEmailSent(report.id);
      console.log('[Email Report] [DB] Email sent flag updated', {
        reportId: report.id,
        timestamp: new Date().toISOString()
      });
    } catch (updateError) {
      console.error('[Email Report] [DB] Failed to update email_sent flag', {
        reportId: report.id,
        error: updateError.message,
        timestamp: new Date().toISOString()
      });
      // Non-fatal - email was sent, just log the issue
    }

    console.log('[Email Report] Complete - Email sent and report updated', {
      assessmentId,
      reportId: report.id,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    // Return success
    res.status(200).json({
      message: 'Report sent successfully',
      email: user.email
    });

  } catch (error) {
    console.error('[Email Report] Unexpected error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      error: 'Failed to send email: ' + error.message,
      timestamp: Date.now()
    });
  }
});

module.exports = router;
