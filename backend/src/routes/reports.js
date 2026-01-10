/**
 * Reports Routes
 * Story-015: Generate report endpoint
 * Story-016: Email report delivery
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Assessment = require('../models/assessment');
const Report = require('../models/report');
const User = require('../models/user');
const { calculateRiskScore } = require('../services/scoring');
const { generateReportContent } = require('../services/reportContent');
const { generatePDF, generatePDFBuffer } = require('../services/pdfGenerator');
const { sendReportEmail } = require('../services/emailService');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '..', '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

/**
 * POST /api/reports/:assessmentId
 * Generate a PDF report for an assessment
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

    // Store report record in database
    const report = await Report.create({
      assessment_id: assessmentId,
      pdf_url: pdfUrl
    });

    // Return success with report info
    res.status(200).json({
      message: 'Report generated successfully',
      report: Report.toPublic(report),
      download_url: pdfUrl
    });

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
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
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to retrieve report' });
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
    console.error('Report download error:', error);
    res.status(500).json({ error: 'Failed to download report' });
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

    // Find or create report record
    let report = await Report.findByAssessmentId(assessmentId);

    if (!report) {
      // Create a new report record if one doesn't exist
      report = await Report.create({
        assessment_id: assessmentId,
        pdf_url: null
      });
    }

    // Update email_sent flag
    await Report.markEmailSent(report.id);

    // Return success
    res.status(200).json({
      message: 'Report sent successfully',
      email: user.email
    });

  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ error: 'Failed to send email: ' + error.message });
  }
});

module.exports = router;
