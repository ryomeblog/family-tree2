import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "screenshots";
const BASE = "http://127.0.0.1:5173/family-tree2/";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());

await page.goto(`${BASE}#/new`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/new-empty.png` });

// Click the year picker button
await page.locator('button[aria-haspopup="listbox"]').click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/new-yearpicker-open.png` });

// Read options count
const initialCount = await page.locator('button[role="option"]').count();
console.log("initial options:", initialCount);

// Scroll to the bottom of the listbox to trigger "load more"
const listbox = page.locator('[role="listbox"]');
const scrollContainer = listbox.locator("div").filter({ hasText: "さらに" }).first();
// Easier: scroll the scrollable div by evaluating
await page.evaluate(() => {
  const lb = document.querySelector('[role="listbox"]');
  const scrollers = lb?.querySelectorAll("div");
  if (scrollers) {
    for (const el of Array.from(scrollers)) {
      if (el.scrollHeight > el.clientHeight) {
        el.scrollTo({ top: el.scrollHeight });
        break;
      }
    }
  }
});
await page.waitForTimeout(300);
const afterOneScroll = await page.locator('button[role="option"]').count();
console.log("after 1 scroll:", afterOneScroll);

// Scroll again
await page.evaluate(() => {
  const lb = document.querySelector('[role="listbox"]');
  const scrollers = lb?.querySelectorAll("div");
  if (scrollers) {
    for (const el of Array.from(scrollers)) {
      if (el.scrollHeight > el.clientHeight) {
        el.scrollTo({ top: el.scrollHeight });
        break;
      }
    }
  }
});
await page.waitForTimeout(300);
const afterTwoScrolls = await page.locator('button[role="option"]').count();
console.log("after 2 scrolls:", afterTwoScrolls);

await page.screenshot({ path: `${OUT}/new-yearpicker-scrolled.png` });

// Inspect: first and last option text
const firstText = await page.locator('button[role="option"]').first().innerText();
const lastText = await page.locator('button[role="option"]').last().innerText();
console.log("first option:", firstText);
console.log("last option:", lastText);

// Select a year by clicking one of the options
await page.locator('button[role="option"]', { hasText: "1992" }).first().click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/new-yearpicker-selected.png` });

await browser.close();
