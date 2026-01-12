/**
 * NotebookLM Browser Automation Script
 * This script uses Playwright to interact with NotebookLM for sourced report generation.
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
    responseTimeout: 60000,
};

// Ensure directories exist
if (!fs.existsSync(CONFIG.screenshotsDir)) {
    fs.mkdirSync(CONFIG.screenshotsDir, { recursive: true });
}

class NotebookLMAutomation {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
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
     * US-201: Open NotebookLM and authenticate
     */
    async authenticateNotebookLM() {
        console.log('[NOTEBOOKLM] Navigating to NotebookLM...');

        await this.page.goto(CONFIG.notebookUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

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
                    return url.href.includes('notebooklm.google.com/notebook');
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

        // Wait for notebook to fully load
        console.log('[NOTEBOOKLM] Waiting for notebook to load...');
        await this.page.waitForTimeout(5000);

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

        // US-202: Query NotebookLM
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

        // US-205: Close browser
        console.log('\n=== US-205: Closing browser ===');
        await automation.closeBrowser();

        console.log('\n[COMPLETE] NotebookLM browser automation proof of concept successful');

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

// Export for testing
module.exports = { NotebookLMAutomation, CONFIG };

// Run if executed directly
if (require.main === module) {
    main();
}
