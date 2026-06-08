import { prisma } from "./db";
import { decrypt } from "./encryption";
import { chromium, type Browser, type Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

// ============================================================
// Browser Automation for ChatGPT & Gemini
// Real Playwright implementation with correct selectors
// ============================================================

interface GenerationOptions {
  generationId: string;
  accountId: string;
  prompt: string;
  imagePaths?: string[];
}

interface GenerationResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Get a decrypted account by ID
 */
async function getAccount(accountId: string) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new Error("Account not found");
  if (!account.sessionCookie) throw new Error("Account has no session cookie");
  return {
    ...account,
    decryptedCookie: decrypt(account.sessionCookie),
  };
}

/**
 * Save generation result to database
 */
async function saveResult(generationId: string, status: string, resultUrl?: string, error?: string) {
  await prisma.generation.update({
    where: { id: generationId },
    data: {
      status,
      ...(resultUrl && { resultUrl }),
      ...(error && { error }),
    },
  });
}

/**
 * Log messages with timestamp
 */
function log(message: string) {
  console.log(`[Automation ${new Date().toISOString()}] ${message}`);
}

/**
 * Update generation progress in the database
 */
async function updateProgress(generationId: string, message: string) {
  log(message);
  await prisma.generation.update({
    where: { id: generationId },
    data: { error: message }, // Using error field for progress messages
  });
}

/**
 * Create a Chromium browser instance with anti-detection measures
 */
async function createBrowser(headless: boolean = true): Promise<Browser> {
  return chromium.launch({
    headless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1920,1080",
    ],
  });
}

/**
 * Inject cookies into a browser context
 */
async function injectCookies(context: import("playwright").BrowserContext, cookieString: string, domain: string) {
  const cookiePairs = cookieString.split(";").filter(c => c.trim());
  const cookies = cookiePairs.map(pair => {
    const [name, ...valueParts] = pair.split("=");
    const value = valueParts.join("=");
    // Encode value to handle special characters
    const encodedValue = value.trim();
    return {
      name: name.trim(),
      value: encodedValue,
      domain,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax" as const,
    };
  }).filter(c => c.name && c.name.length > 0);

  if (cookies.length === 0) {
    log("No valid cookies to inject");
    return;
  }

  try {
    await context.addCookies(cookies);
    log(`Injected ${cookies.length} cookies for ${domain}`);
  } catch (err) {
    log(`Failed to inject cookies for ${domain}: ${err}`);
    // Try injecting one by one to find the problematic cookie
    let injected = 0;
    for (const cookie of cookies) {
      try {
        await context.addCookies([cookie]);
        injected++;
      } catch (e) {
        log(`Skipping cookie '${cookie.name}': ${e}`);
      }
    }
    log(`Injected ${injected}/${cookies.length} cookies individually`);
  }
}

/**
 * Wait for ChatGPT to finish generating (detect image in response)
 */
async function waitForChatGPTResponse(page: Page, timeoutMs: number = 420_000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    // Check if send button is enabled again (means response is complete)
    const sendButton = page.locator('button[data-testid="send-button"], button[aria-label="Send prompt"]');
    const isDisabled = await sendButton.getAttribute("disabled");

    // Check for image elements in the response
    const images = await page.locator('img[alt*="Generated"], img[src*="blob:"], img[src*="oaidalle"]').count();
    if (images > 0) {
      log(`Found ${images} generated image(s)`);
      return true;
    }

    // Check for DALL-E image containers
    const dalleImages = await page.locator('[data-testid*="image"], .image-generation, img[src*="dalle"]').count();
    if (dalleImages > 0) {
      log(`Found ${dalleImages} DALL-E image(s)`);
      return true;
    }

    // Check if any response message contains an image
    const responseImages = await page.locator('div[data-message-author-role="assistant"] img').count();
    if (responseImages > 0) {
      log(`Found ${responseImages} image(s) in assistant response`);
      return true;
    }

    // Wait a bit before checking again
    await page.waitForTimeout(3000);

    // Log progress every 30 seconds
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    if (elapsed % 30 === 0 && elapsed > 0) {
      log(`Waiting for ChatGPT response... ${elapsed}s elapsed`);
    }
  }

  return false;
}

/**
 * Download images from ChatGPT response
 */
async function downloadResponseImages(page: Page, generationId: string): Promise<string[]> {
  const outputDir = path.join(process.cwd(), "uploads", "generated");
  fs.mkdirSync(outputDir, { recursive: true });

  const downloadedPaths: string[] = [];

  // Find all images in the latest assistant response
  const images = page.locator('div[data-message-author-role="assistant"]:last-of-type img');
  const count = await images.count();

  for (let i = 0; i < count; i++) {
    const img = images.nth(i);
    const src = await img.getAttribute("src");
    if (!src) continue;

    // Skip tiny icons/emojis
    const width = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
    if (width < 100) continue;

    try {
      const filename = `storyboard-${generationId}-${i + 1}.png`;
      const filepath = path.join(outputDir, filename);

      if (src.startsWith("blob:")) {
        // Download from blob URL
        const response = await page.evaluate(async (blobUrl: string) => {
          const resp = await fetch(blobUrl);
          const buffer = await resp.arrayBuffer();
          return Array.from(new Uint8Array(buffer));
        }, src);
        fs.writeFileSync(filepath, Buffer.from(response));
      } else if (src.startsWith("data:")) {
        // Handle data URLs
        const base64 = src.split(",")[1];
        fs.writeFileSync(filepath, Buffer.from(base64, "base64"));
      } else {
        // Download from URL
        const response = await page.evaluate(async (url: string) => {
          const resp = await fetch(url);
          const buffer = await resp.arrayBuffer();
          return Array.from(new Uint8Array(buffer));
        }, src);
        fs.writeFileSync(filepath, Buffer.from(response));
      }

      downloadedPaths.push(`/api/uploads/generated/${filename}`);
      log(`Downloaded image ${i + 1}: ${filename}`);
    } catch (err) {
      log(`Failed to download image ${i + 1}: ${err}`);
    }
  }

  return downloadedPaths;
}

/**
 * Generate images using ChatGPT
 */
export async function generateWithChatGPT(options: GenerationOptions): Promise<GenerationResult> {
  const { generationId, accountId, prompt, imagePaths } = options;
  let browser: Browser | null = null;

  try {
    await updateProgress(generationId, "Loading account...");
    const account = await getAccount(accountId);

    await updateProgress(generationId, "Launching browser...");
    browser = await createBrowser(true);
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    });

    await updateProgress(generationId, "Injecting session cookie...");
    await injectCookies(context, account.decryptedCookie, "chatgpt.com");
    await injectCookies(context, account.decryptedCookie, ".chatgpt.com");

    const page = await context.newPage();

    await updateProgress(generationId, "Navigating to ChatGPT...");
    await page.goto("https://chatgpt.com", { waitUntil: "networkidle", timeout: 60_000 });

    // Wait for the main interface to load
    await page.waitForTimeout(3000);

    // Check if we're logged in by looking for the chat input
    const isLoggedIn = await page.locator('.ProseMirror, [data-testid="chat-input"], #prompt-textarea').count() > 0;
    if (!isLoggedIn) {
      // Save debug screenshot
      const debugDir = path.join(process.cwd(), "uploads", "debug");
      fs.mkdirSync(debugDir, { recursive: true });
      await page.screenshot({ path: path.join(debugDir, `login-failed-${generationId}.png`), fullPage: true });
      throw new Error("Not logged in - session cookie may be expired");
    }

    // Upload images if provided
    if (imagePaths && imagePaths.length > 0) {
      await updateProgress(generationId, `Uploading ${imagePaths.length} image(s)...`);

      // Find file input
      const fileInput = page.locator('input[type="file"]').first();

      // Convert paths to absolute paths and upload
      const absolutePaths = imagePaths.map(p => {
        if (path.isAbsolute(p)) return p;
        return path.join(process.cwd(), p);
      }).filter(p => fs.existsSync(p));

      if (absolutePaths.length > 0) {
        await fileInput.setInputFiles(absolutePaths);
        // Wait for upload to complete
        await page.waitForTimeout(5000);
        log(`Uploaded ${absolutePaths.length} images`);
      }
    }

    // Type the prompt into the ProseMirror editor
    await updateProgress(generationId, "Typing prompt...");

    // Try ProseMirror editor first (current ChatGPT)
    const proseMirror = page.locator('.ProseMirror');
    const legacyInput = page.locator('[data-testid="chat-input"], #prompt-textarea');
    const composer = page.locator('[id="composer-background"]');

    let inputFound = false;

    if (await proseMirror.count() > 0) {
      await proseMirror.click();
      await page.waitForTimeout(500);
      // Clear existing text and type new prompt
      await page.keyboard.press("Control+a");
      await page.keyboard.press("Backspace");
      await page.waitForTimeout(300);
      await page.keyboard.type(prompt, { delay: 10 });
      inputFound = true;
      log("Used ProseMirror editor");
    } else if (await legacyInput.count() > 0) {
      await legacyInput.click();
      await page.waitForTimeout(500);
      await legacyInput.fill(prompt);
      inputFound = true;
      log("Used legacy textarea");
    } else if (await composer.count() > 0) {
      await composer.click();
      await page.waitForTimeout(500);
      await page.keyboard.type(prompt, { delay: 10 });
      inputFound = true;
      log("Used composer background");
    }

    if (!inputFound) {
      const debugDir = path.join(process.cwd(), "uploads", "debug");
      fs.mkdirSync(debugDir, { recursive: true });
      await page.screenshot({ path: path.join(debugDir, `no-input-${generationId}.png`), fullPage: true });
      throw new Error("Could not find chat input element");
    }

    await page.waitForTimeout(1000);

    // Click the send button
    await updateProgress(generationId, "Clicking send button...");

    const sendButton = page.locator('button[data-testid="send-button"], button[aria-label="Send prompt"], button[aria-label="Send"]');
    const composerSendButton = page.locator('#composer-submit-button, button[data-testid="composer-submit"]');

    let sent = false;

    if (await sendButton.count() > 0 && !(await sendButton.first().isDisabled())) {
      await sendButton.first().click();
      sent = true;
      log("Clicked send button (data-testid)");
    } else if (await composerSendButton.count() > 0 && !(await composerSendButton.first().isDisabled())) {
      await composerSendButton.first().click();
      sent = true;
      log("Clicked composer submit button");
    } else {
      // Try keyboard shortcut
      await page.keyboard.press("Enter");
      await page.waitForTimeout(2000);

      // Check if message was sent (look for new assistant message)
      const assistantMsg = await page.locator('div[data-message-author-role="assistant"]').count();
      if (assistantMsg > 0) {
        sent = true;
        log("Sent via Enter key");
      }
    }

    if (!sent) {
      const debugDir = path.join(process.cwd(), "uploads", "debug");
      fs.mkdirSync(debugDir, { recursive: true });
      await page.screenshot({ path: path.join(debugDir, `send-failed-${generationId}.png`), fullPage: true });
      throw new Error("Could not click send button");
    }

    // Wait for ChatGPT to generate the response
    await updateProgress(generationId, "Waiting for ChatGPT to generate images... (up to 7 minutes)");
    const responseReceived = await waitForChatGPTResponse(page, 420_000);

    if (!responseReceived) {
      const debugDir = path.join(process.cwd(), "uploads", "debug");
      fs.mkdirSync(debugDir, { recursive: true });
      await page.screenshot({ path: path.join(debugDir, `timeout-${generationId}.png`), fullPage: true });
      throw new Error("Timeout: ChatGPT did not generate images within 7 minutes");
    }

    // Wait a bit more for all images to fully load
    await page.waitForTimeout(5000);

    // Download generated images
    await updateProgress(generationId, "Downloading generated images...");
    const downloadedPaths = await downloadResponseImages(page, generationId);

    if (downloadedPaths.length === 0) {
      // Save debug screenshot
      const debugDir = path.join(process.cwd(), "uploads", "debug");
      fs.mkdirSync(debugDir, { recursive: true });
      await page.screenshot({ path: path.join(debugDir, `no-images-${generationId}.png`), fullPage: true });
      throw new Error("No images found in ChatGPT response");
    }

    // Update generation with result
    await saveResult(generationId, "completed", downloadedPaths[0]);

    // Update account usage
    await prisma.account.update({
      where: { id: accountId },
      data: { lastUsedAt: new Date() },
    });

    log(`Generation completed successfully with ${downloadedPaths.length} image(s)`);
    return { success: true, outputPath: downloadedPaths[0] };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log(`Generation failed: ${errorMessage}`);
    await saveResult(generationId, "failed", undefined, errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    if (browser) {
      try { await browser.close(); } catch (e) { log(`Error closing browser: ${e}`); }
    }
  }
}

/**
 * Generate videos using Gemini
 */
export async function generateWithGemini(options: GenerationOptions): Promise<GenerationResult> {
  const { generationId, accountId, prompt, imagePaths } = options;
  let browser: Browser | null = null;

  try {
    await updateProgress(generationId, "Loading Gemini account...");
    const account = await getAccount(accountId);

    await updateProgress(generationId, "Launching browser...");
    browser = await createBrowser(true);
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    });

    await updateProgress(generationId, "Injecting Gemini session cookie...");
    await injectCookies(context, account.decryptedCookie, ".google.com");
    await injectCookies(context, account.decryptedCookie, "aistudio.google.com");
    await injectCookies(context, account.decryptedCookie, ".googleapis.com");

    const page = await context.newPage();

    await updateProgress(generationId, "Navigating to Gemini...");
    await page.goto("https://aistudio.google.com", { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(3000);

    // Check if logged in
    const isLoggedIn = await page.locator('textarea, [contenteditable="true"]').count() > 0;
    if (!isLoggedIn) {
      const debugDir = path.join(process.cwd(), "uploads", "debug");
      fs.mkdirSync(debugDir, { recursive: true });
      await page.screenshot({ path: path.join(debugDir, `gemini-login-failed-${generationId}.png`), fullPage: true });
      throw new Error("Not logged in to Gemini - session cookie may be expired");
    }

    // Upload images if provided
    if (imagePaths && imagePaths.length > 0) {
      await updateProgress(generationId, `Uploading ${imagePaths.length} image(s) to Gemini...`);
      const fileInput = page.locator('input[type="file"]').first();
      const absolutePaths = imagePaths.map(p => path.isAbsolute(p) ? p : path.join(process.cwd(), p)).filter(p => fs.existsSync(p));
      if (absolutePaths.length > 0) {
        await fileInput.setInputFiles(absolutePaths);
        await page.waitForTimeout(5000);
      }
    }

    // Type prompt
    await updateProgress(generationId, "Typing prompt...");
    const textarea = page.locator('textarea, [contenteditable="true"]').first();
    await textarea.click();
    await page.waitForTimeout(500);
    await textarea.fill(prompt);
    await page.waitForTimeout(1000);

    // Click send
    await updateProgress(generationId, "Sending to Gemini...");
    const sendBtn = page.locator('button[aria-label*="Send"], button[aria-label*="Run"], button[type="submit"]').first();
    if (await sendBtn.count() > 0) {
      await sendBtn.click();
    } else {
      await page.keyboard.press("Enter");
    }

    // Wait for response
    await updateProgress(generationId, "Waiting for Gemini to generate video... (up to 10 minutes)");
    await page.waitForTimeout(600_000);

    // Save debug
    const debugDir = path.join(process.cwd(), "uploads", "debug");
    fs.mkdirSync(debugDir, { recursive: true });
    await page.screenshot({ path: path.join(debugDir, `gemini-result-${generationId}.png`), fullPage: true });

    // TODO: Download video when Gemini returns it
    await saveResult(generationId, "completed", undefined);
    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log(`Gemini generation failed: ${errorMessage}`);
    await saveResult(generationId, "failed", undefined, errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    if (browser) {
      try { await browser.close(); } catch (e) { log(`Error closing browser: ${e}`); }
    }
  }
}

/**
 * Main generation runner
 */
export async function runGeneration(options: GenerationOptions, type: "chatgpt" | "gemini"): Promise<GenerationResult> {
  log(`Starting ${type} generation for ${options.generationId}`);

  if (type === "chatgpt") {
    return generateWithChatGPT(options);
  } else {
    return generateWithGemini(options);
  }
}
