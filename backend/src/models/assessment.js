/**
 * Assessment Model
 * Handles database operations for assessments
 */

const db = require('../db');

const Assessment = {
  /**
   * Find assessment by ID
   */
  async findById(id) {
    const assessment = await db('assessments').where({ id }).first();
    if (assessment && assessment.responses) {
      assessment.responses = JSON.parse(assessment.responses);
    }
    return assessment;
  },

  /**
   * Find all assessments for a user
   */
  async findByUserId(userId) {
    const assessments = await db('assessments')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');

    return assessments.map(a => ({
      ...a,
      responses: a.responses ? JSON.parse(a.responses) : null
    }));
  },

  /**
   * Create a new assessment
   */
  async create({ user_id, organization_name, organization_type, employee_count, responses, scores, overall_score, risk_score, risk_level }) {
    const [id] = await db('assessments').insert({
      user_id,
      organization_name,
      organization_type,
      employee_count,
      responses: JSON.stringify(responses),
      scores: scores ? JSON.stringify(scores) : null,
      overall_score,
      risk_score: risk_score || overall_score,
      risk_level,
      created_at: new Date().toISOString()
    });

    return this.findById(id);
  },

  /**
   * Convert assessment to public format (for API response)
   */
  toPublic(assessment) {
    if (!assessment) return null;
    return {
      id: assessment.id,
      user_id: assessment.user_id,
      organization_name: assessment.organization_name,
      organization_type: assessment.organization_type,
      employee_count: assessment.employee_count,
      responses: assessment.responses,
      scores: assessment.scores ? (typeof assessment.scores === 'string' ? JSON.parse(assessment.scores) : assessment.scores) : null,
      overall_score: assessment.overall_score,
      risk_score: assessment.risk_score,
      risk_level: assessment.risk_level,
      created_at: assessment.created_at
    };
  }
};

module.exports = Assessment;
