/**
 * Report Model
 * Handles database operations for generated reports
 */

const db = require('../db');

const Report = {
  /**
   * Find report by ID
   */
  async findById(id) {
    return db('reports').where({ id }).first();
  },

  /**
   * Find report by assessment ID
   */
  async findByAssessmentId(assessmentId) {
    return db('reports').where({ assessment_id: assessmentId }).first();
  },

  /**
   * Find all reports for an assessment
   */
  async findAllByAssessmentId(assessmentId) {
    return db('reports')
      .where({ assessment_id: assessmentId })
      .orderBy('created_at', 'desc');
  },

  /**
   * Create a new report record
   */
  async create({ assessment_id, content, pdf_url, pdf_path }) {
    const [id] = await db('reports').insert({
      assessment_id,
      content: content ? JSON.stringify(content) : null,
      pdf_url,
      pdf_path,
      email_sent: false,
      created_at: new Date().toISOString()
    });

    return this.findById(id);
  },

  /**
   * Update report's email_sent status
   */
  async markEmailSent(id) {
    await db('reports')
      .where({ id })
      .update({ email_sent: true });

    return this.findById(id);
  },

  /**
   * Update report's PDF URL
   */
  async updatePdfUrl(id, pdf_url) {
    await db('reports')
      .where({ id })
      .update({ pdf_url });

    return this.findById(id);
  },

  /**
   * Convert report to public format (for API response)
   */
  toPublic(report) {
    if (!report) return null;
    return {
      id: report.id,
      assessment_id: report.assessment_id,
      content: report.content ? (typeof report.content === 'string' ? JSON.parse(report.content) : report.content) : null,
      pdf_url: report.pdf_url,
      pdf_path: report.pdf_path,
      email_sent: !!report.email_sent,
      created_at: report.created_at
    };
  }
};

module.exports = Report;
