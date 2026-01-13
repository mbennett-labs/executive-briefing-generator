# NotebookLM Source Automation

Playwright-based automation for managing sources in Google NotebookLM notebooks.

## Stories Implemented

| Story | Title | Status |
|-------|-------|--------|
| US-300 | Add sources to quantum notebook | Complete |
| US-301 | Organize into categories | Complete |
| US-302 | Create & save synthesis prompts | Complete |
| US-303 | Generate derived sources | Complete |
| US-304 | Create knowledge graph | Complete |

## Usage

### Run All Source Automation
```bash
cd scripts
node notebooklm-automation.js sources
```

### Run Specific Story
```bash
node notebooklm-automation.js US-300  # Add sources only
node notebooklm-automation.js US-301  # Organize categories
node notebooklm-automation.js US-302  # Save prompts
node notebooklm-automation.js US-303  # Generate derived sources
node notebooklm-automation.js US-304  # Create knowledge graph
```

### Run All (including query tests)
```bash
node notebooklm-automation.js all
```

## Output Files

All outputs are saved to the `scripts/` folder:

| File | Description |
|------|-------------|
| `sources_added.json` | Results of source addition (US-300) |
| `organization_structure.json` | Category organization (US-301) |
| `saved_prompts.json` | Synthesis prompts saved as notes (US-302) |
| `derived_sources.json` | Generated synthesis content (US-303) |
| `notebook_metadata.json` | Notebook metadata summary (US-304) |
| `knowledge_graph.json` | Source-category-derived graph (US-304) |

## Sources Configuration

### URL Sources
- **NIST PQC Standards** - Post-quantum cryptography project
- **NSA CNSA Suite** - Commercial National Security Algorithm Suite
- **HIPAA Technical Safeguards** - HHS security guidance

### Local File Sources (requires manual upload)
- **QSL Strategic Roadmap** - Company roadmap document
- **Playbook Chapter 16** - AI coding methodology
- **Playbook Chapter 24** - Advanced patterns

## Categories

1. **Quantum Threat Research** - Standards and research on PQC
2. **Healthcare Compliance** - Regulatory frameworks
3. **QSL Materials** - Proprietary company materials

## Synthesis Prompts

### Threat Timeline Synthesis
Generates a comprehensive timeline of quantum computing threats and PQC milestones.

### Healthcare PQC Roadmap
Creates a healthcare-specific migration roadmap for post-quantum cryptography.

### Cost-Benefit Analysis
Produces financial justification for PQC investment.

## Knowledge Graph Structure

```
Nodes:
- source_* (type: source)
- category_* (type: category)
- prompt_* (type: prompt)
- derived_* (type: derived)

Edges:
- belongs_to: source -> category
- generates: prompt -> derived
- informs: category -> prompt
```

## Prerequisites

1. Node.js 18+
2. Playwright installed: `npm install @playwright/test`
3. Valid Google OAuth session (run once interactively to authenticate)

## OAuth Session

The OAuth session is stored in `scripts/playwright-user-data/`. To refresh:

1. Delete the `playwright-user-data` folder
2. Run `node notebooklm-automation.js`
3. Complete Google OAuth in the browser window
4. Session will be saved for future runs

## Architecture

```
notebooklm-automation.js
├── NotebookLMAutomation class
│   ├── setupBrowser()           # US-200
│   ├── authenticateNotebookLM() # US-201
│   ├── queryNotebookLM()        # US-202
│   ├── addSources()             # US-300
│   ├── organizeSources()        # US-301
│   ├── saveSynthesisPrompts()   # US-302
│   ├── generateDerivedSources() # US-303
│   ├── createKnowledgeGraph()   # US-304
│   └── closeBrowser()           # US-205
├── SOURCES config
├── SYNTHESIS_PROMPTS config
├── CATEGORIES config
└── main() / runSourceAutomation()
```

## Screenshots

Screenshots are saved to `scripts/screenshots/` for debugging:
- `google-test.png` - Browser verification
- `notebooklm-loaded.png` - Notebook state
- `sources-added.png` - After source addition
- `source-*.png` - Individual source additions
- `prompt-*.png` - After prompt saves
- `error-state.png` - On error

## Error Handling

The automation handles:
- Authentication timeouts (180s max)
- Missing UI elements (tries multiple selectors)
- Network failures (screenshots on error)
- Local file not found (skips with status)
