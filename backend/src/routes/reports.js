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
const ThreadValidator = require('../utils/threadValidator');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '..', '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// ==========================================================================
// BACKGROUND JOB STORE - In-memory store for report generation jobs
// Workaround for Railway's 60-second request timeout
// ==========================================================================
const jobStore = new Map();

// Generate unique job ID
function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Clean up old jobs (older than 30 minutes)
function cleanupOldJobs() {
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
  for (const [jobId, job] of jobStore.entries()) {
    if (job.createdAt < thirtyMinutesAgo) {
      jobStore.delete(jobId);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupOldJobs, 5 * 60 * 1000);

/**
 * POST /api/reports/:assessmentId/generate
 * Start background job to generate AI-powered executive briefing
 * Returns immediately with jobId to poll for status
 */
router.post('/:assessmentId/generate', requireAuth, async (req, res) => {
  const assessmentId = parseInt(req.params.assessmentId, 10);
  const userId = req.user?.id;

  console.log('[Report Generation] Starting background job request', {
    assessmentId,
    userId,
    timestamp: new Date().toISOString()
  });

  try {
    if (isNaN(assessmentId)) {
      return res.status(400).json({ error: 'Invalid assessment ID' });
    }

    // Find and validate assessment
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (assessment.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create job and return immediately
    const jobId = generateJobId();
    jobStore.set(jobId, {
      status: 'pending',
      assessmentId,
      userId,
      createdAt: Date.now(),
      result: null,
      error: null,
      threads: {
        generate: { status: 'pending' },
        save: { status: 'pending' },
        verify: { status: 'pending' },
        validate: { status: 'pending' }
      }
    });

    console.log('[Report Generation] Job created', { jobId, assessmentId });

    // Return job ID immediately (within timeout)
    res.status(202).json({
      success: true,
      jobId,
      message: 'Report generation started'
    });

    // Run report generation in background (after response sent)
    // Using Thread-Based Engineering: Boris Chalk method
    setImmediate(async () => {
      const job = jobStore.get(jobId);
      if (!job) return;

      job.status = 'processing';
      const threadValidator = new ThreadValidator({ maxRetries: 3 });
      const startTime = Date.now();

      console.log('[Report Generation] Background processing started - Thread-Based Engineering', { jobId });

      try {
        // ================================================================
        // THREAD 1: GENERATE - Claude API generates report
        // ================================================================
        console.log('[Thread 1 START] Generating report via Claude API', { jobId, assessmentId });
        job.threads.generate = { status: 'processing', startedAt: Date.now() };

        // Parse responses
        const responses = typeof assessment.responses === 'string'
          ? JSON.parse(assessment.responses)
          : assessment.responses || {};

        // Get questions
        const questions = await db('questions').select('*').orderBy('order_index', 'asc');

        // Calculate scores
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

        console.log('[Report Generation] Calling Claude API', { jobId, assessmentId });

        // Call Claude API (Thread 1)
        const result = await generateReport(assessmentData);

        if (!result.success) {
          job.threads.generate = { status: '❌', error: 'Claude API failed', duration_ms: Date.now() - startTime };
          job.status = 'failed';
          job.error = 'Report generation failed';
          console.error('[Thread 1 FAILED] Claude API did not return success', { jobId });
          return;
        }

        job.threads.generate = { status: '✅', duration_ms: Date.now() - startTime };
        console.log('[Thread 1 COMPLETE] Report generated successfully', {
          jobId,
          duration_ms: job.threads.generate.duration_ms
        });

        // Record Thread 1 in validator
        threadValidator.recordThread('generate', '✅', { duration_ms: job.threads.generate.duration_ms });

        // ================================================================
        // THREADS 2-4: Save, Verify, Validate via ThreadValidator
        // Don't return SUCCESS until ALL FOUR threads pass verification
        // ================================================================
        const reportData = {
          assessment_id: assessmentId,
          content: result.report
        };

        const validationResult = await threadValidator.runValidationPipeline(Report, reportData);

        // Update job threads from validator
        job.threads = {
          generate: job.threads.generate,
          save: validationResult.threads.save || { status: '❌' },
          verify: validationResult.threads.verify || { status: '❌' },
          validate: validationResult.threads.validate || { status: '❌' }
        };

        if (!validationResult.success) {
          job.status = 'failed';
          job.error = `Validation pipeline failed: ${validationResult.errors.join('; ')}`;
          console.error('[Report Generation] VALIDATION PIPELINE FAILED', {
            jobId,
            errors: validationResult.errors,
            threads: job.threads
          });
          return;
        }

        // ================================================================
        // ALL FOUR THREADS PASSED - Return success
        // ================================================================
        job.status = 'completed';
        job.result = {
          content: result.report,
          usage: result.usage,
          reportId: validationResult.reportId
        };

        console.log('[Report Generation] ALL THREADS COMPLETE - Job successful', {
          jobId,
          reportId: validationResult.reportId,
          threads: job.threads,
          totalDuration_ms: Date.now() - startTime
        });

      } catch (error) {
        job.status = 'failed';
        job.error = error.message || 'Unknown error';
        job.threads = {
          ...job.threads,
          ...(threadValidator.getSummary().threads)
        };
        console.error('[Report Generation] Job failed with error', {
          jobId,
          error: error.message,
          stack: error.stack,
          threads: job.threads
        });
      }
    });

  } catch (error) {
    console.error('[Report Generation] Error creating job', {
      assessmentId,
      error: error.message
    });
    res.status(500).json({
      error: error.message || 'Failed to start report generation'
    });
  }
});

/**
 * GET /api/reports/job/:jobId
 * Poll for background job status
 */
router.get('/job/:jobId', requireAuth, async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user?.id;

  const job = jobStore.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Verify job belongs to user
  if (job.userId !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Return job status with Thread-Based Engineering details
  const response = {
    jobId,
    status: job.status,
    createdAt: job.createdAt,
    // Include thread status for transparency
    threads: job.threads || null
  };

  if (job.status === 'completed') {
    response.success = true;
    response.result = job.result;
    response.reportId = job.result?.reportId || null;
  } else if (job.status === 'failed') {
    response.success = false;
    response.error = job.error;
  } else if (job.status === 'processing') {
    response.success = null; // Still in progress
  }

  res.json(response);
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

    // Use existing assessment scores (already calculated and stored)
    let category_scores = assessment.scores;
    if (typeof category_scores === 'string') {
      try {
        category_scores = JSON.parse(category_scores);
      } catch (e) {
        category_scores = {};
      }
    }

    const overall_score = assessment.overall_score || assessment.risk_score || 0;
    const riskLevelInfo = getRiskLevel(overall_score);

    // Build scoring object from existing data
    const scoring = {
      totalScore: overall_score,
      riskLevel: riskLevelInfo.level,
      categoryScores: category_scores || {}
    };

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

    // Use existing assessment scores (already calculated and stored)
    let category_scores = assessment.scores;
    if (typeof category_scores === 'string') {
      try {
        category_scores = JSON.parse(category_scores);
      } catch (e) {
        category_scores = {};
      }
    }

    const overall_score = assessment.overall_score || assessment.risk_score || 0;
    const riskLevelInfo = getRiskLevel(overall_score);

    // Build scoring object from existing data
    const scoring = {
      totalScore: overall_score,
      riskLevel: riskLevelInfo.level,
      categoryScores: category_scores || {}
    };

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
