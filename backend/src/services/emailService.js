/**
 * Email Service
 * Story-016: Email report delivery
 *
 * Handles sending emails with PDF report attachments
 */

const nodemailer = require('nodemailer');

/**
 * Create email transporter based on environment configuration
 */
function createTransporter() {
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  return nodemailer.createTransport(config);
}

/**
 * Generate professional HTML email template with QSL branding
 * @param {Object} params - Template parameters
 * @param {string} params.userName - Recipient's name
 * @param {string} params.organizationName - Organization name
 * @param {number} params.riskScore - Risk score from assessment
 * @param {string} params.riskLevel - Risk level (LOW, MODERATE, HIGH, CRITICAL, SEVERE)
 * @returns {string} HTML email content
 */
function generateEmailTemplate({ userName, organizationName, riskScore, riskLevel }) {
  const riskColors = {
    LOW: '#28a745',
    MODERATE: '#ffc107',
    HIGH: '#fd7e14',
    CRITICAL: '#dc3545',
    SEVERE: '#721c24'
  };

  const riskColor = riskColors[riskLevel] || '#6c757d';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Quantum Risk Executive Briefing</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                Quantum Security Labs
              </h1>
              <p style="color: #a0a0a0; margin: 10px 0 0 0; font-size: 14px; letter-spacing: 1px;">
                PROTECTING THE FUTURE OF YOUR DATA
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1a1a2e; margin: 0 0 20px 0; font-size: 24px;">
                Hello ${userName},
              </h2>

              <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for completing the Quantum Risk Assessment for <strong>${organizationName}</strong>.
                Please find your Executive Briefing Report attached to this email.
              </p>

              <!-- Risk Score Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; text-align: center;">
                    <p style="color: #6c757d; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                      Your Risk Score
                    </p>
                    <p style="color: #1a1a2e; margin: 0; font-size: 48px; font-weight: 700;">
                      ${riskScore}
                    </p>
                    <p style="margin: 15px 0 0 0;">
                      <span style="display: inline-block; background-color: ${riskColor}; color: #ffffff; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                        ${riskLevel} RISK
                      </span>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                Your attached briefing document includes:
              </p>

              <ul style="color: #4a4a4a; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                <li>Executive summary of your quantum security posture</li>
                <li>Detailed risk profile with score breakdown</li>
                <li>Understanding the quantum threat landscape</li>
                <li>Projected cost of inaction</li>
                <li>Prioritized recommendations for your organization</li>
                <li>Budget estimates for remediation</li>
                <li>Next steps to protect your data</li>
              </ul>

              <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 30px 0;">
                We recommend reviewing this report with your leadership team to prioritize
                quantum-readiness initiatives.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="https://quantumsecuritylabs.com/contact"
                       style="display: inline-block; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-weight: 600; font-size: 16px;">
                      Schedule a Consultation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 30px;">
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                <strong>Quantum Security Labs</strong>
              </p>
              <p style="color: #6c757d; font-size: 12px; margin: 0 0 15px 0;">
                Preparing organizations for the post-quantum era
              </p>
              <p style="color: #a0a0a0; font-size: 12px; margin: 0;">
                This email was sent because you requested a Quantum Risk Executive Briefing.<br>
                If you did not request this report, please disregard this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Generate plain text version of the email
 * @param {Object} params - Template parameters
 * @returns {string} Plain text email content
 */
function generatePlainTextEmail({ userName, organizationName, riskScore, riskLevel }) {
  return `
Hello ${userName},

Thank you for completing the Quantum Risk Assessment for ${organizationName}.
Please find your Executive Briefing Report attached to this email.

YOUR RISK SCORE: ${riskScore} (${riskLevel} RISK)

Your attached briefing document includes:
- Executive summary of your quantum security posture
- Detailed risk profile with score breakdown
- Understanding the quantum threat landscape
- Projected cost of inaction
- Prioritized recommendations for your organization
- Budget estimates for remediation
- Next steps to protect your data

We recommend reviewing this report with your leadership team to prioritize quantum-readiness initiatives.

To schedule a consultation, visit: https://quantumsecuritylabs.com/contact

---
Quantum Security Labs
Preparing organizations for the post-quantum era

This email was sent because you requested a Quantum Risk Executive Briefing.
If you did not request this report, please disregard this email.
`;
}

/**
 * Send email with PDF report attachment
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.userName - Recipient's name
 * @param {string} params.organizationName - Organization name
 * @param {number} params.riskScore - Risk score from assessment
 * @param {string} params.riskLevel - Risk level
 * @param {Buffer} params.pdfBuffer - PDF file as buffer
 * @param {string} params.pdfFilename - Filename for the PDF attachment
 * @returns {Promise<Object>} Nodemailer send result
 */
async function sendReportEmail({
  to,
  userName,
  organizationName,
  riskScore,
  riskLevel,
  pdfBuffer,
  pdfFilename
}) {
  const transporter = createTransporter();

  const templateParams = { userName, organizationName, riskScore, riskLevel };

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'QSL Quantum Security <noreply@quantumsecuritylabs.com>',
    to,
    subject: 'Your Quantum Risk Executive Briefing',
    text: generatePlainTextEmail(templateParams),
    html: generateEmailTemplate(templateParams),
    attachments: [
      {
        filename: pdfFilename || 'Quantum-Risk-Executive-Briefing.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  const result = await transporter.sendMail(mailOptions);
  return result;
}

/**
 * Verify SMTP connection is working
 * @returns {Promise<boolean>} True if connection successful
 */
async function verifyConnection() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('SMTP connection verification failed:', error.message);
    return false;
  }
}

module.exports = {
  sendReportEmail,
  verifyConnection,
  generateEmailTemplate,
  generatePlainTextEmail
};
