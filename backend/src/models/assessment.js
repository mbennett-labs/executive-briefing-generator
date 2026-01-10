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
  async create({ user_id, responses, risk_score, risk_level }) {
    const [id] = await db('assessments').insert({
      user_id,
      responses: JSON.stringify(responses),
      risk_score,
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
      responses: assessment.responses,
      risk_score: assessment.risk_score,
      risk_level: assessment.risk_level,
      created_at: assessment.created_at
    };
  }
};

module.exports = Assessment;
