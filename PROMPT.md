# PROMPT.md - QSL Executive Briefing Generator
## Ralph Autonomous Development Instructions

---

## Project Overview

You are building the **QSL Executive Briefing Generator** — a web application that helps healthcare executives assess their quantum risk and generate board-ready PDF briefings.

**Core Flow:**
1. User registers/logs in
2. User answers 11 assessment questions
3. System calculates risk score (10-100)
4. User views results with risk level and top vulnerabilities
5. User generates PDF briefing customized to their responses
6. User downloads or receives PDF via email

**Business Context:**
- Price: $497 one-time
- Target: Healthcare CISOs, IT Directors, Compliance Officers
- Value: 5 minutes → Board-ready briefing (saves 20+ hours)

---

## Technical Stack

- **Frontend:** Next.js or React
- **Backend:** Node.js/Express or Python/FastAPI
- **Database:** PostgreSQL or SQLite
- **PDF Generation:** Puppeteer, React-PDF, or pdfkit
- **Email:** SendGrid, Resend, or Nodemailer
- **Auth:** JWT-based
- **Hosting:** Vercel + Railway (or similar)

---

## Your Task

You are an autonomous coding agent. For each iteration:

1. **Read the PRD** (`prd.json`) to understand all user stories
2. **Read the progress log** (`progress.txt`) to see what's been done
3. **Pick the next incomplete story** (where `"passes": false`)
4. **Implement it fully** — write all necessary code
5. **Test against acceptance criteria** — verify each criterion passes
6. **Commit your changes** with a descriptive message
7. **Update prd.json** — set `"passes": true` for completed story
8. **Log your progress** — append to `progress.txt`
9. **Update agents.md** if you learned something important

---

## Key Domain Knowledge

### Risk Score Calculation
- Questions 2-11 are scored (Q1 is org size for cost projections)
- Each question scores 1-10 points based on answer
- Total range: 10-100 points
- Question 4 (regulatory) is multi-select: count checkboxes → map to points

### Risk Levels
| Score | Level | Color |
|-------|-------|-------|
| 10-30 | LOW | Green |
| 31-50 | MODERATE | Yellow |
| 51-70 | HIGH | Orange |
| 71-85 | CRITICAL | Red |
| 86-100 | SEVERE | Dark Red |

### Organization Size → Cost Projections
| Size | Patients | Breach Cost | Migration Cost |
|------|----------|-------------|----------------|
| Small | <50K | $20-100M | $100-300K |
| Mid | 50-250K | $100-500M | $300-800K |
| Large | 250K-1M | $500M-2B | $800K-2M |
| Regional | 1-5M | $2-5B | $2-5M |
| Enterprise | 5M+ | $5-10B+ | $5-15M |

### PDF Structure (8 pages)
1. Cover page (org name, date, QSL branding)
2. Executive summary (score, risk level, key finding)
3. Risk profile (score breakdown chart)
4. Quantum threat explanation (static content)
5. Cost of inaction (dynamic based on org size)
6. Recommended actions (based on top 3 weakest areas)
7. Budget estimate (based on org size)
8. Next steps (CTAs to Playbook, consultation)

---

## QSL Branding

- **Company:** Quantum Shield Labs LLC
- **Website:** quantumshieldlabs.dev
- **Contact:** michael@quantumshieldlabs.dev
- **Phone:** (240) 659-8286
- **Colors:** Use professional blues/grays with accent colors for risk levels
- **Tone:** Professional, credible, authoritative

---

## Critical Rules

### Story Completion
- Complete ONE story per iteration
- Do not move to next story until current one fully passes
- If blocked, document the blocker in progress.txt

### Code Quality
- Clean, maintainable code
- Include error handling
- Add comments for complex logic
- Follow existing patterns in codebase

### PDF Quality
- Must look professional enough for board presentation
- Include charts/visualizations where specified
- Proper headers, footers, page numbers
- QSL branding on every page

---

## Completion Markers

When you complete a story successfully, output:
```
<promise>STORY_COMPLETE</promise>
```

When ALL stories are complete, output:
```
<promise>PROJECT_COMPLETE</promise>
```

If blocked:
```
<promise>BLOCKED</promise>
```

---

*Project: Quantum Shield Labs - Executive Briefing Generator*
*Created: January 9, 2026*
