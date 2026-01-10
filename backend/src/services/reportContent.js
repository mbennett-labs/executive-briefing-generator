/**
 * Report Content Generation Service
 * Story-013: PDF report content generation
 *
 * Generates dynamic content for the PDF executive briefing based on
 * assessment results and user information.
 */

const { questions } = require('../data/questions');

// Organization size configurations for cost projections and budgets
const ORG_SIZE_CONFIG = {
  under_50k: {
    label: 'Small Practice/Clinic',
    patientRange: 'under 50,000',
    breachCostBase: 500000,
    breachCostPerRecord: 180,
    avgRecordsAtRisk: 25000,
    budgetRange: { min: 75000, max: 150000 },
    implementationMonths: 6
  },
  '50k_250k': {
    label: 'Mid-size Hospital',
    patientRange: '50,000 - 250,000',
    breachCostBase: 1500000,
    breachCostPerRecord: 180,
    avgRecordsAtRisk: 150000,
    budgetRange: { min: 250000, max: 500000 },
    implementationMonths: 9
  },
  '250k_1m': {
    label: 'Large Hospital/Small System',
    patientRange: '250,000 - 1,000,000',
    breachCostBase: 3000000,
    breachCostPerRecord: 180,
    avgRecordsAtRisk: 500000,
    budgetRange: { min: 500000, max: 1500000 },
    implementationMonths: 12
  },
  '1m_5m': {
    label: 'Regional Health System',
    patientRange: '1,000,000 - 5,000,000',
    breachCostBase: 8000000,
    breachCostPerRecord: 180,
    avgRecordsAtRisk: 2000000,
    budgetRange: { min: 1500000, max: 4000000 },
    implementationMonths: 18
  },
  over_5m: {
    label: 'Large Health System',
    patientRange: 'over 5,000,000',
    breachCostBase: 20000000,
    breachCostPerRecord: 180,
    avgRecordsAtRisk: 5000000,
    budgetRange: { min: 4000000, max: 10000000 },
    implementationMonths: 24
  }
};

// Executive summaries by risk level
const EXECUTIVE_SUMMARIES = {
  LOW: (orgName, score) =>
    `${orgName} has demonstrated a proactive approach to cybersecurity with a quantum risk score of ${score}/100, placing you in the LOW risk category. Your organization has taken early steps toward quantum readiness, positioning you ahead of most healthcare organizations. While quantum computing threats are still emerging, your current security posture provides a solid foundation. We recommend maintaining awareness and beginning preliminary planning for quantum-safe cryptography migration within the next 12-18 months to stay ahead of the curve.`,

  MODERATE: (orgName, score) =>
    `${orgName}'s quantum risk assessment reveals a score of ${score}/100, indicating MODERATE risk exposure. Your organization has some protective measures in place, but gaps exist that could leave sensitive patient data vulnerable as quantum computing capabilities advance. Several areas require attention, particularly around cryptographic inventory and migration planning. We recommend initiating your quantum migration planning within the next 6 months to ensure adequate preparation time before quantum threats become operational.`,

  HIGH: (orgName, score) =>
    `${orgName} faces significant quantum computing risk with a score of ${score}/100, placing you in the HIGH risk category. Multiple vulnerability areas have been identified that require prompt attention. Your organization's current cryptographic infrastructure and data protection practices leave substantial room for improvement. Given the long shelf life of healthcare data and advancing quantum capabilities, we strongly recommend beginning migration planning immediately to protect sensitive patient information before quantum threats materialize.`,

  CRITICAL: (orgName, score) =>
    `${orgName}'s assessment reveals CRITICAL quantum risk exposure with a score of ${score}/100. Your organization faces serious vulnerabilities across multiple dimensions including data retention policies, cryptographic awareness, and migration readiness. The combination of long-term data retention requirements in healthcare and your current security posture creates an urgent situation. Patient records encrypted today could be harvested and decrypted once quantum computers become capable. Immediate action is required to begin remediation efforts and develop a comprehensive quantum migration strategy.`,

  SEVERE: (orgName, score) =>
    `${orgName} is facing SEVERE quantum risk exposure with a score of ${score}/100—the highest risk category. This assessment has identified critical vulnerabilities across nearly all evaluated dimensions. Your organization's data protection practices, combined with extensive regulatory requirements and potential infrastructure dependencies, create a compounding risk situation. The threat of "harvest now, decrypt later" attacks poses an existential risk to patient privacy and organizational reputation. We recommend engaging cybersecurity consultants immediately to begin emergency remediation and develop an accelerated quantum migration roadmap.`
};

// Recommendation templates by category
const RECOMMENDATIONS = {
  data_retention: {
    title: 'Data Retention & Encryption Review',
    description: 'Your long-term data retention policies require immediate cryptographic attention.',
    actions: [
      'Conduct an audit of all data retention periods and encryption methods',
      'Implement quantum-resistant encryption for newly archived data',
      'Develop a plan to re-encrypt legacy archives with quantum-safe algorithms',
      'Review data minimization policies to reduce long-term exposure'
    ],
    priority: 'immediate'
  },
  legacy_systems: {
    title: 'Legacy System Modernization',
    description: 'Aging systems with outdated cryptographic implementations present significant risk.',
    actions: [
      'Inventory all systems over 10 years old and their cryptographic dependencies',
      'Prioritize upgrade paths for critical legacy systems',
      'Implement cryptographic agility layers where direct upgrades are not feasible',
      'Establish timeline for phased modernization aligned with quantum threat horizon'
    ],
    priority: 'high'
  },
  regulatory_complexity: {
    title: 'Regulatory Compliance Strategy',
    description: 'Complex regulatory requirements demand a comprehensive quantum-readiness approach.',
    actions: [
      'Map all regulatory data protection requirements to current cryptographic implementations',
      'Engage with regulatory bodies to understand quantum-related compliance expectations',
      'Develop compliance-aligned quantum migration roadmap',
      'Establish monitoring for emerging quantum-related regulatory guidance'
    ],
    priority: 'high'
  },
  vendor_count: {
    title: 'Third-Party Vendor Risk Management',
    description: 'Your extensive vendor ecosystem amplifies quantum vulnerability exposure.',
    actions: [
      'Survey all vendors regarding their quantum readiness plans',
      'Update vendor contracts to include quantum-safe cryptography requirements',
      'Prioritize vendors with access to most sensitive data for early engagement',
      'Establish vendor quantum-readiness certification requirements'
    ],
    priority: 'high'
  },
  research_activity: {
    title: 'Research Data Protection Enhancement',
    description: 'Research data requires heightened protection given its long-term value.',
    actions: [
      'Implement enhanced encryption for all research databases and repositories',
      'Review clinical trial data protection with quantum threats in mind',
      'Establish research data classification with quantum-risk considerations',
      'Coordinate with research partners on quantum-safe data sharing protocols'
    ],
    priority: 'immediate'
  },
  critical_infrastructure: {
    title: 'Critical Infrastructure Hardening',
    description: 'Critical infrastructure designation demands accelerated quantum preparedness.',
    actions: [
      'Coordinate with federal/state agencies on quantum threat intelligence',
      'Implement additional protective measures for critical systems',
      'Develop quantum-specific incident response procedures',
      'Establish redundancy and continuity plans for quantum-threat scenarios'
    ],
    priority: 'immediate'
  },
  patient_safety_dependency: {
    title: 'Patient Safety System Security',
    description: 'High dependency on digital systems requires robust quantum-safe measures.',
    actions: [
      'Identify all patient safety-critical digital systems',
      'Implement defense-in-depth with quantum-resistant components',
      'Develop manual backup procedures for critical functions',
      'Establish quantum-specific security monitoring for patient safety systems'
    ],
    priority: 'immediate'
  },
  breach_history: {
    title: 'Security Incident Prevention Enhancement',
    description: 'Prior security incidents indicate need for strengthened cryptographic defenses.',
    actions: [
      'Conduct comprehensive review of prior incident root causes',
      'Implement advanced threat detection with quantum-aware capabilities',
      'Strengthen access controls and encryption at all data layers',
      'Establish proactive threat hunting for harvest-now-decrypt-later attacks'
    ],
    priority: 'immediate'
  },
  quantum_awareness: {
    title: 'Quantum Awareness & Training Program',
    description: 'Leadership and staff awareness is essential for effective quantum risk management.',
    actions: [
      'Develop executive briefing program on quantum computing threats',
      'Create quantum-awareness training for IT and security teams',
      'Establish ongoing quantum threat intelligence monitoring',
      'Integrate quantum risk into enterprise risk management frameworks'
    ],
    priority: 'high'
  },
  migration_readiness: {
    title: 'Cryptographic Inventory & Migration Planning',
    description: 'A complete cryptographic inventory is the foundation of quantum readiness.',
    actions: [
      'Conduct comprehensive cryptographic discovery across all systems',
      'Classify cryptographic usage by quantum vulnerability level',
      'Develop prioritized migration roadmap based on risk and feasibility',
      'Establish crypto-agility architecture for ongoing adaptability'
    ],
    priority: 'immediate'
  }
};

// Static content sections
const STATIC_CONTENT = {
  quantumThreat: {
    title: 'The Quantum Computing Threat to Healthcare',
    sections: [
      {
        heading: 'What is the Quantum Threat?',
        content: 'Quantum computers leverage quantum mechanical phenomena to solve certain mathematical problems exponentially faster than classical computers. This includes the mathematical problems that underpin today\'s most common encryption methods—RSA, ECC, and Diffie-Hellman key exchange. When sufficiently powerful quantum computers become available, they will be able to break these encryption methods in minutes rather than the billions of years required by classical computers.'
      },
      {
        heading: 'Why Healthcare is Uniquely Vulnerable',
        content: 'Healthcare organizations face heightened quantum risk due to several factors: extended data retention requirements (often 20+ years), the extreme sensitivity of patient health information, complex regulatory compliance obligations, and the irreversible nature of medical data exposure. Unlike financial data that can be changed (credit card numbers, account numbers), medical histories cannot be altered—once exposed, the damage is permanent.'
      },
      {
        heading: '"Harvest Now, Decrypt Later" Attacks',
        content: 'Nation-state actors and sophisticated threat actors are already collecting encrypted data with the intention of decrypting it once quantum computers become capable. This means patient data encrypted today using current methods may already be at risk. For healthcare data with 20-50 year retention requirements, this represents an immediate threat, not a future concern.'
      }
    ]
  },
  timeline: {
    title: 'Quantum Timeline & Migration Urgency',
    sections: [
      {
        heading: 'Current State of Quantum Computing',
        content: 'As of 2026, quantum computers have achieved significant milestones but have not yet reached cryptographically-relevant scale. However, progress is accelerating rapidly, with major investments from governments and private sector organizations worldwide.'
      },
      {
        heading: 'Expert Projections',
        content: 'Leading experts and government agencies estimate that cryptographically-relevant quantum computers could emerge between 2030 and 2035. NIST has already published post-quantum cryptographic standards, and federal agencies are mandating transition plans. The healthcare sector, with its long data retention requirements, cannot afford to wait.'
      },
      {
        heading: 'Migration Timeline Reality',
        content: 'Transitioning to quantum-safe cryptography is not a simple software update. It requires comprehensive inventory, planning, testing, and phased implementation. For large healthcare organizations, this process typically takes 3-5 years. Starting now is essential to complete migration before quantum threats become operational.'
      }
    ]
  },
  nextSteps: {
    title: 'Next Steps: Partnering with QSL',
    content: 'Quantum Security Labs (QSL) specializes in healthcare quantum readiness. Our team of cryptographic experts and healthcare security specialists can guide your organization through every phase of quantum migration.',
    offerings: [
      {
        name: 'Quantum Risk Deep Dive',
        description: 'Comprehensive assessment of your cryptographic infrastructure and detailed migration roadmap'
      },
      {
        name: 'Cryptographic Inventory Service',
        description: 'Complete discovery and classification of all cryptographic implementations across your enterprise'
      },
      {
        name: 'Migration Planning & Implementation',
        description: 'End-to-end support for transitioning to quantum-safe cryptography'
      },
      {
        name: 'Quantum Security Training',
        description: 'Executive and technical training programs on quantum threats and preparedness'
      }
    ],
    contact: {
      website: 'https://quantumsecuritylabs.com',
      email: 'healthcare@quantumsecuritylabs.com',
      phone: '1-800-QSL-SAFE'
    }
  }
};

/**
 * Get organization size from assessment responses
 */
function getOrgSize(responses) {
  const q1Response = responses.q1;
  return ORG_SIZE_CONFIG[q1Response] || ORG_SIZE_CONFIG['50k_250k'];
}

/**
 * Calculate cost projections based on organization size
 */
function calculateCostProjections(orgSize, riskLevel) {
  const config = orgSize;

  // Base breach cost calculation
  const baseBreachCost = config.breachCostBase + (config.breachCostPerRecord * config.avgRecordsAtRisk);

  // Risk multiplier based on risk level
  const riskMultipliers = {
    LOW: 0.3,
    MODERATE: 0.5,
    HIGH: 0.7,
    CRITICAL: 0.85,
    SEVERE: 1.0
  };
  const riskMultiplier = riskMultipliers[riskLevel] || 0.5;

  // Projected costs
  const estimatedBreachCost = Math.round(baseBreachCost * riskMultiplier);
  const regulatoryFines = Math.round(estimatedBreachCost * 0.15); // ~15% of breach cost
  const reputationCost = Math.round(estimatedBreachCost * 0.25); // ~25% of breach cost
  const operationalCost = Math.round(estimatedBreachCost * 0.10); // ~10% of breach cost

  return {
    estimatedBreachCost,
    regulatoryFines,
    reputationCost,
    operationalCost,
    totalPotentialCost: estimatedBreachCost + regulatoryFines + reputationCost + operationalCost,
    recordsAtRisk: config.avgRecordsAtRisk,
    costPerRecord: config.breachCostPerRecord
  };
}

/**
 * Generate budget estimate based on organization size
 */
function generateBudgetEstimate(orgSize) {
  const config = orgSize;

  return {
    assessmentPhase: {
      description: 'Cryptographic Discovery & Risk Assessment',
      costRange: {
        min: Math.round(config.budgetRange.min * 0.15),
        max: Math.round(config.budgetRange.max * 0.15)
      },
      duration: '2-3 months'
    },
    planningPhase: {
      description: 'Migration Strategy & Roadmap Development',
      costRange: {
        min: Math.round(config.budgetRange.min * 0.10),
        max: Math.round(config.budgetRange.max * 0.10)
      },
      duration: '1-2 months'
    },
    implementationPhase: {
      description: 'Quantum-Safe Cryptography Implementation',
      costRange: {
        min: Math.round(config.budgetRange.min * 0.60),
        max: Math.round(config.budgetRange.max * 0.60)
      },
      duration: `${Math.round(config.implementationMonths * 0.7)}-${config.implementationMonths} months`
    },
    validationPhase: {
      description: 'Testing, Validation & Compliance Verification',
      costRange: {
        min: Math.round(config.budgetRange.min * 0.15),
        max: Math.round(config.budgetRange.max * 0.15)
      },
      duration: '2-3 months'
    },
    totalBudget: {
      min: config.budgetRange.min,
      max: config.budgetRange.max
    },
    totalDuration: `${config.implementationMonths}-${Math.round(config.implementationMonths * 1.5)} months`,
    notes: [
      'Estimates based on typical healthcare organizations of similar size',
      'Actual costs may vary based on system complexity and scope',
      'Phased implementation approach recommended to manage costs',
      'ROI significantly exceeds investment when compared to potential breach costs'
    ]
  };
}

/**
 * Generate priority recommendations based on weakest areas
 */
function generateRecommendations(weakestAreas) {
  const recommendations = [];

  for (const area of weakestAreas.slice(0, 3)) {
    const category = area.question?.category;
    if (category && RECOMMENDATIONS[category]) {
      recommendations.push({
        rank: recommendations.length + 1,
        category: category,
        ...RECOMMENDATIONS[category],
        questionContext: area.question?.text,
        currentScore: area.score,
        maxScore: 10
      });
    }
  }

  // Fill in with generic recommendations if needed
  while (recommendations.length < 3) {
    const genericRecs = [
      RECOMMENDATIONS.migration_readiness,
      RECOMMENDATIONS.quantum_awareness,
      RECOMMENDATIONS.data_retention
    ];
    const rec = genericRecs[recommendations.length];
    if (rec) {
      recommendations.push({
        rank: recommendations.length + 1,
        ...rec
      });
    } else {
      break;
    }
  }

  return recommendations;
}

/**
 * Format currency for display
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format number with commas
 */
function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Main function: Generate all report content
 *
 * @param {object} params - Generation parameters
 * @param {object} params.assessment - Assessment data including responses, risk_score, risk_level
 * @param {object} params.user - User info including name, organization_name
 * @param {object} params.scoring - Scoring details including totalScore, riskLevel, weakestAreas
 * @returns {object} Structured content for PDF report
 */
function generateReportContent({ assessment, user, scoring }) {
  const orgName = user.organization_name || 'Your Organization';
  const riskLevel = scoring.riskLevel || assessment.risk_level;
  const totalScore = scoring.totalScore || assessment.risk_score;
  const responses = assessment.responses;

  // Get organization size configuration
  const orgSize = getOrgSize(responses);

  // Generate executive summary
  const executiveSummaryFn = EXECUTIVE_SUMMARIES[riskLevel] || EXECUTIVE_SUMMARIES.MODERATE;
  const executiveSummary = executiveSummaryFn(orgName, totalScore);

  // Calculate cost projections
  const costProjections = calculateCostProjections(orgSize, riskLevel);

  // Generate budget estimate
  const budgetEstimate = generateBudgetEstimate(orgSize);

  // Generate priority recommendations
  const recommendations = generateRecommendations(scoring.weakestAreas || []);

  // Build the complete report content
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      organizationName: orgName,
      userName: user.name,
      assessmentId: assessment.id,
      assessmentDate: assessment.created_at
    },

    coverPage: {
      title: 'Quantum Risk Executive Briefing',
      subtitle: 'Healthcare Quantum Readiness Assessment',
      organizationName: orgName,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      preparedBy: 'Quantum Security Labs',
      confidentiality: 'CONFIDENTIAL - For authorized personnel only'
    },

    executiveSummary: {
      title: 'Executive Summary',
      riskScore: totalScore,
      riskLevel: riskLevel,
      summary: executiveSummary,
      keyFindings: [
        `Overall quantum risk score: ${totalScore}/100 (${riskLevel})`,
        `Organization size: ${orgSize.label} (${orgSize.patientRange} patients)`,
        `Top vulnerability: ${recommendations[0]?.title || 'Cryptographic Readiness'}`,
        `Recommended action timeline: ${riskLevel === 'LOW' ? '12-18 months' : riskLevel === 'MODERATE' ? '6 months' : 'Immediate'}`
      ]
    },

    riskProfile: {
      title: 'Risk Profile Analysis',
      score: totalScore,
      level: riskLevel,
      breakdown: scoring.weakestAreas?.map((area, index) => ({
        rank: index + 1,
        category: area.question?.category?.replace(/_/g, ' ').toUpperCase(),
        question: area.question?.text,
        score: area.score,
        maxScore: 10,
        severity: area.score >= 8 ? 'Critical' : area.score >= 6 ? 'High' : area.score >= 4 ? 'Moderate' : 'Low'
      })) || []
    },

    quantumThreat: STATIC_CONTENT.quantumThreat,

    costOfInaction: {
      title: 'The Cost of Inaction',
      introduction: `Based on ${orgName}'s size and risk profile, the following projections illustrate potential financial exposure from a quantum-enabled data breach:`,
      projections: {
        breachCost: {
          label: 'Estimated Direct Breach Cost',
          value: costProjections.estimatedBreachCost,
          formatted: formatCurrency(costProjections.estimatedBreachCost),
          description: 'Investigation, notification, credit monitoring, legal fees'
        },
        regulatoryFines: {
          label: 'Potential Regulatory Fines',
          value: costProjections.regulatoryFines,
          formatted: formatCurrency(costProjections.regulatoryFines),
          description: 'HIPAA, state privacy laws, and other regulatory penalties'
        },
        reputationCost: {
          label: 'Reputation & Patient Trust Impact',
          value: costProjections.reputationCost,
          formatted: formatCurrency(costProjections.reputationCost),
          description: 'Patient attrition, brand damage, recruitment challenges'
        },
        operationalCost: {
          label: 'Operational Disruption',
          value: costProjections.operationalCost,
          formatted: formatCurrency(costProjections.operationalCost),
          description: 'System downtime, recovery, productivity loss'
        },
        total: {
          label: 'Total Potential Exposure',
          value: costProjections.totalPotentialCost,
          formatted: formatCurrency(costProjections.totalPotentialCost)
        }
      },
      recordsAtRisk: {
        count: costProjections.recordsAtRisk,
        formatted: formatNumber(costProjections.recordsAtRisk),
        costPerRecord: formatCurrency(costProjections.costPerRecord)
      },
      disclaimer: 'Projections based on healthcare industry breach data and organizational size. Actual costs may vary based on specific circumstances.'
    },

    recommendations: {
      title: 'Priority Recommendations',
      introduction: 'Based on your assessment results, we recommend focusing on these three priority areas:',
      items: recommendations
    },

    budgetEstimate: {
      title: 'Investment Estimate',
      introduction: `For an organization of ${orgName}'s size and complexity, we recommend budgeting for the following quantum migration phases:`,
      phases: [
        budgetEstimate.assessmentPhase,
        budgetEstimate.planningPhase,
        budgetEstimate.implementationPhase,
        budgetEstimate.validationPhase
      ],
      total: {
        budgetRange: {
          min: formatCurrency(budgetEstimate.totalBudget.min),
          max: formatCurrency(budgetEstimate.totalBudget.max)
        },
        duration: budgetEstimate.totalDuration
      },
      notes: budgetEstimate.notes,
      roi: {
        potentialCostAvoidance: formatCurrency(costProjections.totalPotentialCost),
        investmentRange: `${formatCurrency(budgetEstimate.totalBudget.min)} - ${formatCurrency(budgetEstimate.totalBudget.max)}`,
        roiMultiple: `${Math.round(costProjections.totalPotentialCost / budgetEstimate.totalBudget.max)}x - ${Math.round(costProjections.totalPotentialCost / budgetEstimate.totalBudget.min)}x`
      }
    },

    timeline: STATIC_CONTENT.timeline,

    nextSteps: STATIC_CONTENT.nextSteps
  };
}

module.exports = {
  generateReportContent,
  // Export helpers for testing
  getOrgSize,
  calculateCostProjections,
  generateBudgetEstimate,
  generateRecommendations,
  formatCurrency,
  formatNumber,
  // Export constants for reference
  ORG_SIZE_CONFIG,
  EXECUTIVE_SUMMARIES,
  RECOMMENDATIONS,
  STATIC_CONTENT
};
