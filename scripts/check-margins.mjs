import { chromium } from "playwright";
const BASE = "http://127.0.0.1:5173/family-tree2/";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto(`${BASE}#/family/yamada/tree`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const info = await page.evaluate(() => {
  const h = document.documentElement;
  const b = document.body;
  const r = document.getElementById("root");
  return {
    html: {
      margin: getComputedStyle(h).margin,
      padding: getComputedStyle(h).padding,
      height: getComputedStyle(h).height,
      overflow: getComputedStyle(h).overflow,
    },
    body: {
      margin: getComputedStyle(b).margin,
      padding: getComputedStyle(b).padding,
      height: getComputedStyle(b).height,
      overflow: getComputedStyle(b).overflow,
      boxSizing: getComputedStyle(b).boxSizing,
    },
    root: {
      margin: getComputedStyle(r).margin,
      padding: getComputedStyle(r).padding,
      height: getComputedStyle(r).height,
      overflow: getComputedStyle(r).overflow,
      boxSizing: getComputedStyle(r).boxSizing,
      offsetTop: r.offsetTop,
    },
    htmlRect: h.getBoundingClientRect(),
    bodyRect: b.getBoundingClientRect(),
    rootRect: r.getBoundingClientRect(),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
