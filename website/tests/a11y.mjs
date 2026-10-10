// Accessibility check for the public pages: serves the production build with
// `vite preview`, opens each route in Chrome and fails if axe reports violations.
// Run after `npm run build`: `npm run test:a11y`. Uses the installed Google Chrome
// (set CHROME_PATH to use another Chromium build).
import { spawn } from "node:child_process";
import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright-core";

const PORT = 4179;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ROUTES = ["/", "/explore", "/search", "/search?q=zzzz-no-match", "/about", "/contact", "/admin/login", "/media", "/missing-page"];
const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 375, height: 812 },
];

async function waitForServer(url, timeoutMs = 30_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Preview server did not start at ${url}`);
}

const server = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], {
  stdio: "ignore",
});

let failures = 0;
let browser;
try {
  await waitForServer(BASE_URL);
  browser = await chromium.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" },
  );

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
    });
    for (const route of ROUTES) {
      const page = await context.newPage();
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      if (violations.length === 0) {
        console.log(`ok   ${viewport.name} ${route}`);
      } else {
        failures += violations.length;
        console.error(`FAIL ${viewport.name} ${route}`);
        for (const violation of violations) {
          console.error(`  - [${violation.impact}] ${violation.id}: ${violation.help}`);
          for (const node of violation.nodes.slice(0, 3)) console.error(`      ${node.target.join(" ")}`);
        }
      }
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser?.close();
  server.kill();
}

if (failures > 0) {
  console.error(`\n${failures} accessibility violation(s) found.`);
  process.exit(1);
}
console.log("\nNo accessibility violations found.");
