/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Insert encryption category questions (Q9-Q16)
  const questions = [
    {
      category: 'encryption',
      question_text: 'What encryption standards do you use for data at rest?',
      answer_type: 'multi-select',
      answer_options: JSON.stringify([
        'AES-256',
        'AES-128',
        'Triple DES (3DES)',
        'RSA-2048 or higher',
        'Full disk encryption',
        'Database-level encryption',
        'File-level encryption',
        'No encryption at rest',
        'Unknown/Unsure'
      ]),
      weight: 1,
      order_index: 9
    },
    {
      category: 'encryption',
      question_text: 'What encryption protocols do you use for data in transit?',
      answer_type: 'multi-select',
      answer_options: JSON.stringify([
        'TLS 1.3',
        'TLS 1.2',
        'TLS 1.1 or older',
        'IPSec VPN',
        'SSH/SFTP',
        'End-to-end encryption for messaging',
        'No encryption in transit',
        'Unknown/Unsure'
      ]),
      weight: 1,
      order_index: 10
    },
    {
      category: 'encryption',
      question_text: 'What key exchange algorithms does your organization currently use?',
      answer_type: 'multi-select',
      answer_options: JSON.stringify([
        'RSA key exchange',
        'Diffie-Hellman (DH)',
        'Elliptic Curve Diffie-Hellman (ECDH)',
        'Pre-shared keys (PSK)',
        'Hybrid classical/post-quantum',
        'Unknown/Not documented',
        'No formal key exchange process'
      ]),
      weight: 1,
      order_index: 11
    },
    {
      category: 'encryption',
      question_text: 'How does your organization manage cryptographic keys?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No formal key management',
        'Manual key management with basic documentation',
        'Dedicated Key Management System (KMS)',
        'Hardware Security Modules (HSM)',
        'Cloud-based KMS (AWS KMS, Azure Key Vault, etc.)',
        'Enterprise KMS with automated rotation'
      ]),
      weight: 1,
      order_index: 12
    },
    {
      category: 'encryption',
      question_text: 'When was your last cryptographic infrastructure audit?',
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
      order_index: 13
    },
    {
      category: 'encryption',
      question_text: 'Do you maintain a complete inventory of all cryptographic algorithms and implementations in use?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'No inventory exists',
        'Partial inventory of major systems',
        'Comprehensive inventory but not maintained',
        'Maintained inventory updated annually',
        'Automated cryptographic discovery and inventory'
      ]),
      weight: 1,
      order_index: 14
    },
    {
      category: 'encryption',
      question_text: 'Has your organization begun testing or evaluating post-quantum cryptographic (PQC) algorithms?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'Not aware of PQC',
        'Aware but no action taken',
        'Initial research phase',
        'Actively evaluating PQC options',
        'Piloting PQC in non-production',
        'Implementing PQC in production systems'
      ]),
      weight: 1,
      order_index: 15
    },
    {
      category: 'encryption',
      question_text: 'What percentage of your systems use cryptographic algorithms vulnerable to quantum attacks (RSA, ECC, DH)?',
      answer_type: 'range',
      answer_options: JSON.stringify([
        'Unknown/Not assessed',
        '81-100%',
        '61-80%',
        '41-60%',
        '21-40%',
        '0-20%'
      ]),
      weight: 1,
      order_index: 16
    }
  ];

  // Check if questions already exist for this category
  const existing = await knex('questions').where({ category: 'encryption' }).first();

  if (!existing) {
    await knex('questions').insert(questions);
  }
};
