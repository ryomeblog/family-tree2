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
  const hits = [];
  const all = document.querySelectorAll("*");
  for (const el of all) {
    const s = getComputedStyle(el);
    const canScroll =
      s.overflowX === "auto" ||
      s.overflowX === "scroll" ||
      s.overflowY === "auto" ||
      s.overflowY === "scroll";
    if (!canScroll) continue;
    const r = el.getBoundingClientRect();
    if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
      hits.push({
        tag: el.tagName,
        cls: (el.className || "").toString().slice(0, 40),
        overflow: `${s.overflowX}/${s.overflowY}`,
        scrollH: el.scrollHeight,
        clientH: el.clientHeight,
        scrollW: el.scrollWidth,
        clientW: el.clientWidth,
        rect: { w: Math.round(r.width), h: Math.round(r.height) },
      });
    }
  }
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    docScrollH: document.documentElement.scrollHeight,
    docClientH: document.documentElement.clientHeight,
    bodyScrollH: document.body.scrollHeight,
    bodyClientH: document.body.clientHeight,
    hits,
  };
});
console.log(JSON.stringify(report, null, 2));
await browser.close();
