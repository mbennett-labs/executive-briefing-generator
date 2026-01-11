/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Insert compliance category questions (Q17-Q24)
  const questions = [
    {
      category: 'compliance',
      question_text: 'Which regulatory frameworks apply to your organization?',
      answer_type: 'multi-select',
      answer_options: JSON.stringify([
        'HIPAA',
        'HITECH',
        'State privacy laws (CCPA, etc.)',
        'FDA regulations (21 CFR Part 11)',
        'SOC 2',
        'HITRUST',
        'PCI DSS',
        'GDPR',
        'State breach notification laws',
        'Other healthcare-specific regulations'
      ]),
      weight: 1,
      order_index: 17
    },
    {
      category: 'compliance',
      question_text: 'When was your last formal risk assessment that included cryptographic controls?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'Never conducted',
        'More than 3 years ago',
        '2-3 years ago',
        '1-2 years ago',
        '6-12 months ago',
        'Within the last 6 months'
      ]),
      weight: 1,
      order_index: 18
    },
    {
      category: 'compliance',
      question_text: 'Do you have documented policies for encryption key management?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No documented policies',
        'Informal guidelines only',
        'Documented but not regularly reviewed',
        'Documented and reviewed annually',
        'Comprehensive policies with regular audits'
      ]),
      weight: 1,
      order_index: 19
    },
    {
      category: 'compliance',
      question_text: 'Do your Business Associate Agreements (BAAs) include cryptographic security requirements?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No BAAs in place',
        'BAAs exist but no crypto requirements',
        'Generic security language only',
        'Specific encryption requirements included',
        'Detailed crypto standards with audit rights'
      ]),
      weight: 1,
      order_index: 20
    },
    {
      category: 'compliance',
      question_text: 'How prepared is your organization for a compliance audit of your cryptographic controls?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'Not prepared at all',
        'Would need significant preparation',
        'Somewhat prepared with gaps',
        'Mostly prepared with minor gaps',
        'Fully prepared with documented evidence'
      ]),
      weight: 1,
      order_index: 21
    },
    {
      category: 'compliance',
      question_text: 'Do your incident response procedures specifically address cryptographic compromise scenarios?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No incident response procedures',
        'Generic IR procedures only',
        'IR procedures mention encryption but lack detail',
        'Specific crypto compromise procedures exist',
        'Detailed playbooks with regular testing'
      ]),
      weight: 1,
      order_index: 22
    },
    {
      category: 'compliance',
      question_text: 'Has your organization assessed compliance implications of the quantum computing threat?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'Not aware of quantum compliance implications',
        'Aware but no assessment done',
        'Initial assessment in progress',
        'Assessment complete, planning remediation',
        'Active compliance roadmap for PQC transition'
      ]),
      weight: 1,
      order_index: 23
    },
    {
      category: 'compliance',
      question_text: 'How do you track and respond to new regulatory guidance on cryptographic standards?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No formal tracking process',
        'Ad-hoc awareness only',
        'Periodic review of major regulations',
        'Regular monitoring with documented process',
        'Proactive engagement with regulatory developments'
      ]),
      weight: 1,
      order_index: 24
    }
  ];

  // Check if questions already exist for this category
  const existing = await knex('questions').where({ category: 'compliance' }).first();

  if (!existing) {
    await knex('questions').insert(questions);
  }
};
