const express = require('express');
const router = express.Router();
const db = require('../db');

// Category display order
const CATEGORY_ORDER = [
  'data_sensitivity',
  'encryption',
  'compliance',
  'vendor_risk',
  'incident_response',
  'quantum_readiness'
];

// Category display names
const CATEGORY_NAMES = {
  data_sensitivity: 'Data Sensitivity',
  encryption: 'Encryption Infrastructure',
  compliance: 'Compliance',
  vendor_risk: 'Vendor Risk',
  incident_response: 'Incident Response',
  quantum_readiness: 'Quantum Readiness'
};

// GET /api/questions - Get all assessment questions grouped by category
router.get('/', async (req, res) => {
  try {
    const questions = await db('questions')
      .select('id', 'category', 'question_text', 'answer_type', 'answer_options', 'order_index')
      .orderBy('order_index', 'asc');

    // Group questions by category
    const groupedByCategory = {};
    for (const question of questions) {
      if (!groupedByCategory[question.category]) {
        groupedByCategory[question.category] = [];
      }
      groupedByCategory[question.category].push({
        id: question.id,
        question_text: question.question_text,
        answer_type: question.answer_type,
        answer_options: typeof question.answer_options === 'string'
          ? JSON.parse(question.answer_options)
          : question.answer_options
      });
    }

    // Build ordered response
    const categories = CATEGORY_ORDER.map(categoryKey => ({
      key: categoryKey,
      name: CATEGORY_NAMES[categoryKey],
      questions: groupedByCategory[categoryKey] || []
    }));

    res.json({
      categories,
      metadata: {
        totalQuestions: questions.length,
        totalCategories: CATEGORY_ORDER.length
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// GET /api/questions/:id - Get a single question by ID
router.get('/:id', async (req, res) => {
  try {
    const question = await db('questions')
      .where({ id: req.params.id })
      .first();

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({
      question: {
        id: question.id,
        category: question.category,
        question_text: question.question_text,
        answer_type: question.answer_type,
        answer_options: typeof question.answer_options === 'string'
          ? JSON.parse(question.answer_options)
          : question.answer_options
      }
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

module.exports = router;
