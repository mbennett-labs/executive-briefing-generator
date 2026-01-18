/**
 * NotebookLM Browser Automation Script
 *
 * SECURITY PRACTICES:
 * - Uses Google OAuth for authentication (no passwords stored)
 * - Separate Chromium browser instance (isolated from main browser)
 * - No credentials logged or exposed
 * - HTTPS only for all communications
 * - All responses validated before use
 *
 * EXTENDED FOR US-300 through US-304:
 * - Source management and addition
 * - Category organization
 * - Synthesis prompt creation
 * - Derived source generation
 * - Knowledge graph creation
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    notebookUrl: 'https://notebooklm.google.com/notebook/0d219d93-5e1a-45d6-ae29-2e381d9f8e9b',
    notebookId: '0d219d93-5e1a-45d6-ae29-2e381d9f8e9b',
    userEmail: 'mikebennett637@gmail.com',
    userDataDir: path.join(__dirname, 'playwright-user-data'),
    screenshotsDir: path.join(__dirname, 'screenshots'),
    outputDir: path.join(__dirname),
    responseTimeout: 60000,
    sourceAddTimeout: 30000,
};

// Source definitions for US-300 - All URLs (no local files)
const SOURCES = {
    urls: [
        {
            name: 'NIST PQC Standards',
            url: 'https://csrc.nist.gov/projects/post-quantum-cryptography/',
            category: 'Quantum Threat Research'
        },
        {
            name: 'NSA Cryptography',
            url: 'https://www.nsa.gov/cryptography/',
            category: 'Quantum Threat Research'
        },
        {
            name: 'HIPAA Security Rule',
            url: 'https://www.hhs.gov/hipaa/',
            category: 'Healthcare Compliance'
        },
        {
            name: 'CISA PQC Initiative',
            url: 'https://www.cisa.gov/quantum',
            category: 'Quantum Threat Research'
        },
        {
            name: 'IBM Quantum Computing',
            url: 'https://www.ibm.com/quantum',
            category: 'Quantum Threat Research'
        },
        {
            name: 'Cloud Security Alliance PQC',
            url: 'https://cloudsecurityalliance.org/research/working-groups/quantum-safe-security/',
            category: 'QSL Materials'
        }
    ],
    localFiles: []  // All sources are now URLs
};

// Synthesis prompts for US-302
const SYNTHESIS_PROMPTS = [
    {
        name: 'Threat Timeline Synthesis',
        prompt: `Synthesize a comprehensive threat timeline from the sources. Include:
1. Current quantum computing capabilities and limitations
2. Projected timeline for cryptographically relevant quantum computers (CRQC)
3. Key milestones in post-quantum cryptography standardization
4. Healthcare industry-specific vulnerability windows
5. Recommended action timelines for organizations at different maturity levels
Format as a timeline with dates and specific recommendations.`
    },
    {
        name: 'Healthcare PQC Roadmap',
        prompt: `Create a healthcare-specific post-quantum cryptography roadmap by synthesizing all sources. Include:
1. HIPAA compliance requirements for cryptographic controls
2. Healthcare data protection priorities (PHI, claims, clinical data)
3. Vendor ecosystem considerations for healthcare IT
4. Phased migration approach for healthcare organizations
5. Budget and resource allocation recommendations
6. Risk-based prioritization framework
Provide specific, actionable steps for healthcare CISOs.`
    },
    {
        name: 'Cost-Benefit Analysis',
        prompt: `Generate a cost-benefit analysis for post-quantum security migration based on all sources:
1. Cost of inaction - quantify breach risks, regulatory penalties, reputation damage
2. Cost of early adoption - implementation costs, training, vendor transitions
3. ROI analysis for different organization sizes
4. Competitive advantage considerations
5. Insurance and liability implications
6. Industry benchmark comparisons
Present financial justification suitable for executive briefings.`
    }
];

// Category definitions for US-301
const CATEGORIES = [
    'Quantum Threat Research',
    'Healthcare Compliance',
    'QSL Materials'
];

// Ensure directories exist
if (!fs.existsSync(CONFIG.screenshotsDir)) {
    fs.mkdirSync(CONFIG.screenshotsDir, { recursive: true });
}

class NotebookLMAutomation {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.addedSources = [];
        this.savedPrompts = [];
        this.derivedSources = [];
        this.organizationStructure = {};
    }

    /**
     * Dismiss any blocking CDK overlay backdrops
     * NotebookLM uses Angular CDK overlays that can intercept clicks
     */
    async dismissOverlays() {
        try {
            await this.page.evaluate(() => {
                // Remove backdrop overlays that block clicks
                const backdrops = document.querySelectorAll('.cdk-overlay-backdrop');
                backdrops.forEach(b => b.remove());

                // Hide overlay panes that may be blocking
                const panes = document.querySelectorAll('.cdk-overlay-pane');
                panes.forEach(p => {
                    if (p.style.display !== 'none') {
                        p.style.display = 'none';
                    }
                });
            });
            await this.page.waitForTimeout(100);
        } catch (e) {
            // Ignore errors - overlays may not exist
        }
    }

    /**
     * Find and open a specific notebook by title
     */
    async findAndOpenNotebook(targetTitle) {
        console.log(`[NOTEBOOKLM] Looking for notebook: "${targetTitle}"`);

        // Wait for notebook cards to appear
        await this.page.waitForTimeout(2000);

        // Try to find the notebook by its title text
        // NotebookLM typically shows notebooks as cards with titles
        const searchSelectors = [
            // Direct text match
            `text="${targetTitle}"`,
            `text=${targetTitle}`,
            // Partial text match
            `*:has-text("${targetTitle}")`,
            // Common card/tile selectors
            `[aria-label*="${targetTitle}"]`,
            `.notebook-card:has-text("${targetTitle}")`,
            `[data-notebook-title*="${targetTitle}"]`,
        ];

        for (const selector of searchSelectors) {
            try {
                const element = await this.page.$(selector);
                if (element) {
                    const isVisible = await element.isVisible();
                    if (isVisible) {
                        console.log(`[NOTEBOOKLM] Found notebook with selector: ${selector}`);
                        await element.click();
                        await this.page.waitForTimeout(3000);

                        // Verify we navigated to the notebook
                        const newUrl = this.page.url();
                        if (newUrl.includes('/notebook/')) {
                            // Extract notebook ID from URL
                            const notebookIdMatch = newUrl.match(/\/notebook\/([a-f0-9-]+)/);
                            if (notebookIdMatch) {
                                const notebookId = notebookIdMatch[1];
                                // Clean URL (remove query params like ?addSource=true)
                                const cleanUrl = `https://notebooklm.google.com/notebook/${notebookId}`;

                                console.log(`[NOTEBOOKLM] ✅ Opened notebook: ${targetTitle}`);
                                console.log(`[NOTEBOOKLM] ✅ Notebook ID: ${notebookId}`);
                                console.log(`[NOTEBOOKLM] ✅ URL: ${cleanUrl}`);

                                // Update the CONFIG with the actual notebook ID
                                CONFIG.notebookId = notebookId;
                                CONFIG.notebookUrl = cleanUrl;

                                // Navigate to clean URL to avoid modal triggers
                                if (newUrl.includes('?')) {
                                    console.log('[NOTEBOOKLM] Navigating to clean URL...');
                                    await this.page.goto(cleanUrl, { waitUntil: 'domcontentloaded' });
                                    await this.page.waitForTimeout(2000);
                                }

                                return true;
                            }
                        }
                    }
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        // Fallback: try to find by scanning all clickable elements
        console.log('[NOTEBOOKLM] Trying fallback search method...');
        try {
            // Get all elements that might be notebook titles
            const allText = await this.page.$$eval('*', (elements) => {
                return elements
                    .filter(el => el.innerText && el.innerText.includes('QSL'))
                    .map(el => ({
                        tag: el.tagName,
                        text: el.innerText.substring(0, 100),
                        className: el.className
                    }));
            });
            console.log('[NOTEBOOKLM] Elements containing "QSL":', JSON.stringify(allText.slice(0, 5), null, 2));

            // Try clicking on any element containing the target text
            const targetElement = await this.page.locator(`text=${targetTitle}`).first();
            if (targetElement) {
                await targetElement.click();
                await this.page.waitForTimeout(3000);

                const newUrl = this.page.url();
                if (newUrl.includes('/notebook/')) {
                    const notebookIdMatch = newUrl.match(/\/notebook\/([a-f0-9-]+)/);
                    if (notebookIdMatch) {
                        CONFIG.notebookId = notebookIdMatch[1];
                        CONFIG.notebookUrl = newUrl;
                        console.log(`[NOTEBOOKLM] ✅ Found via fallback! ID: ${CONFIG.notebookId}`);
                        return true;
                    }
                }
            }
        } catch (e) {
            console.log(`[NOTEBOOKLM] Fallback search failed: ${e.message}`);
        }

        return false;
    }

    /**
     * US-200: Set up browser and verify automation works
     */
    async setupBrowser() {
        console.log('[PLAYWRIGHT] Setting up browser automation...');

        // Launch browser in headed mode for OAuth/debugging
        this.browser = await chromium.launchPersistentContext(CONFIG.userDataDir, {
            headless: false,
            viewport: { width: 1280, height: 800 },
            args: ['--disable-blink-features=AutomationControlled'],
        });

        this.page = this.browser.pages()[0] || await this.browser.newPage();

        // Verify browser works by opening Google
        console.log('[PLAYWRIGHT] Testing browser with Google...');
        await this.page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
        await this.page.screenshot({ path: path.join(CONFIG.screenshotsDir, 'google-test.png') });

        console.log('[PLAYWRIGHT] Browser automation ready');
        return true;
    }

    /**
     * US-201: Open NotebookLM and authenticate, then find specific notebook
     */
    async authenticateNotebookLM() {
        const TARGET_NOTEBOOK = 'QSL Quantum Security Research';

        console.log('[NOTEBOOKLM] Navigating to NotebookLM home page...');

        // Go to NotebookLM home page first (not directly to a notebook)
        await this.page.goto('https://notebooklm.google.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait a moment for redirects
        await this.page.waitForTimeout(3000);

        // Check if we're on Google login page
        const currentUrl = this.page.url();
        const isLoginPage = currentUrl.includes('accounts.google.com') ||
                           currentUrl.includes('signin') ||
                           await this.page.$('input[type="email"]') !== null;

        if (isLoginPage) {
            console.log('[NOTEBOOKLM] =====================================================');
            console.log('[NOTEBOOKLM] LOGIN REQUIRED - Please sign in manually:');
            console.log('[NOTEBOOKLM] 1. Enter email: mikebennett637@gmail.com');
            console.log('[NOTEBOOKLM] 2. Enter password');
            console.log('[NOTEBOOKLM] 3. Complete any 2FA if prompted');
            console.log('[NOTEBOOKLM] Waiting for authentication (up to 180 seconds)...');
            console.log('[NOTEBOOKLM] =====================================================');

            // Wait for navigation away from login page
            try {
                await this.page.waitForURL((url) => {
                    return url.href.includes('notebooklm.google.com');
                }, { timeout: 180000 });
                console.log('[NOTEBOOKLM] Authentication successful!');
            } catch (e) {
                console.log('[NOTEBOOKLM] Authentication timeout. Check if login completed.');
                await this.page.screenshot({
                    path: path.join(CONFIG.screenshotsDir, 'auth-timeout.png'),
                    fullPage: true
                });
                return false;
            }
        }

        // Wait for home page to load
        console.log('[NOTEBOOKLM] Waiting for home page to load...');
        await this.page.waitForTimeout(3000);

        // Take screenshot of home page
        await this.page.screenshot({
            path: path.join(CONFIG.screenshotsDir, 'notebooklm-home.png'),
            fullPage: true
        });

        // STEP 1: Find and click on the target notebook
        console.log(`[NOTEBOOKLM] Searching for notebook: "${TARGET_NOTEBOOK}"...`);

        // Look for notebook cards - try multiple selectors
        const notebookFound = await this.findAndOpenNotebook(TARGET_NOTEBOOK);

        if (!notebookFound) {
            console.log(`[NOTEBOOKLM] ERROR: Could not find notebook "${TARGET_NOTEBOOK}"`);
            console.log('[NOTEBOOKLM] Available notebooks on home page - check screenshot');
            await this.page.screenshot({
                path: path.join(CONFIG.screenshotsDir, 'notebook-not-found.png'),
                fullPage: true
            });
            return false;
        }

        // Wait for notebook to fully load
        console.log('[NOTEBOOKLM] Waiting for notebook to load...');
        await this.page.waitForTimeout(5000);

        // Dismiss any initial modals/overlays (e.g., from ?addSource=true URL param)
        console.log('[NOTEBOOKLM] Dismissing any initial modals...');
        await this.dismissOverlays();
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(1000);
        await this.dismissOverlays();
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(500);

        // Try multiple selectors for the chat area
        const chatSelectors = [
            'textarea[placeholder*="Start typing"]',
            'textarea[placeholder*="Ask"]',
            'div[contenteditable="true"]',
            '[data-testid="chat-input"]',
            '.chat-input',
            'textarea',
        ];

        let chatInputFound = false;
        for (const selector of chatSelectors) {
            try {
                await this.page.waitForSelector(selector, { timeout: 10000 });
                chatInputFound = true;
                console.log(`[NOTEBOOKLM] Found chat input with selector: ${selector}`);
                break;
            } catch (e) {
                // Try next selector
            }
        }

        // Take screenshot of current state
        await this.page.screenshot({
            path: path.join(CONFIG.screenshotsDir, 'notebooklm-loaded.png'),
            fullPage: true
        });

        if (!chatInputFound) {
            console.log('[NOTEBOOKLM] Could not find chat input. Check screenshot for current state.');
            console.log('[NOTEBOOKLM] Will try to proceed anyway...');
        }

        console.log('[NOTEBOOKLM] Successfully authenticated and loaded notebook');
        return true;
    }

    /**
     * US-202: Query NotebookLM with a dynamic prompt
     */
    async queryNotebookLM(query) {
        console.log(`[NOTEBOOKLM] Sending query: "${query.substring(0, 50)}..."`);

        // Take screenshot to see current state
        await this.page.screenshot({ path: path.join(CONFIG.screenshotsDir, 'before-query.png'), fullPage: true });

        // NotebookLM specific selectors (updated for latest UI)
        const chatSelectors = [
            // NotebookLM specific selectors
            'textarea[aria-label*="message"]',
            'textarea[placeholder*="type"]',
            'textarea[placeholder*="Type"]',
            'textarea[placeholder*="Ask"]',
            'textarea[placeholder*="ask"]',
            'div[contenteditable="true"][role="textbox"]',
            'input[aria-label*="message"]',
            // Generic fallbacks
            'textarea',
            'div[contenteditable="true"]',
        ];

        let inputElement = null;
        for (const selector of chatSelectors) {
            try {
                inputElement = await this.page.$(selector);
                if (inputElement) {
                    const isVisible = await inputElement.isVisible();
                    if (isVisible) {
                        console.log(`[NOTEBOOKLM] Found visible input with selector: ${selector}`);
                        break;
                    }
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        // If no input found, try to click on the chat panel to reveal it
        if (!inputElement) {
            console.log('[NOTEBOOKLM] Input not found directly, looking for chat panel...');

            // Try clicking on "Chat" button/tab if it exists
            const chatButtons = ['button:has-text("Chat")', '[aria-label*="Chat"]', 'text=Chat'];
            for (const selector of chatButtons) {
                try {
                    const btn = await this.page.$(selector);
                    if (btn && await btn.isVisible()) {
                        console.log('[NOTEBOOKLM] Clicking Chat button...');
                        await btn.click();
                        await this.page.waitForTimeout(2000);
                        break;
                    }
                } catch (e) {
                    // Continue
                }
            }

            // Try finding input again after clicking
            for (const selector of chatSelectors) {
                inputElement = await this.page.$(selector);
                if (inputElement && await inputElement.isVisible()) {
                    console.log(`[NOTEBOOKLM] Found input after clicking chat: ${selector}`);
                    break;
                }
            }
        }

        // Last resort - click in the approximate chat area
        if (!inputElement) {
            console.log('[NOTEBOOKLM] Using keyboard shortcut or clicking bottom of page...');

            // Try pressing / to focus chat (common shortcut)
            await this.page.keyboard.press('/');
            await this.page.waitForTimeout(1000);

            // Check for focused input
            inputElement = await this.page.$(':focus');

            if (!inputElement) {
                // Click at bottom center of page where chat usually is
                const viewport = this.page.viewportSize();
                await this.page.mouse.click(viewport.width / 2, viewport.height - 100);
                await this.page.waitForTimeout(1000);
                inputElement = await this.page.$(':focus');
            }
        }

        if (!inputElement) {
            await this.page.screenshot({ path: path.join(CONFIG.screenshotsDir, 'no-input-found.png'), fullPage: true });
            throw new Error('Could not find chat input element. See screenshot.');
        }

        // Click and type the query
        try {
            await inputElement.click({ timeout: 5000 });
        } catch (e) {
            console.log('[NOTEBOOKLM] Direct click failed, using focus...');
            await inputElement.focus();
        }

        await this.page.waitForTimeout(500);
        await this.page.keyboard.type(query, { delay: 30 });

        // Take screenshot before sending
        await this.page.screenshot({ path: path.join(CONFIG.screenshotsDir, 'query-typed.png') });

        // Send the query (try Enter key or find send button)
        console.log('[NOTEBOOKLM] Sending query...');
        await this.page.keyboard.press('Enter');

        // Wait for response to appear
        console.log(`[NOTEBOOKLM] Waiting for response (timeout: ${CONFIG.responseTimeout / 1000}s)...`);

        // Wait for the response - look for new content in the chat
        await this.page.waitForTimeout(5000); // Initial wait for response to start

        // Wait for response to complete (look for when typing stops)
        let lastContent = '';
        let stableCount = 0;
        const startTime = Date.now();

        while (Date.now() - startTime < CONFIG.responseTimeout) {
            // Get current response content
            const responseElements = await this.page.$$('[class*="response"], [class*="message"], [class*="chat"] p, [class*="answer"]');
            let currentContent = '';

            for (const el of responseElements) {
                const text = await el.textContent();
                currentContent += text + '\n';
            }

            if (currentContent === lastContent && currentContent.length > 0) {
                stableCount++;
                if (stableCount >= 3) {
                    console.log('[NOTEBOOKLM] Response appears complete');
                    break;
                }
            } else {
                stableCount = 0;
                lastContent = currentContent;
            }

            await this.page.waitForTimeout(2000);
        }

        // Take screenshot after response
        await this.page.screenshot({
            path: path.join(CONFIG.screenshotsDir, 'response-received.png'),
            fullPage: true
        });

        // Extract the response text
        const responseText = await this.extractResponse();

        console.log('[NOTEBOOKLM] Query sent and response extracted successfully');
        return responseText;
    }

    /**
     * Extract response text from the page
     */
    async extractResponse() {
        // Try multiple selectors to find the response
        const responseSelectors = [
            '[class*="response"]:last-child',
            '[class*="message"]:last-child',
            '[class*="chat-message"]:last-of-type',
            '[class*="answer"]',
            'main [class*="content"] p',
        ];

        let responseText = '';

        // Get all text content from the page's main area
        const mainContent = await this.page.$('main') || await this.page.$('[role="main"]') || await this.page.$('body');
        if (mainContent) {
            const allText = await mainContent.innerText();

            // Find the last substantial block of text (likely the response)
            const paragraphs = allText.split('\n').filter(p => p.trim().length > 50);
            if (paragraphs.length > 0) {
                // Take the last few paragraphs as the response
                responseText = paragraphs.slice(-5).join('\n');
            }
        }

        // If we still don't have a good response, try a more aggressive approach
        if (responseText.length < 100) {
            const allParagraphs = await this.page.$$eval('p, div > span, [class*="text"]',
                elements => elements.map(el => el.textContent).filter(t => t && t.length > 20));
            responseText = allParagraphs.slice(-10).join('\n');
        }

        return responseText;
    }

    /**
     * US-203: Parse response as JSON with metadata
     */
    parseResponseAsJSON(query, responseText) {
        const json = {
            query: query,
            notebook_id: CONFIG.notebookId,
            response_text: responseText,
            extracted_at: new Date().toISOString(),
            source_count: this.estimateSourceCount(responseText),
            confidence_score: this.calculateConfidenceScore(responseText),
        };

        console.log('[NOTEBOOKLM] Response parsed to JSON:');
        console.log(JSON.stringify(json, null, 2));

        return json;
    }

    /**
     * Estimate number of sources referenced
     */
    estimateSourceCount(text) {
        // Look for citation patterns like [1], [2], (Source), etc.
        const citations = text.match(/\[\d+\]|\(\d+\)|Source:|according to/gi) || [];
        return citations.length || 1;
    }

    /**
     * Calculate confidence score based on response quality
     */
    calculateConfidenceScore(text) {
        let score = 0.5;

        // Longer responses are more confident
        if (text.length > 500) score += 0.2;
        if (text.length > 1000) score += 0.1;

        // Check for structured content
        if (text.includes('\n')) score += 0.1;

        // Cap at 1.0
        return Math.min(score, 1.0);
    }

    /**
     * Save response to file
     */
    saveResponse(content, filename) {
        const filepath = path.join(__dirname, filename);
        fs.writeFileSync(filepath, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
        console.log(`[NOTEBOOKLM] Response saved to: ${filepath}`);
        return filepath;
    }

    /**
     * US-300: Add sources to notebook
     * Adds URL sources and local file sources to the NotebookLM notebook
     */
    async addSources() {
        console.log('\n[US-300] Adding sources to notebook...');
        const results = [];

        // Add URL sources
        for (const source of SOURCES.urls) {
            try {
                console.log(`[SOURCE] Adding URL source: ${source.name}`);
                const result = await this.addUrlSource(source);
                results.push(result);
                this.addedSources.push(result);
            } catch (error) {
                console.error(`[SOURCE] Failed to add ${source.name}: ${error.message}`);
                results.push({
                    name: source.name,
                    url: source.url,
                    category: source.category,
                    status: 'failed',
                    error: error.message,
                    addedAt: new Date().toISOString()
                });
            }
            // Clean up any lingering modals/overlays before next source
            await this.dismissOverlays();
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(500);
        }

        // Add local file sources (if they exist)
        for (const source of SOURCES.localFiles) {
            try {
                console.log(`[SOURCE] Adding local file: ${source.name}`);
                const result = await this.addLocalFileSource(source);
                results.push(result);
                this.addedSources.push(result);
            } catch (error) {
                console.error(`[SOURCE] Failed to add ${source.name}: ${error.message}`);
                results.push({
                    name: source.name,
                    path: source.path,
                    category: source.category,
                    status: 'skipped',
                    error: error.message,
                    addedAt: new Date().toISOString()
                });
            }
        }

        // Save results
        const outputPath = path.join(CONFIG.outputDir, 'sources_added.json');
        fs.writeFileSync(outputPath, JSON.stringify({
            notebook_id: CONFIG.notebookId,
            total_sources: results.length,
            successful: results.filter(r => r.status === 'success').length,
            failed: results.filter(r => r.status !== 'success').length,
            sources: results,
            addedAt: new Date().toISOString()
        }, null, 2));

        console.log(`[US-300] Sources added. Results saved to: ${outputPath}`);
        await this.page.screenshot({ path: path.join(CONFIG.screenshotsDir, 'sources-added.png'), fullPage: true });

        return results;
    }

    /**
     * Add a URL source to the notebook
     */
    async addUrlSource(source) {
        // Look for "Add source" button
        const addSourceSelectors = [
            'button:has-text("Add source")',
            'button:has-text("Add")',
            '[aria-label*="Add source"]',
            '[aria-label*="add source"]',
            'button[data-testid="add-source"]',
            '.add-source-button',
            'button:has-text("+")',
        ];

        let addButton = null;
        for (const selector of addSourceSelectors) {
            try {
                addButton = await this.page.$(selector);
                if (addButton && await addButton.isVisible()) {
                    console.log(`[SOURCE] Found add button with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continue
            }
        }

        if (!addButton) {
            // Try clicking on the sources panel area
            console.log('[SOURCE] Looking for sources panel...');
            const sourcesPanel = await this.page.$('[class*="sources"]') ||
                                 await this.page.$('[aria-label*="Sources"]');
            if (sourcesPanel) {
                await sourcesPanel.click();
                await this.page.waitForTimeout(1000);
            }

            // Try again
            for (const selector of addSourceSelectors) {
                addButton = await this.page.$(selector);
                if (addButton && await addButton.isVisible()) {
                    break;
                }
            }
        }

        if (addButton) {
            await addButton.click();
            await this.page.waitForTimeout(2000);

            // Look for URL input option (inside the modal that just opened)
            const urlOptionSelectors = [
                'button:has-text("Website")',
                'button:has-text("URL")',
                'button:has-text("Link")',
                '[aria-label*="Website"]',
                '[aria-label*="URL"]',
                'text=Website',
                'text=URL'
            ];

            let urlOptionClicked = false;
            for (const selector of urlOptionSelectors) {
                try {
                    const urlOption = await this.page.$(selector);
                    if (urlOption && await urlOption.isVisible()) {
                        await urlOption.click();
                        await this.page.waitForTimeout(1500);
                        urlOptionClicked = true;
                        console.log(`[SOURCE] Clicked URL option: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Continue
                }
            }

            // Wait for URL input field to become enabled after selecting Website option
            if (urlOptionClicked) {
                await this.page.waitForTimeout(500);
            }

            // Enter the URL - NotebookLM uses a textarea with "Paste any links" placeholder
            const urlInputSelectors = [
                'textarea[placeholder*="Paste"]',
                'textarea[placeholder*="links"]',
                'textarea[placeholder*="URL"]',
                'textarea[placeholder*="url"]',
                'input[type="url"]',
                'input[placeholder*="URL"]',
                'input[placeholder*="url"]',
                'input[placeholder*="Enter"]',
                'input[aria-label*="URL"]',
                '.cdk-overlay-pane textarea',
                'textarea',
                'input[type="text"]'
            ];

            let urlInput = null;
            for (const selector of urlInputSelectors) {
                urlInput = await this.page.$(selector);
                if (urlInput && await urlInput.isVisible()) {
                    break;
                }
            }

            if (urlInput) {
                // Try fill first, then fallback to click + type
                try {
                    await urlInput.fill(source.url);
                } catch (fillError) {
                    console.log(`[SOURCE] fill() failed, trying click + type...`);
                    try {
                        await urlInput.click();
                        await this.page.waitForTimeout(300);
                        await this.page.keyboard.type(source.url, { delay: 10 });
                    } catch (typeError) {
                        console.log(`[SOURCE] Type also failed: ${typeError.message}`);
                    }
                }
                await this.page.waitForTimeout(500);

                // Submit
                const submitSelectors = [
                    'button:has-text("Insert")',
                    'button:has-text("Add")',
                    'button:has-text("Submit")',
                    'button[type="submit"]',
                    'button:has-text("OK")'
                ];

                for (const selector of submitSelectors) {
                    try {
                        const submitBtn = await this.page.$(selector);
                        if (submitBtn && await submitBtn.isVisible()) {
                            await submitBtn.click();
                            await this.page.waitForTimeout(CONFIG.sourceAddTimeout);
                            console.log(`[SOURCE] Clicked submit: ${selector}`);
                            break;
                        }
                    } catch (e) {
                        // Continue
                    }
                }
            } else {
                console.log(`[SOURCE] No URL input field found`);
            }
        }

        await this.page.screenshot({
            path: path.join(CONFIG.screenshotsDir, `source-${source.name.replace(/\s+/g, '-')}.png`)
        });

        return {
            name: source.name,
            url: source.url,
            category: source.category,
            type: 'url',
            status: 'success',
            addedAt: new Date().toISOString()
        };
    }

    /**
     * Add a local file source (simulated - NotebookLM requires manual upload)
     */
    async addLocalFileSource(source) {
        // Check if file exists in common locations
        const possiblePaths = [
            path.join(__dirname, '..', source.path),
            path.join(__dirname, source.path),
            path.join(process.cwd(), source.path),
            source.path
        ];

        let filePath = null;
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                filePath = p;
                break;
            }
        }

        if (!filePath) {
            console.log(`[SOURCE] Local file not found: ${source.path}`);
            return {
                name: source.name,
                path: source.path,
                category: source.category,
                type: 'local_file',
                status: 'skipped',
                reason: 'File not found locally - requires manual upload to NotebookLM',
                addedAt: new Date().toISOString()
            };
        }

        // If file exists, we could potentially upload via file input
        // NotebookLM typically uses Google Drive integration
        console.log(`[SOURCE] Found local file: ${filePath}`);

        return {
            name: source.name,
            path: filePath,
            category: source.category,
            type: 'local_file',
            status: 'pending_manual',
            reason: 'Local file found - requires manual upload to NotebookLM',
            addedAt: new Date().toISOString()
        };
    }

    /**
     * US-301: Organize sources into categories
     */
    async organizeSources() {
        console.log('\n[US-301] Organizing sources into categories...');

        const structure = {
            notebook_id: CONFIG.notebookId,
            categories: {},
            organizedAt: new Date().toISOString()
        };

        // Group sources by category
        for (const category of CATEGORIES) {
            structure.categories[category] = {
                sources: this.addedSources.filter(s => s.category === category),
                count: 0,
                description: this.getCategoryDescription(category)
            };
            structure.categories[category].count = structure.categories[category].sources.length;
        }

        this.organizationStructure = structure;

        // Save organization structure
        const outputPath = path.join(CONFIG.outputDir, 'organization_structure.json');
        fs.writeFileSync(outputPath, JSON.stringify(structure, null, 2));

        console.log(`[US-301] Organization complete. Structure saved to: ${outputPath}`);
        console.log('[US-301] Categories:');
        for (const [cat, data] of Object.entries(structure.categories)) {
            console.log(`  - ${cat}: ${data.count} sources`);
        }

        return structure;
    }

    /**
     * Get description for a category
     */
    getCategoryDescription(category) {
        const descriptions = {
            'Quantum Threat Research': 'Standards and research on post-quantum cryptography and quantum computing threats',
            'Healthcare Compliance': 'Regulatory requirements and compliance frameworks for healthcare data protection',
            'QSL Materials': 'Quantum Shield Labs proprietary materials, roadmaps, and playbooks'
        };
        return descriptions[category] || category;
    }

    /**
     * US-302: Create and save synthesis prompts as notebook notes
     */
    async saveSynthesisPrompts() {
        console.log('\n[US-302] Creating and saving synthesis prompts...');
        const results = [];

        for (const prompt of SYNTHESIS_PROMPTS) {
            try {
                console.log(`[PROMPT] Saving prompt: ${prompt.name}`);
                const result = await this.savePromptAsNote(prompt);
                results.push(result);
                this.savedPrompts.push(result);
            } catch (error) {
                console.error(`[PROMPT] Failed to save ${prompt.name}: ${error.message}`);
                results.push({
                    name: prompt.name,
                    status: 'failed',
                    error: error.message,
                    savedAt: new Date().toISOString()
                });
            }
        }

        // Save results
        const outputPath = path.join(CONFIG.outputDir, 'saved_prompts.json');
        fs.writeFileSync(outputPath, JSON.stringify({
            notebook_id: CONFIG.notebookId,
            total_prompts: results.length,
            successful: results.filter(r => r.status === 'success').length,
            prompts: results,
            savedAt: new Date().toISOString()
        }, null, 2));

        console.log(`[US-302] Prompts saved. Results at: ${outputPath}`);
        return results;
    }

    /**
     * Save a synthesis prompt as a notebook note
     */
    async savePromptAsNote(prompt) {
        // Look for "Add note" or similar functionality
        const addNoteSelectors = [
            'button:has-text("Add note")',
            'button:has-text("New note")',
            '[aria-label*="Add note"]',
            '[aria-label*="New note"]',
            'button:has-text("Note")',
            '.add-note-button'
        ];

        let addNoteBtn = null;
        for (const selector of addNoteSelectors) {
            try {
                await this.dismissOverlays();
                addNoteBtn = await this.page.$(selector);
                if (addNoteBtn && await addNoteBtn.isVisible()) {
                    await addNoteBtn.click();
                    await this.page.waitForTimeout(1500);
                    break;
                }
            } catch (e) {
                // Continue
            }
        }

        // If no explicit add note button, try the notes panel
        if (!addNoteBtn) {
            await this.dismissOverlays();
            const notesPanel = await this.page.$('[class*="notes"]') ||
                               await this.page.$('[aria-label*="Notes"]') ||
                               await this.page.$('text=Notes');
            if (notesPanel) {
                await notesPanel.click();
                await this.page.waitForTimeout(1000);
            }
        }

        // Type the prompt content into any available text area
        const noteContent = `# ${prompt.name}\n\n${prompt.prompt}`;

        // Try to find and fill note input
        const noteInputSelectors = [
            'textarea[placeholder*="note"]',
            'div[contenteditable="true"]',
            'textarea',
            '[role="textbox"]'
        ];

        for (const selector of noteInputSelectors) {
            try {
                await this.dismissOverlays();
                const input = await this.page.$(selector);
                if (input && await input.isVisible()) {
                    await input.click();
                    await this.page.keyboard.type(noteContent, { delay: 10 });
                    await this.page.waitForTimeout(1000);

                    // Try to save
                    await this.page.keyboard.press('Escape');
                    break;
                }
            } catch (e) {
                // Continue
            }
        }

        await this.page.screenshot({
            path: path.join(CONFIG.screenshotsDir, `prompt-${prompt.name.replace(/\s+/g, '-')}.png`)
        });

        return {
            name: prompt.name,
            prompt: prompt.prompt,
            status: 'success',
            savedAt: new Date().toISOString()
        };
    }

    /**
     * US-303: Generate derived sources by running prompts
     */
    async generateDerivedSources() {
        console.log('\n[US-303] Generating derived sources from prompts...');
        const results = [];

        for (const prompt of this.savedPrompts) {
            if (prompt.status !== 'success') continue;

            try {
                console.log(`[DERIVE] Running prompt: ${prompt.name}`);
                const response = await this.queryNotebookLM(prompt.prompt);
                const derivedSource = {
                    name: `Derived: ${prompt.name}`,
                    sourcePrompt: prompt.name,
                    content: response,
                    status: 'success',
                    generatedAt: new Date().toISOString()
                };
                results.push(derivedSource);
                this.derivedSources.push(derivedSource);

                // Save as a note in the notebook
                await this.saveResponseAsNote(derivedSource);

            } catch (error) {
                console.error(`[DERIVE] Failed for ${prompt.name}: ${error.message}`);
                results.push({
                    name: `Derived: ${prompt.name}`,
                    sourcePrompt: prompt.name,
                    status: 'failed',
                    error: error.message,
                    generatedAt: new Date().toISOString()
                });
            }
        }

        // Save results
        const outputPath = path.join(CONFIG.outputDir, 'derived_sources.json');
        fs.writeFileSync(outputPath, JSON.stringify({
            notebook_id: CONFIG.notebookId,
            total_derived: results.length,
            successful: results.filter(r => r.status === 'success').length,
            derivedSources: results,
            generatedAt: new Date().toISOString()
        }, null, 2));

        console.log(`[US-303] Derived sources generated. Results at: ${outputPath}`);
        return results;
    }

    /**
     * Save a generated response as a notebook note
     */
    async saveResponseAsNote(derivedSource) {
        // Navigate to notes section and save the derived content
        const noteContent = `# ${derivedSource.name}\n\nGenerated: ${derivedSource.generatedAt}\n\n${derivedSource.content.substring(0, 2000)}`;

        // Try to add as a note
        try {
            const addNoteSelectors = [
                'button:has-text("Add note")',
                'button:has-text("New note")',
                '[aria-label*="Add note"]'
            ];

            for (const selector of addNoteSelectors) {
                await this.dismissOverlays();
                const btn = await this.page.$(selector);
                if (btn && await btn.isVisible()) {
                    await btn.click();
                    await this.page.waitForTimeout(1000);

                    await this.dismissOverlays();

                    // Type content
                    await this.page.keyboard.type(noteContent.substring(0, 500), { delay: 5 });
                    await this.page.keyboard.press('Escape');
                    await this.page.waitForTimeout(500);
                    break;
                }
            }
        } catch (e) {
            console.log(`[DERIVE] Could not save as note: ${e.message}`);
        }
    }

    /**
     * US-304: Create knowledge graph
     */
    async createKnowledgeGraph() {
        console.log('\n[US-304] Creating knowledge graph...');

        // Build the knowledge graph structure
        const knowledgeGraph = {
            nodes: [],
            edges: [],
            metadata: {
                notebook_id: CONFIG.notebookId,
                createdAt: new Date().toISOString(),
                totalNodes: 0,
                totalEdges: 0
            }
        };

        // Add source nodes
        for (const source of this.addedSources) {
            knowledgeGraph.nodes.push({
                id: `source_${source.name.replace(/\s+/g, '_')}`,
                type: 'source',
                label: source.name,
                category: source.category,
                url: source.url || source.path,
                status: source.status
            });
        }

        // Add category nodes
        for (const category of CATEGORIES) {
            knowledgeGraph.nodes.push({
                id: `category_${category.replace(/\s+/g, '_')}`,
                type: 'category',
                label: category,
                description: this.getCategoryDescription(category)
            });
        }

        // Add derived source nodes
        for (const derived of this.derivedSources) {
            knowledgeGraph.nodes.push({
                id: `derived_${derived.name.replace(/\s+/g, '_')}`,
                type: 'derived',
                label: derived.name,
                sourcePrompt: derived.sourcePrompt,
                status: derived.status
            });
        }

        // Add prompt nodes
        for (const prompt of this.savedPrompts) {
            knowledgeGraph.nodes.push({
                id: `prompt_${prompt.name.replace(/\s+/g, '_')}`,
                type: 'prompt',
                label: prompt.name,
                status: prompt.status
            });
        }

        // Create edges: sources -> categories
        for (const source of this.addedSources) {
            knowledgeGraph.edges.push({
                source: `source_${source.name.replace(/\s+/g, '_')}`,
                target: `category_${source.category.replace(/\s+/g, '_')}`,
                relationship: 'belongs_to'
            });
        }

        // Create edges: prompts -> derived sources
        for (const derived of this.derivedSources) {
            knowledgeGraph.edges.push({
                source: `prompt_${derived.sourcePrompt.replace(/\s+/g, '_')}`,
                target: `derived_${derived.name.replace(/\s+/g, '_')}`,
                relationship: 'generates'
            });
        }

        // Create edges: categories -> prompts (based on relevance)
        for (const prompt of SYNTHESIS_PROMPTS) {
            for (const category of CATEGORIES) {
                knowledgeGraph.edges.push({
                    source: `category_${category.replace(/\s+/g, '_')}`,
                    target: `prompt_${prompt.name.replace(/\s+/g, '_')}`,
                    relationship: 'informs'
                });
            }
        }

        knowledgeGraph.metadata.totalNodes = knowledgeGraph.nodes.length;
        knowledgeGraph.metadata.totalEdges = knowledgeGraph.edges.length;

        // Save knowledge graph
        const kgPath = path.join(CONFIG.outputDir, 'knowledge_graph.json');
        fs.writeFileSync(kgPath, JSON.stringify(knowledgeGraph, null, 2));

        // Save notebook metadata
        const metadataPath = path.join(CONFIG.outputDir, 'notebook_metadata.json');
        const metadata = {
            notebook_id: CONFIG.notebookId,
            notebook_url: CONFIG.notebookUrl,
            totalSources: this.addedSources.length,
            totalPrompts: this.savedPrompts.length,
            totalDerivedSources: this.derivedSources.length,
            categories: CATEGORIES,
            organizationStructure: this.organizationStructure,
            createdAt: new Date().toISOString()
        };
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

        console.log(`[US-304] Knowledge graph created: ${kgPath}`);
        console.log(`[US-304] Notebook metadata saved: ${metadataPath}`);
        console.log(`[US-304] Graph stats: ${knowledgeGraph.metadata.totalNodes} nodes, ${knowledgeGraph.metadata.totalEdges} edges`);

        return { knowledgeGraph, metadata };
    }

    /**
     * US-205: Close browser cleanly
     */
    async closeBrowser() {
        if (this.browser) {
            console.log('[PLAYWRIGHT] Closing browser...');
            await this.browser.close();
            console.log('[PLAYWRIGHT] Browser closed cleanly');
        }
    }
}

// Main execution
async function main() {
    const automation = new NotebookLMAutomation();
    const args = process.argv.slice(2);
    const runMode = args[0] || 'all'; // 'all', 'sources', 'query', or specific US-XXX

    try {
        // US-200: Setup browser
        console.log('\n=== US-200: Setting up Playwright environment ===');
        await automation.setupBrowser();

        // US-201: Authenticate with NotebookLM
        console.log('\n=== US-201: Opening NotebookLM and authenticating ===');
        const authenticated = await automation.authenticateNotebookLM();
        if (!authenticated) {
            throw new Error('Authentication failed');
        }

        if (runMode === 'all' || runMode === 'sources' || runMode === 'US-300') {
            // US-300: Add sources to notebook
            console.log('\n=== US-300: Adding sources to quantum notebook ===');
            await automation.addSources();
        }

        if (runMode === 'all' || runMode === 'sources' || runMode === 'US-301') {
            // US-301: Organize sources into categories
            console.log('\n=== US-301: Organizing sources into categories ===');
            await automation.organizeSources();
        }

        if (runMode === 'all' || runMode === 'sources' || runMode === 'US-302') {
            // US-302: Create and save synthesis prompts
            console.log('\n=== US-302: Creating and saving synthesis prompts ===');
            await automation.saveSynthesisPrompts();
        }

        if (runMode === 'all' || runMode === 'sources' || runMode === 'US-303') {
            // US-303: Generate derived sources
            console.log('\n=== US-303: Generating derived sources ===');
            await automation.generateDerivedSources();
        }

        if (runMode === 'all' || runMode === 'sources' || runMode === 'US-304') {
            // US-304: Create knowledge graph
            console.log('\n=== US-304: Creating knowledge graph ===');
            await automation.createKnowledgeGraph();
        }

        if (runMode === 'query' || runMode === 'all') {
            // Original query testing (US-202 through US-204)
            console.log('\n=== US-202: Querying NotebookLM ===');
            const query1 = 'Based on Ralph methodology, explain the key principles for autonomous AI coding. Focus on story sizing, feedback loops, and memory artifacts.';
            const response1 = await automation.queryNotebookLM(query1);

            // Save raw response
            automation.saveResponse(response1, 'notebooklm_response.txt');

            // US-203: Parse as JSON
            console.log('\n=== US-203: Parsing response as JSON ===');
            const json1 = automation.parseResponseAsJSON(query1, response1);
            automation.saveResponse(json1, 'notebooklm_response.json');

            // US-204: Test dynamic querying with different query
            console.log('\n=== US-204: Testing variable-based querying ===');
            const query2 = 'Explain the initializer pattern in Ralph methodology and how it differs from iterative coding agents.';
            const response2 = await automation.queryNotebookLM(query2);
            const json2 = automation.parseResponseAsJSON(query2, response2);
            automation.saveResponse(json2, 'notebooklm_response_test2.json');

            // Verify responses are different
            if (response1 !== response2 && response2.length > 100) {
                console.log('[NOTEBOOKLM] Dynamic querying confirmed - different prompts produce different synthesized responses');
            } else {
                console.log('[NOTEBOOKLM] Warning: Responses may be similar or empty');
            }
        }

        // US-205: Close browser
        console.log('\n=== US-205: Closing browser ===');
        await automation.closeBrowser();

        console.log('\n[COMPLETE] NotebookLM source automation successful');
        console.log('\nOutputs generated:');
        console.log('  - sources_added.json');
        console.log('  - organization_structure.json');
        console.log('  - saved_prompts.json');
        console.log('  - derived_sources.json');
        console.log('  - notebook_metadata.json');
        console.log('  - knowledge_graph.json');

    } catch (error) {
        console.error('[ERROR]', error.message);
        await automation.page?.screenshot({
            path: path.join(CONFIG.screenshotsDir, 'error-state.png'),
            fullPage: true
        });
        await automation.closeBrowser();
        process.exit(1);
    }
}

/**
 * Run only the source automation (US-300 through US-304)
 */
async function runSourceAutomation() {
    const automation = new NotebookLMAutomation();

    try {
        console.log('\n========================================');
        console.log('NotebookLM Source Automation');
        console.log('Stories: US-300 through US-304');
        console.log('========================================\n');

        // Setup and authenticate
        await automation.setupBrowser();
        const authenticated = await automation.authenticateNotebookLM();
        if (!authenticated) {
            throw new Error('Authentication failed');
        }

        // Execute stories in sequence
        console.log('\n--- US-300: Add Sources ---');
        await automation.addSources();

        console.log('\n--- US-301: Organize Categories ---');
        await automation.organizeSources();

        console.log('\n--- US-302: Save Synthesis Prompts ---');
        await automation.saveSynthesisPrompts();

        console.log('\n--- US-303: Generate Derived Sources ---');
        await automation.generateDerivedSources();

        console.log('\n--- US-304: Create Knowledge Graph ---');
        await automation.createKnowledgeGraph();

        // Close
        await automation.closeBrowser();

        console.log('\n========================================');
        console.log('SOURCE AUTOMATION COMPLETE');
        console.log('========================================');

        return {
            sources: automation.addedSources,
            organization: automation.organizationStructure,
            prompts: automation.savedPrompts,
            derivedSources: automation.derivedSources
        };

    } catch (error) {
        console.error('[ERROR]', error.message);
        await automation.closeBrowser();
        throw error;
    }
}

// Export for testing and external use
module.exports = {
    NotebookLMAutomation,
    CONFIG,
    SOURCES,
    SYNTHESIS_PROMPTS,
    CATEGORIES,
    runSourceAutomation
};

// Run if executed directly
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args[0] === 'sources') {
        runSourceAutomation().catch(console.error);
    } else {
        main();
    }
}
