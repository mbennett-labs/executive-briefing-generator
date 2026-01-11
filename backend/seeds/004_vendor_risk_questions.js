/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Insert vendor_risk category questions (Q25-Q32)
  const questions = [
    {
      category: 'vendor_risk',
      question_text: 'How many third-party vendors have access to your PHI or critical systems?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        '1-10 vendors',
        '11-25 vendors',
        '26-50 vendors',
        '51-100 vendors',
        '101-200 vendors',
        'More than 200 vendors'
      ]),
      weight: 1,
      order_index: 25
    },
    {
      category: 'vendor_risk',
      question_text: 'Do you assess the encryption practices of your vendors before engagement?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No vendor security assessments',
        'Basic questionnaire only',
        'Detailed security questionnaire',
        'Questionnaire plus documentation review',
        'Comprehensive assessment including crypto audit'
      ]),
      weight: 1,
      order_index: 26
    },
    {
      category: 'vendor_risk',
      question_text: 'Do your vendor contracts include specific encryption requirements?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No encryption requirements in contracts',
        'Generic security language only',
        'Basic encryption requirements',
        'Detailed encryption standards specified',
        'Comprehensive crypto requirements with audit rights'
      ]),
      weight: 1,
      order_index: 27
    },
    {
      category: 'vendor_risk',
      question_text: 'Which cloud service providers store or process your PHI?',
      answer_type: 'multi-select',
      answer_options: JSON.stringify([
        'AWS',
        'Microsoft Azure',
        'Google Cloud Platform',
        'Oracle Cloud',
        'IBM Cloud',
        'Salesforce',
        'Healthcare-specific cloud (Epic, Cerner, etc.)',
        'Private/on-premises cloud',
        'Multiple SaaS applications',
        'No cloud usage'
      ]),
      weight: 1,
      order_index: 28
    },
    {
      category: 'vendor_risk',
      question_text: 'Do you know which encryption algorithms your cloud providers use for your data?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No visibility into provider encryption',
        'General awareness only',
        'Know encryption types but not specifics',
        'Detailed knowledge of encryption standards',
        'Full visibility with documented configurations'
      ]),
      weight: 1,
      order_index: 29
    },
    {
      category: 'vendor_risk',
      question_text: 'Have you discussed post-quantum cryptography plans with your critical vendors?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'Not aware of PQC vendor discussions',
        'No discussions with vendors',
        'Informal discussions with some vendors',
        'Formal discussions with critical vendors',
        'PQC requirements included in vendor roadmaps'
      ]),
      weight: 1,
      order_index: 30
    },
    {
      category: 'vendor_risk',
      question_text: 'When was your last security assessment of vendors with PHI access?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'Never conducted',
        'More than 2 years ago',
        '1-2 years ago',
        '6-12 months ago',
        'Within the last 6 months',
        'Continuous monitoring in place'
      ]),
      weight: 1,
      order_index: 31
    },
    {
      category: 'vendor_risk',
      question_text: 'Do you have visibility into your vendors\' subcontractors who may access your data?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No visibility into subcontractors',
        'Aware subcontractors exist but no details',
        'Know major subcontractors only',
        'Documented list of all subcontractors',
        'Full visibility with security requirements flow-down'
      ]),
      weight: 1,
      order_index: 32
    }
  ];

  // Check if questions already exist for this category
  const existing = await knex('questions').where({ category: 'vendor_risk' }).first();

  if (!existing) {
    await knex('questions').insert(questions);
  }
};
