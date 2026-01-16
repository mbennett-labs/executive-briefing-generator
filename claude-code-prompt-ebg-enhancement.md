# CLAUDE CODE PROMPT - Executive Briefing Generator Enhancement

## CONTEXT
You are working on the Executive Briefing Generator for Quantum Shield Labs.
- **Repo:** `C:\Users\mikeb\projects\executive-briefing-generator`
- **Live app:** https://executive-briefing-generator.vercel.app
- **Status:** App runs, but report generation needs to be more personalized/specific

## THE PROBLEM
Currently the generated reports may be too generic. We need to:
1. Use questionnaire answers to build TARGETED queries
2. Query NotebookLM with specific prompts based on org's gaps
3. Get specific (not generic) synthesis from NotebookLM
4. Feed that into Claude for final personalization

## FOUR NOTEBOOKLM SOURCES

### Notebook 1: PRD Design for AI Agents (METHODOLOGY)
- **URL:** https://notebooklm.google.com/notebook/0d219d93-5e1a-45d6-ae29-2e381d9f8e9b
- **Sources:** 26
- **Contains:** Ralph Wiggum workflow, autonomous AI coding patterns, PRD best practices
- **Purpose:** Learn HOW to structure prompts and workflows (internal use only)

### Notebook 2: QSL Quantum Security Research (MAIN CONTENT)
- **URL:** https://notebooklm.google.com/notebook/b0ce9862-9ed3-486c-8e5c-b8743383d3a7  
- **Sources:** 18
- **Contains:** Full playbook, QSL blog posts, industry research, threat timelines
- **Purpose:** Primary source for executive briefings - general quantum risk content
- **Use for:** Data Sensitivity, Vendor Risk, Incident Response questions

### Notebook 3: HHS Portal for HIPAA and Health Privacy Rights (COMPLIANCE)
- **URL:** https://notebooklm.google.com/notebook/7a181258-6d88-4ec7-a92a-441f76731318
- **Sources:** 3
- **Contains:** HHS regulations, HIPAA compliance, Cloud Security Alliance quantum-safe working group
- **Purpose:** Healthcare compliance and regulatory guidance
- **Use for:** Compliance questions (Q17-Q24), BAA requirements, audit readiness

### Notebook 4: NIST Post-Quantum Cryptography Standards and Migration Project (TECHNICAL)
- **URL:** https://notebooklm.google.com/notebook/4a20d5d3-57a4-4ac6-bba1-fc182464a0a9
- **Sources:** 4
- **Contains:** NIST FIPS 203/204/205, IBM Quantum roadmap, CSA standards
- **Purpose:** Technical standards and migration guidance
- **Use for:** Encryption questions (Q9-Q16), Quantum Readiness (Q41-Q48)

## NOTEBOOK ROUTING LOGIC

Based on questionnaire category, route to appropriate notebook:

```javascript
const notebookRouting = {
  data_sensitivity: 'QSL Quantum Security Research',      // General risk context
  encryption: 'NIST PQC Standards and Migration',         // Technical standards
  compliance: 'HHS Portal for HIPAA',                     // Regulatory guidance
  vendor_risk: 'QSL Quantum Security Research',           // General risk context
  incident_response: 'QSL Quantum Security Research',     // Playbook content
  quantum_readiness: 'NIST PQC Standards and Migration'   // Technical roadmap
};
```

For comprehensive reports, query MULTIPLE notebooks and synthesize:
1. Query NIST notebook for technical standards
2. Query HHS notebook for compliance implications
3. Query QSL notebook for business context and recommendations
4. Combine all three for final executive briefing

## YOUR TASKS

### Task 1: Review Current Prompt Structure
Look at `/backend/src/prompts/` - understand how reports are currently generated.

### Task 2: Review the Questionnaire → Query Mapping
The 48 questions are in 6 categories:
1. Data Sensitivity (Q1-Q8)
2. Encryption Infrastructure (Q9-Q16)
3. Compliance (Q17-Q24)
4. Vendor Risk (Q25-Q32)
5. Incident Response (Q33-Q40)
6. Quantum Readiness (Q41-Q48)

Each category's answers should generate a SPECIFIC query to NotebookLM.

### Task 3: Design Dynamic Query Builder
Create a system that takes questionnaire responses and builds targeted NotebookLM queries.

**Example:** If org answers show:
- 81-100% quantum-vulnerable encryption
- No PQC roadmap
- 20+ year data retention
- No HNDL monitoring

The query to NotebookLM should be:
```
Based on a healthcare organization with these specific characteristics:
- 81-100% of systems use quantum-vulnerable encryption (RSA, ECDH)
- No post-quantum cryptography roadmap exists
- Data retention requirements exceed 20 years
- No monitoring for "harvest now, decrypt later" attacks

Provide specific analysis on:
1. Why their 20+ year retention creates exceptional quantum exposure
2. Which NIST PQC standards (FIPS 203, 204, 205) they should prioritize first
3. Specific HNDL risks for healthcare data vs other industries
4. Recommended timeline given their current state
5. Budget considerations for organizations at this maturity level
```

### Task 4: Update the Pipeline Architecture

Current flow:
```
Questionnaire → Risk Score → Generic Report
```

New flow:
```
Questionnaire 
    → Analyze answers by category
    → Build SPECIFIC NotebookLM query per category
    → NotebookLM returns targeted synthesis
    → Claude API personalizes with org details
    → Final Executive Briefing (PDF)
```

### Task 5: Implement Query Templates

Create query templates for each category that get populated with actual answers:

```javascript
// /backend/src/prompts/notebooklm-queries.js

const queryTemplates = {
  data_sensitivity: (answers) => `
    For a healthcare organization storing ${answers.q2_record_count} patient records
    with ${answers.q3_retention_period} retention requirements,
    handling these PHI types: ${answers.q1_phi_types.join(', ')}
    
    Analyze:
    1. Quantum exposure timeline for their specific data sensitivity
    2. "Harvest now, decrypt later" risk for their record volume
    3. Priority data categories for migration
  `,
  
  encryption: (answers) => `
    Organization uses: ${answers.q9_encryption_at_rest.join(', ')} for data at rest
    Key exchange: ${answers.q11_key_exchange.join(', ')}
    PQC testing status: ${answers.q15_pqc_testing}
    Vulnerable systems: ${answers.q16_vulnerable_percentage}
    
    Provide:
    1. Specific vulnerabilities in their current encryption stack
    2. Which algorithms need immediate replacement
    3. Hybrid migration approach for their setup
  `,
  
  // ... similar for compliance, vendor_risk, incident_response, quantum_readiness
};
```

## FILES TO REVIEW/MODIFY

1. `/backend/src/prompts/` - Current prompt templates
2. `/backend/src/services/` - Claude API integration, report generation
3. `/backend/src/routes/` - API endpoints for report generation
4. `/backend/src/utils/` - Risk scoring logic

## NOTEBOOKLM INTEGRATION OPTIONS

### Option A: Manual Step (MVP)
- App generates the specific query
- User copies to NotebookLM manually
- User pastes NotebookLM response back
- App generates final report

### Option B: Browser Automation (Advanced)
- Use Playwright + Chrome Remote Debugging (port 9222)
- Automatically query NotebookLM
- Capture response
- Feed to Claude for personalization

For MVP, implement Option A first. Add automation later.

## SUCCESS CRITERIA

1. Questionnaire answers directly influence NotebookLM query content
2. Queries are SPECIFIC to org's gaps (not generic)
3. NotebookLM synthesis addresses their exact situation
4. Final report references their actual data (org name, record counts, systems, etc.)
5. Report feels personalized, not templated

## COMMANDS TO START

```bash
cd C:\Users\mikeb\projects\executive-briefing-generator
# Review current structure
cat backend/src/prompts/*.js
cat backend/src/services/*.js
```

## DELIVERABLES

1. Updated `/backend/src/prompts/notebooklm-queries.js` - Dynamic query builder
2. Updated report generation service to use targeted queries
3. Document the new flow in README
4. Test with sample data to verify personalization

---

## SAMPLE QUESTIONNAIRE DATA FOR TESTING

```json
{
  "organization": {
    "name": "Regional Medical Center of Maryland",
    "type": "Hospital",
    "size": "500-1000 employees"
  },
  "responses": {
    "data_sensitivity": {
      "q1_phi_types": ["Patient names and demographics", "SSNs", "Medical records", "Prescriptions"],
      "q2_record_count": "100,000 - 500,000",
      "q3_retention_period": "More than 20 years or indefinite",
      "q4_long_term_sensitive": "Yes"
    },
    "encryption": {
      "q15_pqc_testing": "Aware but no action taken",
      "q16_vulnerable_percentage": "81-100%"
    },
    "quantum_readiness": {
      "q41_executive_awareness": "Vague awareness only",
      "q42_pqc_roadmap": "No roadmap or plans",
      "q43_pqc_budget": "No budget allocated"
    }
  }
}
```

Expected output: A NotebookLM query that specifically addresses a hospital with 100K-500K records, 20+ year retention, 81-100% vulnerable systems, and no PQC roadmap.
