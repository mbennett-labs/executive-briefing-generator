# NotebookLM Browser Automation

## Overview

This document describes the browser automation system for interacting with Google NotebookLM to generate sourced, synthesized responses for the Executive Briefing Generator.

## Architecture

```
+------------------+     +-------------------+     +------------------+
|                  |     |                   |     |                  |
|  Assessment      |---->|  NotebookLM       |---->|  JSON Response   |
|  Variables       |     |  Automation       |     |  with Metadata   |
|                  |     |                   |     |                  |
+------------------+     +-------------------+     +------------------+
        |                        |                        |
        |                        v                        |
        |               +-------------------+             |
        |               |                   |             |
        +-------------->|  Query Generator  |<------------+
                        |  (maps variables  |
                        |   to prompts)     |
                        +-------------------+
                                |
                                v
                        +-------------------+
                        |                   |
                        |  NotebookLM       |
                        |  (Google)         |
                        |                   |
                        +-------------------+
```

## Step-by-Step Workflow

### 1. Browser Setup (US-200)
- Playwright launches Chromium browser with persistent user data
- Opens in headed mode for OAuth authentication support
- Stores session data in `./playwright-user-data/`

### 2. Authentication (US-201)
- Navigate to NotebookLM notebook URL
- If login required: User manually authenticates via Google OAuth
- Session persists for subsequent automation runs
- Verification via notebook page load detection

### 3. Query Execution (US-202)
- Find and focus the chat input textarea
- Type the dynamically generated query
- Submit via Enter key
- Wait for response completion (up to 60 seconds)

### 4. Response Extraction (US-203)
- Extract text content from chat response area
- Parse into JSON structure with metadata:
  - `query`: The original question
  - `notebook_id`: UUID of the NotebookLM notebook
  - `response_text`: Full synthesized response
  - `extracted_at`: ISO timestamp
  - `source_count`: Estimated citation count
  - `confidence_score`: Quality metric (0.0-1.0)

### 5. Variable-Based Routing (US-204)
- Different assessment variables map to different queries
- Each query produces a unique synthesized response
- Enables personalized report generation

## Assessment Variable to Query Mapping

| Assessment Variable | Query Template |
|---------------------|----------------|
| `methodology.ralph` | "Based on Ralph methodology, explain {topic}..." |
| `methodology.initializer` | "Explain the initializer pattern and how it..." |
| `topic.story_sizing` | "Focus on story sizing principles..." |
| `topic.feedback_loops` | "Describe feedback loops and memory artifacts..." |

## Integration Plan for Executive Briefing Generator

### Phase 1: Current (POC Complete)
- Manual script execution
- Single notebook queries
- JSON output files

### Phase 2: Backend Integration
```javascript
// Example integration in report generator
const { NotebookLMAutomation } = require('./notebooklm-automation');

async function generateSourcedContent(assessmentData) {
    const automation = new NotebookLMAutomation();
    await automation.setupBrowser();
    await automation.authenticateNotebookLM();

    // Map assessment variables to queries
    const queries = mapAssessmentToQueries(assessmentData);

    const responses = [];
    for (const query of queries) {
        const response = await automation.queryNotebookLM(query);
        responses.push(automation.parseResponseAsJSON(query, response));
    }

    await automation.closeBrowser();
    return responses;
}
```

### Phase 3: API Service
- Wrap automation in Express endpoint
- Queue management for concurrent requests
- Response caching for repeated queries

## Known Limitations

1. **Manual Login Required**: First-time authentication requires user interaction for Google OAuth
2. **Session Expiration**: Google sessions may expire, requiring re-authentication
3. **Response Extraction**: Current extraction may include UI elements; needs refinement
4. **Rate Limiting**: NotebookLM may have undocumented rate limits
5. **Page Structure Changes**: UI updates to NotebookLM may break selectors

## Next Steps

1. **Improve Response Extraction**: Use more specific selectors for clean text extraction
2. **Add Response Validation**: Verify responses meet quality thresholds
3. **Implement Retry Logic**: Handle transient failures gracefully
4. **Add Source Citation Parsing**: Extract inline citations from responses
5. **Build Query Cache**: Avoid redundant queries for same inputs
6. **Create Health Check**: Monitor NotebookLM availability

## Files

| File | Description |
|------|-------------|
| `notebooklm-automation.js` | Main automation script |
| `notebooklm_response.txt` | Raw response from first query |
| `notebooklm_response.json` | Structured JSON response |
| `notebooklm_response_test2.json` | Second query response |
| `screenshots/` | Browser state screenshots |
| `playwright-user-data/` | Persistent browser session |

## Running the Automation

```bash
cd scripts
npm install -D @playwright/test
npx playwright install chromium
node notebooklm-automation.js
```

## Log Output Reference

```
[PLAYWRIGHT] Browser automation ready
[NOTEBOOKLM] Successfully authenticated and loaded notebook
[NOTEBOOKLM] Query sent and response extracted successfully
[NOTEBOOKLM] Dynamic querying confirmed - different prompts produce different synthesized responses
[COMPLETE] NotebookLM browser automation proof of concept successful
```
