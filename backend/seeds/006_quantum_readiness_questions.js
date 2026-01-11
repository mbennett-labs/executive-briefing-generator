/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Insert quantum_readiness category questions (Q41-Q48)
  const questions = [
    {
      category: 'quantum_readiness',
      question_text: 'Is your executive leadership aware of the quantum computing threat to current encryption?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No awareness at leadership level',
        'Vague awareness only',
        'General understanding of the threat',
        'Good understanding with some planning',
        'Full awareness with active strategic planning'
      ]),
      weight: 1,
      order_index: 41
    },
    {
      category: 'quantum_readiness',
      question_text: 'Does your organization have a post-quantum cryptography migration roadmap?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No roadmap or plans',
        'Aware but no formal planning',
        'Initial planning discussions started',
        'Draft roadmap in development',
        'Formal roadmap approved and in execution'
      ]),
      weight: 1,
      order_index: 42
    },
    {
      category: 'quantum_readiness',
      question_text: 'Has your organization allocated budget for post-quantum cryptography initiatives?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No budget allocated',
        'Budget discussions not started',
        'Budget under consideration',
        'Partial budget allocated',
        'Dedicated budget approved for PQC transition'
      ]),
      weight: 1,
      order_index: 43
    },
    {
      category: 'quantum_readiness',
      question_text: 'What is your target timeline for beginning post-quantum cryptography implementation?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No timeline established',
        'More than 5 years out',
        '3-5 years',
        '1-3 years',
        'Within the next year',
        'Already implementing'
      ]),
      weight: 1,
      order_index: 44
    },
    {
      category: 'quantum_readiness',
      question_text: 'Have you identified which systems should be prioritized for PQC migration?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No prioritization done',
        'Aware of need but not assessed',
        'Initial assessment in progress',
        'Priority systems identified',
        'Detailed prioritization with migration plan'
      ]),
      weight: 1,
      order_index: 45
    },
    {
      category: 'quantum_readiness',
      question_text: 'Do your IT/security staff have training on post-quantum cryptography?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No PQC training or awareness',
        'Self-directed learning only',
        'Basic awareness training completed',
        'Formal training for key staff',
        'Comprehensive training program with certifications'
      ]),
      weight: 1,
      order_index: 46
    },
    {
      category: 'quantum_readiness',
      question_text: 'Are you tracking NIST post-quantum cryptography standards development?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'Not aware of NIST PQC standards',
        'Aware but not tracking',
        'Occasional monitoring',
        'Regular monitoring of developments',
        'Active tracking with implementation planning'
      ]),
      weight: 1,
      order_index: 47
    },
    {
      category: 'quantum_readiness',
      question_text: 'Have you engaged with vendors about their post-quantum cryptography roadmaps?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No vendor engagement on PQC',
        'Not yet but planning to',
        'Informal discussions with some vendors',
        'Formal discussions with critical vendors',
        'PQC requirements in vendor contracts/roadmaps'
      ]),
      weight: 1,
      order_index: 48
    }
  ];

  // Check if questions already exist for this category
  const existing = await knex('questions').where({ category: 'quantum_readiness' }).first();

  if (!existing) {
    await knex('questions').insert(questions);
  }
};
