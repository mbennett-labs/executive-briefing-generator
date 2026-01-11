/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Insert incident_response category questions (Q33-Q40)
  const questions = [
    {
      category: 'incident_response',
      question_text: 'Does your organization have a documented incident response plan?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No incident response plan',
        'Informal/undocumented procedures',
        'Documented plan but not tested',
        'Documented and tested annually',
        'Comprehensive plan with regular drills'
      ]),
      weight: 1,
      order_index: 33
    },
    {
      category: 'incident_response',
      question_text: 'Does your incident response plan include specific scenarios for cryptographic compromise?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No crypto-specific scenarios',
        'Generic breach scenarios only',
        'Basic crypto compromise mentioned',
        'Detailed crypto compromise playbooks',
        'Comprehensive playbooks including quantum threat'
      ]),
      weight: 1,
      order_index: 34
    },
    {
      category: 'incident_response',
      question_text: 'How quickly can your organization rotate compromised cryptographic keys?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No key rotation capability',
        'Weeks to months',
        'Days to weeks',
        'Hours to days',
        '1-4 hours',
        'Automated/immediate rotation'
      ]),
      weight: 1,
      order_index: 35
    },
    {
      category: 'incident_response',
      question_text: 'When was your last tabletop exercise or drill involving a security incident?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'Never conducted',
        'More than 2 years ago',
        '1-2 years ago',
        '6-12 months ago',
        'Within the last 6 months',
        'Quarterly or more frequent'
      ]),
      weight: 1,
      order_index: 36
    },
    {
      category: 'incident_response',
      question_text: 'Do you maintain offline/air-gapped backups of critical data and cryptographic keys?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No offline backups',
        'Some offline backups but not comprehensive',
        'Offline backups of data only',
        'Offline backups of data and some keys',
        'Comprehensive offline backups including all critical keys'
      ]),
      weight: 1,
      order_index: 37
    },
    {
      category: 'incident_response',
      question_text: 'If all current encryption were compromised, how quickly could you restore operations with new cryptographic systems?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No capability assessed',
        'Months or longer',
        'Weeks to months',
        'Days to weeks',
        '1-3 days',
        'Less than 24 hours'
      ]),
      weight: 1,
      order_index: 38
    },
    {
      category: 'incident_response',
      question_text: 'Does your cyber insurance policy cover cryptographic failures or quantum-related breaches?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No cyber insurance',
        'Insurance but crypto coverage unknown',
        'Insurance with generic crypto coverage',
        'Insurance with specific crypto breach coverage',
        'Comprehensive coverage including emerging threats'
      ]),
      weight: 1,
      order_index: 39
    },
    {
      category: 'incident_response',
      question_text: 'Do you monitor for "harvest now, decrypt later" (HNDL) attacks on your encrypted data?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'Not aware of HNDL threat',
        'Aware but no monitoring',
        'Basic traffic monitoring only',
        'Enhanced monitoring for data exfiltration',
        'Advanced threat detection including HNDL patterns'
      ]),
      weight: 1,
      order_index: 40
    }
  ];

  // Check if questions already exist for this category
  const existing = await knex('questions').where({ category: 'incident_response' }).first();

  if (!existing) {
    await knex('questions').insert(questions);
  }
};
