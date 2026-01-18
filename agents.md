# agents.md - QSL Executive Briefing Generator
## Long-Term Memory for Ralph Iterations

---

## Project Context

**Product:** Quantum Risk Executive Briefing Generator
**Company:** Quantum Shield Labs LLC
**Purpose:** Help healthcare executives assess quantum risk and create board presentations
**Price:** $497 one-time

---

## The 11 Assessment Questions

1. Organization size (patients) - Used for cost projections, NOT scored
2. Data retention period - Scored 1-10
3. Legacy system age - Scored 1-10
4. Regulatory complexity - Multi-select, count → points
5. Vendor/partner count - Scored 1-10
6. Research activity - Scored 1-10
7. Critical infrastructure - Scored 1-10
8. Patient safety dependency - Scored 1-10
9. Breach history - Scored 1-10
10. Quantum awareness - Scored 1-10
11. Migration readiness - Scored 1-10

**Total Score Range:** 10-100 (from questions 2-11)

---

## Technical Standards

### API Design
- All endpoints return JSON
- Error format: `{ "error": "message", "code": number }`
- Auth endpoints: /api/auth/register, /api/auth/login
- Assessment endpoints: /api/assessments
- Report endpoints: /api/reports

### Authentication
- JWT-based
- Token expires in 24 hours
- Include in Authorization header: `Bearer <token>`

### Database
- Users: id, email, password_hash, name, organization_name, created_at, updated_at
- Assessments: id, user_id, responses (JSON), risk_score, risk_level, created_at
- Reports: id, assessment_id, pdf_url, email_sent, created_at

---

## PDF Content Sources

**Static Content (hardcode from Playbook):**
- Quantum threat explanation
- Harvest Now Decrypt Later explanation
- Why healthcare is #1 target
- Timeline (2027-2035)

**Dynamic Content (generate from responses):**
- Executive summary paragraph
- Risk score and level
- Cost projections (based on org size)
- Recommendations (based on weakest areas)
- Budget estimate (based on org size)

---

## Learnings Log

*(Ralph will append learnings here)*

### Iteration 1
- *Pending first run*

---

*Last Updated: Awaiting first Ralph iteration*
