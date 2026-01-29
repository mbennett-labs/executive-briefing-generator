# Executive Briefing Generator

Quantum Shield Labs' flagship product: Transform a 15-minute assessment into an 18-page personalized executive briefing on post-quantum security readiness.

## Price: $497

## Contents

### `/scripts/`
| Script | Purpose |
|--------|---------|
| `generate_briefing.py` | Clean briefing (for paying customers) |
| `generate_briefing_sample.py` | Briefing with SAMPLE watermark (for Gumroad preview) |
| `generate_product_book.py` | Product Book sales PDF |

### `/samples/`
| File | Purpose |
|------|---------|
| `Executive_Briefing_Chesapeake_Regional_v3.pdf` | Clean showcase sample |
| `Executive_Briefing_SAMPLE.pdf` | Watermarked version for Gumroad |
| `Executive_Briefing_Generator_Product_Book_v3.pdf` | Product overview document |

### `/assets/`
- `circuit-board-cover.png` - Cover page artwork

## Requirements

```bash
pip install reportlab
```

## Usage

```bash
# Generate clean briefing (for customers)
python scripts/generate_briefing.py

# Generate SAMPLE watermarked version (for preview)
python scripts/generate_briefing_sample.py

# Generate product book
python scripts/generate_product_book.py
```

## Product Overview

The Executive Briefing Generator takes responses from a 48-question assessment and generates a customized report covering:

1. **Executive Summary** (2-3 pages) - Key findings, risk stats, priorities
2. **Quantum Risk Assessment** (3-4 pages) - HNDL threats, timeline, blind spots
3. **NIST PQC Standards** (2-3 pages) - FIPS 203/204/205 mapping
4. **Compliance Analysis** (2-3 pages) - HIPAA gaps, vendor risks, insurance
5. **Strategic Action Plan** (3-4 pages) - 90-day wins, 12-month roadmap, budget
6. **Next Steps** (2 pages) - Engagement options, methodology

## Technology Stack

- **NotebookLM** - Curated knowledge base queries
- **Claude AI** - Personalization and synthesis
- **ReportLab** - Professional PDF generation

## Gumroad Setup

1. Upload `Executive_Briefing_SAMPLE.pdf` as preview
2. Upload `Executive_Briefing_Generator_Product_Book_v3.pdf` as product description
3. Price: $497
4. On purchase → run assessment → generate clean briefing

## Contact

Michael Bennett, Founder & CEO
- Email: michael@quantumshieldlabs.dev
- Web: quantumshieldlabs.dev

---
© 2026 Quantum Shield Labs LLC
