import { chromium } from "playwright";
const BASE = "http://127.0.0.1:5173/family-tree2/";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.goto(`${BASE}#/family/yamada/tree`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);

const report = await page.evaluate(() => {
  // Find any element whose bottom extends below 800.
  const tall = [];
  const all = document.querySelectorAll("body *");
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.bottom > 800) {
      const s = getComputedStyle(el);
      tall.push({
        tag: el.tagName,
        cls: (el.className || "").toString().slice(0, 60),
        inline: (el.getAttribute("style") || "").slice(0, 120),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        height: Math.round(r.height),
        position: s.position,
      });
    }
  }
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    docH: document.documentElement.scrollHeight,
    bodyH: document.body.scrollHeight,
    rootH: document.getElementById("root")?.scrollHeight,
    tallElements: tall.slice(0, 15),
    tallCount: tall.length,
  };
});
console.log(JSON.stringify(report, null, 2));
await browser.close();
