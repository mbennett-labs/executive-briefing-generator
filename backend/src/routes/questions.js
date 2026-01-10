const express = require('express');
const router = express.Router();
const { questions, TOTAL_QUESTIONS, SCORED_QUESTIONS, MIN_POSSIBLE_SCORE, MAX_POSSIBLE_SCORE } = require('../data/questions');

// GET /api/questions - Get all assessment questions
router.get('/', (req, res) => {
  res.json({
    questions,
    metadata: {
      totalQuestions: TOTAL_QUESTIONS,
      scoredQuestions: SCORED_QUESTIONS,
      minPossibleScore: MIN_POSSIBLE_SCORE,
      maxPossibleScore: MAX_POSSIBLE_SCORE
    }
  });
});

// GET /api/questions/:id - Get a single question by ID
router.get('/:id', (req, res) => {
  const question = questions.find(q => q.id === req.params.id);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }
  res.json({ question });
});

module.exports = router;
