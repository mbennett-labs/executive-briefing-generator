/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Insert data_sensitivity category questions (Q1-Q8)
  const questions = [
    {
      category: 'data_sensitivity',
      question_text: 'What types of Protected Health Information (PHI) does your organization store or process?',
      answer_type: 'multi-select',
      answer_options: JSON.stringify([
        'Patient names and demographics',
        'Social Security Numbers',
        'Medical records and diagnoses',
        'Prescription and medication data',
        'Genetic/genomic data',
        'Mental health records',
        'Substance abuse records',
        'Financial/billing information',
        'Biometric data'
      ]),
      weight: 1,
      order_index: 1
    },
    {
      category: 'data_sensitivity',
      question_text: 'Approximately how many patient records does your organization maintain?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'Less than 10,000',
        '10,000 - 100,000',
        '100,000 - 500,000',
        '500,000 - 1 million',
        '1 million - 5 million',
        'More than 5 million'
      ]),
      weight: 1,
      order_index: 2
    },
    {
      category: 'data_sensitivity',
      question_text: 'What is your longest data retention period for sensitive patient information?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'Less than 1 year',
        '1-3 years',
        '3-7 years',
        '7-10 years',
        '10-20 years',
        'More than 20 years or indefinite'
      ]),
      weight: 1,
      order_index: 3
    },
    {
      category: 'data_sensitivity',
      question_text: 'Does your organization store data that will remain sensitive for 10+ years (e.g., genetic data, pediatric records, HIV status)?',
      answer_type: 'yes-no',
      answer_options: JSON.stringify([
        'Yes',
        'No',
        'Unsure'
      ]),
      weight: 1,
      order_index: 4
    },
    {
      category: 'data_sensitivity',
      question_text: 'Does your organization have a formal data classification system for PHI?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No classification system exists',
        'Informal/ad-hoc classification',
        'Documented policy but inconsistent enforcement',
        'Formal system with regular enforcement',
        'Comprehensive system with automated tagging'
      ]),
      weight: 1,
      order_index: 5
    },
    {
      category: 'data_sensitivity',
      question_text: 'How many employees, contractors, and third parties have access to sensitive PHI?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'Less than 50',
        '50-200',
        '200-500',
        '500-1,000',
        '1,000-5,000',
        'More than 5,000'
      ]),
      weight: 1,
      order_index: 6
    },
    {
      category: 'data_sensitivity',
      question_text: 'When was your last comprehensive audit of data access permissions?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'Never conducted',
        'More than 2 years ago',
        '1-2 years ago',
        '6-12 months ago',
        '3-6 months ago',
        'Within the last 3 months'
      ]),
      weight: 1,
      order_index: 7
    },
    {
      category: 'data_sensitivity',
      question_text: 'Do you have a complete inventory/map of where all PHI is stored across your systems?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No inventory exists',
        'Partial inventory of major systems only',
        'Comprehensive inventory but not regularly updated',
        'Comprehensive inventory updated annually',
        'Automated discovery and real-time inventory'
      ]),
      weight: 1,
      order_index: 8
    }
  ];

  // Check if questions already exist for this category
  const existing = await knex('questions').where({ category: 'data_sensitivity' }).first();

  if (!existing) {
    await knex('questions').insert(questions);
  }
};
