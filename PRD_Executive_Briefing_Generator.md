# Product Requirements Document (PRD)
# QSL Executive Briefing Generator

---

## Product Overview

**Product Name:** Quantum Risk Executive Briefing Generator

**Company:** Quantum Shield Labs LLC

**Price Point:** $497 one-time (or $97/month subscription)

**Target User:** Healthcare CISOs, IT Directors, Compliance Officers who need to present quantum risk to their board

**Core Value Proposition:** Answer 11 questions in 5 minutes → Get a customized, board-ready PDF briefing instantly

**Problem Solved:** Healthcare executives know they should care about quantum risk but don't have 20+ hours to research it and create a board presentation. This tool does it for them.

---

## User Personas

### Primary: Healthcare CISO
- **Name:** Sarah Chen
- **Role:** Chief Information Security Officer, Regional Hospital System
- **Pain:** Board is asking about quantum computing threats. She knows it's important but doesn't have time to become an expert.
- **Need:** Professional briefing she can present at next board meeting (2 weeks away)
- **Budget:** Has discretionary spend up to $1,000 for security tools

### Secondary: IT Director
- **Name:** Marcus Johnson  
- **Role:** IT Director, Rural Hospital Network
- **Pain:** Read about quantum threats, worried about compliance, doesn't know where to start
- **Need:** Clear risk assessment and budget numbers to request funding
- **Budget:** Needs justification document for CFO

### Tertiary: Compliance Officer
- **Name:** Jennifer Walsh
- **Role:** HIPAA Compliance Officer, Health System
- **Pain:** Regulations are changing, needs to document quantum risk awareness
- **Need:** Audit-ready documentation showing organization assessed quantum risk
- **Budget:** Compliance budget, can justify risk assessment tools

---

## Feature Requirements

### 1. Assessment Input Form

**11 Questions (all required):**

#### Question 1: Organization Size
- **Question:** "How many patients does your organization serve annually?"
- **Type:** Dropdown
- **Options:**
  - Under 50,000 patients (Small practice/clinic)
  - 50,000 - 250,000 patients (Mid-size hospital)
  - 250,000 - 1,000,000 patients (Large hospital/small system)
  - 1,000,000 - 5,000,000 patients (Regional health system)
  - Over 5,000,000 patients (Large health system)
- **Used For:** Cost projections, breach cost estimates

#### Question 2: Data Retention Period
- **Question:** "How long does your organization retain patient records?"
- **Type:** Dropdown
- **Options:**
  - 7-10 years (1-2 points)
  - 10-20 years (3-4 points)
  - 20-30 years (5-6 points)
  - 30-50 years (7-8 points)
  - 50+ years or indefinitely (9-10 points)
- **Used For:** Risk score calculation

#### Question 3: Legacy System Age
- **Question:** "What percentage of your critical systems are more than 10 years old?"
- **Type:** Dropdown
- **Options:**
  - Less than 10% (1-2 points)
  - 10-25% (3-4 points)
  - 25-40% (5-6 points)
  - 40-60% (7-8 points)
  - Over 60% (9-10 points)
- **Used For:** Risk score calculation, infrastructure recommendations

#### Question 4: Regulatory Complexity
- **Question:** "How many regulatory frameworks does your organization comply with?"
- **Type:** Multi-select checkboxes (count determines score)
- **Options:**
  - HIPAA
  - HITECH
  - State privacy laws (e.g., CCPA, state health laws)
  - Medicare/Medicaid requirements
  - Joint Commission
  - SOC 2
  - PCI-DSS (if processing payments)
  - GDPR (if serving EU patients)
  - FDA regulations (if medical devices)
  - Research/NIH requirements
- **Scoring:** 1-2 frameworks = 1-2 points, 3-4 = 3-4 points, 5-6 = 5-6 points, 7-8 = 7-8 points, 9+ = 9-10 points
- **Used For:** Risk score, compliance section of briefing

#### Question 5: Vendor/Partner Count
- **Question:** "Approximately how many third-party vendors have access to your patient data or systems?"
- **Type:** Dropdown
- **Options:**
  - 1-10 vendors (1-2 points)
  - 11-25 vendors (3-4 points)
  - 26-50 vendors (5-6 points)
  - 51-100 vendors (7-8 points)
  - Over 100 vendors (9-10 points)
- **Used For:** Risk score, supply chain recommendations

#### Question 6: Research Activity
- **Question:** "Does your organization conduct medical research or clinical trials?"
- **Type:** Dropdown
- **Options:**
  - No research activity (1-2 points)
  - Minor research programs (3-4 points)
  - Moderate research activity (5-6 points)
  - Significant research programs (7-8 points)
  - Major research institution (9-10 points)
- **Used For:** Risk score, research-specific recommendations

#### Question 7: Critical Infrastructure Designation
- **Question:** "Is your organization designated as critical infrastructure or part of emergency response systems?"
- **Type:** Dropdown
- **Options:**
  - No special designation (1-2 points)
  - Regional emergency response role (3-5 points)
  - State-level critical infrastructure (6-7 points)
  - Federal critical infrastructure designation (8-10 points)
- **Used For:** Risk score, regulatory timeline section

#### Question 8: Patient Safety System Dependency
- **Question:** "How dependent are your patient care operations on networked digital systems?"
- **Type:** Dropdown
- **Options:**
  - Minimal - mostly paper-based (1-2 points)
  - Low - some digital, paper backup for everything (3-4 points)
  - Moderate - digital primary, paper backup available (5-6 points)
  - High - fully digital, limited paper backup (7-8 points)
  - Critical - 100% digital, no paper alternative (9-10 points)
- **Used For:** Risk score, patient safety section

#### Question 9: Breach History
- **Question:** "Has your organization experienced a data breach in the past 5 years?"
- **Type:** Dropdown
- **Options:**
  - No breaches (1-2 points)
  - Minor incident, no patient data exposed (3-4 points)
  - One breach with patient data exposed (5-6 points)
  - Multiple breaches (7-8 points)
  - Major breach with regulatory penalties (9-10 points)
- **Used For:** Risk score, urgency messaging

#### Question 10: Current Quantum Awareness
- **Question:** "What is your organization's current level of quantum threat awareness?"
- **Type:** Dropdown
- **Options:**
  - Active quantum migration planning underway (1-2 points)
  - Board/leadership briefed, planning to start (3-4 points)
  - IT team aware, no formal planning (5-6 points)
  - Minimal awareness, no planning (7-8 points)
  - No awareness of quantum threats (9-10 points)
- **Used For:** Risk score, recommendations urgency

#### Question 11: Migration Readiness
- **Question:** "Has your organization inventoried its current cryptographic systems?"
- **Type:** Dropdown
- **Options:**
  - Complete inventory with quantum-readiness assessment (1-2 points)
  - Partial inventory completed (3-4 points)
  - Inventory planned but not started (5-6 points)
  - No inventory, but know key systems (7-8 points)
  - No inventory, unknown cryptographic posture (9-10 points)
- **Used For:** Risk score, first-action recommendations

---

### 2. Scoring Logic

**Total Score Calculation:**
- Sum of all 10 scored questions (Q2-Q11)
- Range: 10-100 points

**Risk Level Mapping:**

| Score | Risk Level | Color | Urgency |
|-------|------------|-------|---------|
| 10-30 | LOW | Green | Plan within 12-18 months |
| 31-50 | MODERATE | Yellow | Start planning within 6 months |
| 51-70 | HIGH | Orange | Begin migration planning immediately |
| 71-85 | CRITICAL | Red | Urgent action required |
| 86-100 | SEVERE | Dark Red | Emergency response needed |

**Weakest Areas Identification:**
- Identify top 3 highest-scoring questions
- These become priority recommendations

---

### 3. PDF Output Structure

**Page 1: Cover Page**
- Title: "Quantum Risk Executive Briefing"
- Subtitle: "Prepared for [Organization Name]"
- Date generated
- QSL logo and branding
- Confidentiality notice

**Page 2: Executive Summary**
- Risk Score: Large visual (gauge or number)
- Risk Level: Text with color indicator
- One-paragraph summary (generated based on score range)
- Key finding: Highest risk area identified
- Bottom line: "Your organization needs to [action] by [timeframe]"

**Page 3: Your Risk Profile**
- Visual breakdown of all 10 scores
- Bar chart or radar chart showing each category
- Highlight top 3 vulnerability areas in red
- Comparison to industry average (use static benchmark: 55)

**Page 4: The Quantum Threat Explained**
- What is Q-Day (2 paragraphs, from Playbook Chapter 1)
- Harvest Now, Decrypt Later explanation
- Why healthcare is the #1 target
- Timeline: 2027-2035 window

**Page 5: Cost of Inaction**
- Based on organization size (Q1):
  - Breach cost projection
  - Regulatory penalty exposure
  - Reputation/business impact estimate
- Comparison: Cost of breach vs. cost of migration
- ROI calculation

**Page 6: Recommended Actions**
- Priority 1: Address highest-risk area (based on top scoring question)
- Priority 2: Address second-highest risk area
- Priority 3: Address third-highest risk area
- Each recommendation includes:
  - What to do
  - Why it matters
  - Estimated timeline
  - Estimated cost range

**Page 7: Migration Budget Estimate**
- Based on organization size:
  - Small (under 50K): $100K-$300K over 3 years
  - Mid-size (50K-250K): $300K-$800K over 3 years
  - Large (250K-1M): $800K-$2M over 3 years
  - Regional (1M-5M): $2M-$5M over 3 years
  - Enterprise (5M+): $5M-$15M over 3 years
- Year-by-year breakdown suggestion
- Comparison to breach cost (ROI)

**Page 8: Next Steps**
- Immediate (This Week):
  - Share this briefing with leadership
  - Schedule board presentation
- Short-term (30 Days):
  - Begin cryptographic inventory
  - Request vendor quantum-readiness statements
- Resources:
  - "Get the complete Post-Quantum Security Playbook" (link to Gumroad - $197)
  - "Schedule a consultation with Quantum Shield Labs" (link to calendar)
  - QSL contact information

**Footer on all pages:**
- "Prepared by Quantum Shield Labs LLC"
- "quantumshieldlabs.dev"
- Page number

---

### 4. Technical Requirements

**Frontend:**
- Clean, professional form interface
- Progress indicator (Step 1 of 11, etc.)
- Mobile responsive
- Form validation before submission

**Backend:**
- Calculate risk score from inputs
- Generate PDF with dynamic content
- Store assessment in database (for user to access later)
- Send PDF via email (optional)

**PDF Generation:**
- Professional formatting
- Charts/visualizations for scores
- QSL branding (logo, colors)
- Print-ready quality

**User Accounts:**
- Email/password registration
- Save assessments to account
- View history of past assessments
- Download PDFs anytime

**Payment Integration:**
- Stripe or similar
- One-time payment: $497
- Optional: Subscription at $97/month for unlimited assessments

---

### 5. Content Requirements

**Static Content (from Playbook):**
- Quantum threat explanation (Chapter 1)
- Healthcare targeting rationale (Chapter 3)
- Timeline data (Chapter 4)
- Cost figures (Chapter 5)
- Migration phases (Chapter 11)

**Dynamic Content (generated per assessment):**
- Executive summary paragraph
- Risk level interpretation
- Personalized recommendations
- Cost projections based on org size
- Priority actions based on weakest areas

---

### 6. Success Metrics

**User Success:**
- Complete assessment in under 5 minutes
- PDF is board-presentation ready (no editing needed)
- Clear understanding of risk level and next steps

**Business Success:**
- 20% of users purchase full Playbook ($197)
- 5% of users book consultation (avg $7,500)
- Monthly recurring revenue from subscriptions

---

### 7. Out of Scope (Version 1)

- Multi-user organization accounts
- Custom branding/white-label
- Comparison between multiple assessments
- API access
- Automated vendor assessment integration
- Integration with GRC platforms

---

### 8. Design Principles

1. **Professional:** This goes to board members. No gimmicks.
2. **Clear:** Complex topic, simple presentation
3. **Actionable:** Every section leads to a decision or action
4. **Credible:** Cite sources, show methodology
5. **Branded:** QSL as trusted authority

---

## Technical Stack (Recommended)

- **Frontend:** Next.js or React
- **Backend:** Node.js/Express or Python/FastAPI
- **Database:** PostgreSQL
- **PDF Generation:** Puppeteer or React-PDF
- **Email:** SendGrid or Resend
- **Payments:** Stripe
- **Hosting:** Vercel (frontend) + Railway (backend)
- **Auth:** NextAuth.js or JWT

---

## Timeline Estimate

- **MVP (Core Assessment + PDF):** 10-15 Ralph iterations
- **Full Product (Accounts, Payment, Email):** 20-25 Ralph iterations
- **Polish & Launch:** Additional 5-10 iterations

---

## Appendix: Sample Executive Summary Text

**For Score 71-85 (CRITICAL):**
> "Your organization faces critical quantum risk exposure. Based on your assessment, [Organization Name] has significant vulnerabilities in [top risk area], [second risk area], and [third risk area]. With an estimated breach cost of $[X]M and a quantum threat window of 2027-2035, immediate action is required. We recommend beginning cryptographic inventory within 30 days and allocating budget for migration planning in Q1 2025. Failure to act could result in regulatory penalties, uninsurable cyber risk, and potential breach exposure affecting [patient count] patients."

**For Score 31-50 (MODERATE):**
> "Your organization has moderate quantum risk exposure. While [Organization Name] has strengths in [lowest risk areas], vulnerabilities exist in [top risk area] and [second risk area]. With proper planning over the next 12-18 months, your organization can achieve quantum-readiness before the threat materializes. We recommend prioritizing a cryptographic inventory and vendor assessment as first steps. Estimated migration investment of $[X] over 3 years will protect against potential breach costs of $[Y]M."

---

*PRD Version: 1.0*
*Created: January 9, 2026*
*Author: Quantum Shield Labs LLC*
