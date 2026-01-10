/**
 * PDF Report Generation Service
 * Story-014: PDF report generation
 *
 * Generates a professional 8-page PDF executive briefing from report content.
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Color palette
const COLORS = {
  primary: '#1a1a2e',
  secondary: '#4a90d9',
  accent: '#16213e',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
  severe: '#721c24',
  text: '#333333',
  textLight: '#666666',
  textMuted: '#888888',
  white: '#ffffff',
  lightGray: '#f5f5f5',
  border: '#e0e0e0'
};

// Risk level colors
const RISK_COLORS = {
  LOW: COLORS.success,
  MODERATE: COLORS.warning,
  HIGH: '#fd7e14',
  CRITICAL: COLORS.danger,
  SEVERE: COLORS.severe
};

// Page dimensions (Letter size)
const PAGE = {
  width: 612,
  height: 792,
  marginLeft: 50,
  marginRight: 50,
  marginTop: 60,
  marginBottom: 60
};

const CONTENT_WIDTH = PAGE.width - PAGE.marginLeft - PAGE.marginRight;

/**
 * Draw page header
 */
function drawHeader(doc, pageTitle, pageNum) {
  doc.save();

  // Header line
  doc.moveTo(PAGE.marginLeft, 40)
     .lineTo(PAGE.width - PAGE.marginRight, 40)
     .strokeColor(COLORS.border)
     .lineWidth(1)
     .stroke();

  // QSL branding on left
  doc.fontSize(9)
     .fillColor(COLORS.textMuted)
     .text('Quantum Security Labs', PAGE.marginLeft, 28, { width: 200 });

  // Page title on right
  doc.fontSize(9)
     .fillColor(COLORS.textMuted)
     .text(pageTitle, PAGE.width - PAGE.marginRight - 200, 28, {
       width: 200,
       align: 'right'
     });

  doc.restore();
}

/**
 * Draw page footer with page number
 */
function drawFooter(doc, pageNum, totalPages) {
  doc.save();

  const footerY = PAGE.height - 40;

  // Footer line
  doc.moveTo(PAGE.marginLeft, footerY)
     .lineTo(PAGE.width - PAGE.marginRight, footerY)
     .strokeColor(COLORS.border)
     .lineWidth(1)
     .stroke();

  // Confidential notice on left
  doc.fontSize(8)
     .fillColor(COLORS.textMuted)
     .text('CONFIDENTIAL', PAGE.marginLeft, footerY + 10);

  // Page number on right
  doc.fontSize(8)
     .fillColor(COLORS.textMuted)
     .text(`Page ${pageNum} of ${totalPages}`, PAGE.width - PAGE.marginRight - 80, footerY + 10, {
       width: 80,
       align: 'right'
     });

  doc.restore();
}

/**
 * Draw a section title
 */
function drawSectionTitle(doc, title, y) {
  doc.fontSize(18)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text(title, PAGE.marginLeft, y);

  doc.moveTo(PAGE.marginLeft, y + 25)
     .lineTo(PAGE.marginLeft + 80, y + 25)
     .strokeColor(COLORS.secondary)
     .lineWidth(3)
     .stroke();

  doc.font('Helvetica');
  return y + 40;
}

/**
 * Draw a subsection title
 */
function drawSubsectionTitle(doc, title, y) {
  doc.fontSize(14)
     .fillColor(COLORS.accent)
     .font('Helvetica-Bold')
     .text(title, PAGE.marginLeft, y);
  doc.font('Helvetica');
  return y + 22;
}

/**
 * Draw paragraph text
 */
function drawParagraph(doc, text, y, options = {}) {
  const fontSize = options.fontSize || 11;
  const color = options.color || COLORS.text;
  const indent = options.indent || 0;

  doc.fontSize(fontSize)
     .fillColor(color)
     .text(text, PAGE.marginLeft + indent, y, {
       width: CONTENT_WIDTH - indent,
       lineGap: 4,
       align: options.align || 'left'
     });

  return doc.y + 10;
}

/**
 * Draw a bullet point
 */
function drawBullet(doc, text, y, options = {}) {
  const bulletX = PAGE.marginLeft + (options.indent || 0);
  const textX = bulletX + 15;

  doc.fontSize(11)
     .fillColor(COLORS.secondary)
     .text('•', bulletX, y);

  doc.fillColor(options.color || COLORS.text)
     .text(text, textX, y, {
       width: CONTENT_WIDTH - 15 - (options.indent || 0),
       lineGap: 3
     });

  return doc.y + 5;
}

/**
 * Draw risk score gauge
 */
function drawGauge(doc, score, riskLevel, centerX, centerY, radius) {
  const riskColor = RISK_COLORS[riskLevel] || COLORS.textMuted;

  // Background arc
  doc.save();
  doc.path(`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`)
     .lineWidth(15)
     .strokeColor(COLORS.lightGray)
     .stroke();

  // Score arc (proportional to score)
  const scoreAngle = (score / 100) * Math.PI;
  const endX = centerX + radius * Math.cos(Math.PI - scoreAngle);
  const endY = centerY - radius * Math.sin(scoreAngle);

  doc.path(`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`)
     .lineWidth(15)
     .strokeColor(riskColor)
     .stroke();

  // Score text
  doc.fontSize(36)
     .fillColor(riskColor)
     .font('Helvetica-Bold')
     .text(score.toString(), centerX - 30, centerY - 25, { width: 60, align: 'center' });

  doc.fontSize(10)
     .fillColor(COLORS.textMuted)
     .font('Helvetica')
     .text('Risk Score', centerX - 40, centerY + 15, { width: 80, align: 'center' });

  doc.restore();
}

/**
 * Draw risk level badge
 */
function drawRiskBadge(doc, riskLevel, x, y) {
  const color = RISK_COLORS[riskLevel] || COLORS.textMuted;
  const width = 120;
  const height = 28;

  doc.save();
  doc.roundedRect(x, y, width, height, 14)
     .fill(color);

  doc.fontSize(12)
     .fillColor(COLORS.white)
     .font('Helvetica-Bold')
     .text(`${riskLevel} RISK`, x, y + 8, { width: width, align: 'center' });

  doc.font('Helvetica');
  doc.restore();
}

/**
 * Page 1: Cover Page
 */
function drawCoverPage(doc, content) {
  // Dark header section
  doc.rect(0, 0, PAGE.width, 280)
     .fill(COLORS.primary);

  // QSL Logo/Branding
  doc.fontSize(14)
     .fillColor(COLORS.secondary)
     .font('Helvetica-Bold')
     .text('QUANTUM SECURITY LABS', PAGE.marginLeft, 60);

  // Main title
  doc.fontSize(32)
     .fillColor(COLORS.white)
     .text(content.coverPage.title, PAGE.marginLeft, 120, { width: CONTENT_WIDTH });

  doc.fontSize(18)
     .fillColor('#aaaacc')
     .font('Helvetica')
     .text(content.coverPage.subtitle, PAGE.marginLeft, 170);

  // Organization name (large, prominent)
  doc.fontSize(28)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text(content.coverPage.organizationName, PAGE.marginLeft, 320, { width: CONTENT_WIDTH });

  // Date
  doc.fontSize(14)
     .fillColor(COLORS.textLight)
     .font('Helvetica')
     .text(content.coverPage.date, PAGE.marginLeft, 370);

  // Prepared by section
  doc.fontSize(12)
     .fillColor(COLORS.textMuted)
     .text('Prepared by:', PAGE.marginLeft, 450);

  doc.fontSize(16)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text(content.coverPage.preparedBy, PAGE.marginLeft, 470);

  // Confidentiality notice
  doc.fontSize(10)
     .fillColor(COLORS.textMuted)
     .font('Helvetica')
     .text(content.coverPage.confidentiality, PAGE.marginLeft, PAGE.height - 80, {
       width: CONTENT_WIDTH,
       align: 'center'
     });

  // Decorative line
  doc.moveTo(PAGE.marginLeft, 400)
     .lineTo(PAGE.marginLeft + 100, 400)
     .strokeColor(COLORS.secondary)
     .lineWidth(4)
     .stroke();
}

/**
 * Page 2: Executive Summary
 */
function drawExecutiveSummary(doc, content) {
  drawHeader(doc, 'Executive Summary', 2);
  drawFooter(doc, 2, 8);

  let y = PAGE.marginTop + 20;
  y = drawSectionTitle(doc, content.executiveSummary.title, y);

  // Risk gauge
  const gaugeY = y + 60;
  drawGauge(doc, content.executiveSummary.riskScore, content.executiveSummary.riskLevel, PAGE.width / 2, gaugeY, 50);

  // Risk badge below gauge
  drawRiskBadge(doc, content.executiveSummary.riskLevel, PAGE.width / 2 - 60, gaugeY + 50);

  y = gaugeY + 100;

  // Summary paragraph
  y = drawParagraph(doc, content.executiveSummary.summary, y);

  y += 15;

  // Key findings
  y = drawSubsectionTitle(doc, 'Key Findings', y);

  for (const finding of content.executiveSummary.keyFindings) {
    y = drawBullet(doc, finding, y);
  }
}

/**
 * Page 3: Risk Profile
 */
function drawRiskProfile(doc, content) {
  drawHeader(doc, 'Risk Profile', 3);
  drawFooter(doc, 3, 8);

  let y = PAGE.marginTop + 20;
  y = drawSectionTitle(doc, content.riskProfile.title, y);

  // Score summary box
  doc.roundedRect(PAGE.marginLeft, y, CONTENT_WIDTH, 60, 5)
     .fill(COLORS.lightGray);

  doc.fontSize(14)
     .fillColor(COLORS.text)
     .font('Helvetica-Bold')
     .text(`Overall Risk Score: ${content.riskProfile.score}/100`, PAGE.marginLeft + 20, y + 12);

  drawRiskBadge(doc, content.riskProfile.level, PAGE.marginLeft + 20, y + 32);
  doc.font('Helvetica');

  y += 80;

  y = drawSubsectionTitle(doc, 'Vulnerability Breakdown', y);

  // Draw breakdown items
  for (const item of content.riskProfile.breakdown) {
    // Item box
    doc.roundedRect(PAGE.marginLeft, y, CONTENT_WIDTH, 70, 3)
       .strokeColor(COLORS.border)
       .lineWidth(1)
       .stroke();

    // Rank
    doc.fontSize(20)
       .fillColor(COLORS.danger)
       .font('Helvetica-Bold')
       .text(`#${item.rank}`, PAGE.marginLeft + 15, y + 10);

    // Category
    doc.fontSize(10)
       .fillColor(COLORS.textMuted)
       .font('Helvetica')
       .text(item.category, PAGE.marginLeft + 60, y + 8);

    // Question
    doc.fontSize(11)
       .fillColor(COLORS.text)
       .text(item.question, PAGE.marginLeft + 60, y + 22, {
         width: CONTENT_WIDTH - 150
       });

    // Score bar
    const barX = PAGE.width - PAGE.marginRight - 70;
    const barWidth = 50;
    const fillWidth = (item.score / item.maxScore) * barWidth;

    doc.rect(barX, y + 15, barWidth, 12)
       .fill(COLORS.lightGray);

    doc.rect(barX, y + 15, fillWidth, 12)
       .fill(COLORS.danger);

    doc.fontSize(10)
       .fillColor(COLORS.text)
       .text(`${item.score}/${item.maxScore}`, barX, y + 32, { width: barWidth, align: 'center' });

    // Severity label
    doc.fontSize(9)
       .fillColor(item.severity === 'Critical' ? COLORS.danger : COLORS.warning)
       .text(item.severity, barX, y + 48, { width: barWidth, align: 'center' });

    y += 80;
  }
}

/**
 * Page 4: Quantum Threat Explanation
 */
function drawQuantumThreat(doc, content) {
  drawHeader(doc, 'Quantum Threat', 4);
  drawFooter(doc, 4, 8);

  let y = PAGE.marginTop + 20;
  y = drawSectionTitle(doc, content.quantumThreat.title, y);

  for (const section of content.quantumThreat.sections) {
    y = drawSubsectionTitle(doc, section.heading, y);
    y = drawParagraph(doc, section.content, y);
    y += 10;
  }
}

/**
 * Page 5: Cost of Inaction
 */
function drawCostOfInaction(doc, content) {
  drawHeader(doc, 'Cost Analysis', 5);
  drawFooter(doc, 5, 8);

  let y = PAGE.marginTop + 20;
  y = drawSectionTitle(doc, content.costOfInaction.title, y);

  y = drawParagraph(doc, content.costOfInaction.introduction, y);
  y += 10;

  // Cost breakdown table
  const costs = content.costOfInaction.projections;
  const tableX = PAGE.marginLeft;
  const labelWidth = 280;
  const valueWidth = CONTENT_WIDTH - labelWidth;

  const drawCostRow = (label, value, description, isTotal = false) => {
    if (isTotal) {
      doc.rect(tableX, y - 5, CONTENT_WIDTH, 35)
         .fill(COLORS.primary);
      doc.fillColor(COLORS.white);
    } else {
      doc.rect(tableX, y - 5, CONTENT_WIDTH, 35)
         .fill(y % 2 === 0 ? COLORS.white : COLORS.lightGray);
      doc.fillColor(COLORS.text);
    }

    doc.fontSize(isTotal ? 13 : 11)
       .font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
       .text(label, tableX + 10, y);

    if (description && !isTotal) {
      doc.fontSize(9)
         .fillColor(COLORS.textMuted)
         .text(description, tableX + 10, y + 14, { width: labelWidth - 20 });
    }

    doc.fontSize(isTotal ? 14 : 12)
       .fillColor(isTotal ? COLORS.white : COLORS.danger)
       .font('Helvetica-Bold')
       .text(value, tableX + labelWidth, y, { width: valueWidth - 10, align: 'right' });

    doc.font('Helvetica');
    return y + 40;
  };

  y = drawCostRow(costs.breachCost.label, costs.breachCost.formatted, costs.breachCost.description);
  y = drawCostRow(costs.regulatoryFines.label, costs.regulatoryFines.formatted, costs.regulatoryFines.description);
  y = drawCostRow(costs.reputationCost.label, costs.reputationCost.formatted, costs.reputationCost.description);
  y = drawCostRow(costs.operationalCost.label, costs.operationalCost.formatted, costs.operationalCost.description);
  y = drawCostRow(costs.total.label, costs.total.formatted, null, true);

  y += 20;

  // Records at risk
  doc.fontSize(11)
     .fillColor(COLORS.text)
     .text(`Estimated records at risk: ${content.costOfInaction.recordsAtRisk.formatted} patient records`, PAGE.marginLeft, y);

  y += 15;

  doc.fontSize(11)
     .text(`Average cost per compromised record: ${content.costOfInaction.recordsAtRisk.costPerRecord}`, PAGE.marginLeft, y);

  y += 25;

  // Disclaimer
  doc.fontSize(9)
     .fillColor(COLORS.textMuted)
     .text(content.costOfInaction.disclaimer, PAGE.marginLeft, y, {
       width: CONTENT_WIDTH,
       align: 'center'
     });
}

/**
 * Page 6: Recommendations
 */
function drawRecommendations(doc, content) {
  drawHeader(doc, 'Recommendations', 6);
  drawFooter(doc, 6, 8);

  let y = PAGE.marginTop + 20;
  y = drawSectionTitle(doc, content.recommendations.title, y);

  y = drawParagraph(doc, content.recommendations.introduction, y);
  y += 10;

  for (const rec of content.recommendations.items) {
    // Recommendation card
    doc.roundedRect(PAGE.marginLeft, y, CONTENT_WIDTH, 150, 5)
       .strokeColor(COLORS.secondary)
       .lineWidth(2)
       .stroke();

    // Rank badge
    const badgeSize = 30;
    doc.circle(PAGE.marginLeft + 25, y + 25, badgeSize / 2)
       .fill(COLORS.secondary);

    doc.fontSize(14)
       .fillColor(COLORS.white)
       .font('Helvetica-Bold')
       .text(rec.rank.toString(), PAGE.marginLeft + 17, y + 18);

    // Title
    doc.fontSize(14)
       .fillColor(COLORS.primary)
       .text(rec.title, PAGE.marginLeft + 55, y + 15, { width: CONTENT_WIDTH - 70 });

    // Priority tag
    const priorityColor = rec.priority === 'immediate' ? COLORS.danger : COLORS.warning;
    doc.fontSize(9)
       .fillColor(priorityColor)
       .text(rec.priority.toUpperCase(), PAGE.width - PAGE.marginRight - 80, y + 15);

    // Description
    doc.fontSize(10)
       .fillColor(COLORS.textLight)
       .font('Helvetica')
       .text(rec.description, PAGE.marginLeft + 55, y + 35, { width: CONTENT_WIDTH - 70 });

    // Actions (first 2)
    let actionY = y + 60;
    for (const action of rec.actions.slice(0, 2)) {
      doc.fontSize(10)
         .fillColor(COLORS.secondary)
         .text('→', PAGE.marginLeft + 55, actionY);

      doc.fillColor(COLORS.text)
         .text(action, PAGE.marginLeft + 70, actionY, { width: CONTENT_WIDTH - 90 });

      actionY = doc.y + 3;
    }

    y += 160;
  }
}

/**
 * Page 7: Budget Estimate
 */
function drawBudgetEstimate(doc, content) {
  drawHeader(doc, 'Budget Estimate', 7);
  drawFooter(doc, 7, 8);

  let y = PAGE.marginTop + 20;
  y = drawSectionTitle(doc, content.budgetEstimate.title, y);

  y = drawParagraph(doc, content.budgetEstimate.introduction, y);
  y += 10;

  // Phase breakdown
  for (const phase of content.budgetEstimate.phases) {
    doc.roundedRect(PAGE.marginLeft, y, CONTENT_WIDTH, 50, 3)
       .fill(COLORS.lightGray);

    doc.fontSize(12)
       .fillColor(COLORS.primary)
       .font('Helvetica-Bold')
       .text(phase.description, PAGE.marginLeft + 15, y + 10, { width: CONTENT_WIDTH - 200 });

    doc.fontSize(10)
       .fillColor(COLORS.textMuted)
       .font('Helvetica')
       .text(phase.duration, PAGE.marginLeft + 15, y + 28);

    const costRange = `$${(phase.costRange.min / 1000).toFixed(0)}K - $${(phase.costRange.max / 1000).toFixed(0)}K`;
    doc.fontSize(12)
       .fillColor(COLORS.secondary)
       .font('Helvetica-Bold')
       .text(costRange, PAGE.width - PAGE.marginRight - 150, y + 18, {
         width: 135,
         align: 'right'
       });

    doc.font('Helvetica');
    y += 58;
  }

  // Total
  doc.roundedRect(PAGE.marginLeft, y, CONTENT_WIDTH, 50, 3)
     .fill(COLORS.primary);

  doc.fontSize(14)
     .fillColor(COLORS.white)
     .font('Helvetica-Bold')
     .text('Total Investment', PAGE.marginLeft + 15, y + 10);

  doc.fontSize(11)
     .fillColor('#aaaacc')
     .font('Helvetica')
     .text(content.budgetEstimate.total.duration, PAGE.marginLeft + 15, y + 28);

  doc.fontSize(14)
     .fillColor(COLORS.white)
     .font('Helvetica-Bold')
     .text(`${content.budgetEstimate.total.budgetRange.min} - ${content.budgetEstimate.total.budgetRange.max}`,
       PAGE.width - PAGE.marginRight - 200, y + 18, { width: 185, align: 'right' });

  doc.font('Helvetica');
  y += 70;

  // ROI section
  y = drawSubsectionTitle(doc, 'Return on Investment', y);

  doc.fontSize(11)
     .fillColor(COLORS.text)
     .text(`Potential cost avoidance: ${content.budgetEstimate.roi.potentialCostAvoidance}`, PAGE.marginLeft, y);

  y += 18;

  doc.text(`Investment range: ${content.budgetEstimate.roi.investmentRange}`, PAGE.marginLeft, y);

  y += 18;

  doc.fillColor(COLORS.success)
     .font('Helvetica-Bold')
     .text(`ROI Multiple: ${content.budgetEstimate.roi.roiMultiple}`, PAGE.marginLeft, y);

  doc.font('Helvetica');
  y += 25;

  // Notes
  doc.fontSize(9)
     .fillColor(COLORS.textMuted);

  for (const note of content.budgetEstimate.notes) {
    doc.text(`• ${note}`, PAGE.marginLeft, y, { width: CONTENT_WIDTH });
    y = doc.y + 3;
  }
}

/**
 * Page 8: Next Steps
 */
function drawNextSteps(doc, content) {
  drawHeader(doc, 'Next Steps', 8);
  drawFooter(doc, 8, 8);

  let y = PAGE.marginTop + 20;
  y = drawSectionTitle(doc, content.nextSteps.title, y);

  y = drawParagraph(doc, content.nextSteps.content, y);
  y += 15;

  y = drawSubsectionTitle(doc, 'Our Services', y);

  // Offerings
  for (const offering of content.nextSteps.offerings) {
    doc.roundedRect(PAGE.marginLeft, y, CONTENT_WIDTH, 45, 3)
       .fill(COLORS.lightGray);

    doc.fontSize(12)
       .fillColor(COLORS.primary)
       .font('Helvetica-Bold')
       .text(offering.name, PAGE.marginLeft + 15, y + 8);

    doc.fontSize(10)
       .fillColor(COLORS.textLight)
       .font('Helvetica')
       .text(offering.description, PAGE.marginLeft + 15, y + 25, { width: CONTENT_WIDTH - 30 });

    y += 52;
  }

  y += 15;

  // Contact section
  y = drawSubsectionTitle(doc, 'Contact Us', y);

  doc.roundedRect(PAGE.marginLeft, y, CONTENT_WIDTH, 80, 5)
     .fill(COLORS.primary);

  const contact = content.nextSteps.contact;

  doc.fontSize(12)
     .fillColor(COLORS.white)
     .font('Helvetica-Bold')
     .text(contact.website, PAGE.marginLeft + 20, y + 15);

  doc.fontSize(11)
     .fillColor('#aaaacc')
     .font('Helvetica')
     .text(contact.email, PAGE.marginLeft + 20, y + 35);

  doc.text(contact.phone, PAGE.marginLeft + 20, y + 52);

  // Call to action
  doc.fontSize(11)
     .fillColor(COLORS.secondary)
     .font('Helvetica-Bold')
     .text('Schedule Your Deep Dive →', PAGE.width - PAGE.marginRight - 180, y + 35, {
       width: 160,
       align: 'right'
     });

  doc.font('Helvetica');
}

/**
 * Generate PDF report
 *
 * @param {object} content - Report content from generateReportContent()
 * @param {string} outputPath - Path to save the PDF file
 * @returns {Promise<string>} - Path to the generated PDF
 */
async function generatePDF(content, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: {
          top: PAGE.marginTop,
          bottom: PAGE.marginBottom,
          left: PAGE.marginLeft,
          right: PAGE.marginRight
        },
        info: {
          Title: `Quantum Risk Executive Briefing - ${content.metadata.organizationName}`,
          Author: 'Quantum Security Labs',
          Subject: 'Quantum Risk Assessment Report',
          Creator: 'QSL Executive Briefing Generator'
        }
      });

      // Create write stream
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Page 1: Cover
      drawCoverPage(doc, content);

      // Page 2: Executive Summary
      doc.addPage();
      drawExecutiveSummary(doc, content);

      // Page 3: Risk Profile
      doc.addPage();
      drawRiskProfile(doc, content);

      // Page 4: Quantum Threat
      doc.addPage();
      drawQuantumThreat(doc, content);

      // Page 5: Cost of Inaction
      doc.addPage();
      drawCostOfInaction(doc, content);

      // Page 6: Recommendations
      doc.addPage();
      drawRecommendations(doc, content);

      // Page 7: Budget Estimate
      doc.addPage();
      drawBudgetEstimate(doc, content);

      // Page 8: Next Steps
      doc.addPage();
      drawNextSteps(doc, content);

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate PDF to buffer (for streaming response)
 *
 * @param {object} content - Report content from generateReportContent()
 * @returns {Promise<Buffer>} - PDF as buffer
 */
async function generatePDFBuffer(content) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: {
          top: PAGE.marginTop,
          bottom: PAGE.marginBottom,
          left: PAGE.marginLeft,
          right: PAGE.marginRight
        },
        info: {
          Title: `Quantum Risk Executive Briefing - ${content.metadata.organizationName}`,
          Author: 'Quantum Security Labs',
          Subject: 'Quantum Risk Assessment Report',
          Creator: 'QSL Executive Briefing Generator'
        }
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Draw all pages
      drawCoverPage(doc, content);
      doc.addPage();
      drawExecutiveSummary(doc, content);
      doc.addPage();
      drawRiskProfile(doc, content);
      doc.addPage();
      drawQuantumThreat(doc, content);
      doc.addPage();
      drawCostOfInaction(doc, content);
      doc.addPage();
      drawRecommendations(doc, content);
      doc.addPage();
      drawBudgetEstimate(doc, content);
      doc.addPage();
      drawNextSteps(doc, content);

      doc.end();

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generatePDF,
  generatePDFBuffer,
  // Export for testing
  COLORS,
  RISK_COLORS,
  PAGE
};
