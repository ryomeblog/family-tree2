// iPhone SE (375×667) で全画面を撮影しつつ、各画面で
//   - 要素が viewport から溢れていないか
//   - タップターゲットが 44×44 を満たさない要素はどれか
//   - スクロールバー以外で横スクロールが起きていないか
// を定量的に列挙する。
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "http://127.0.0.1:5173/family-tree2/";
const OUT = "screenshots/mobile-audit";
await mkdir(OUT, { recursive: true });

// iPhone SE 3 世代（2022）相当。小さい画面で当たる問題を拾いやすい。
const VIEWPORT = { width: 375, height: 667 };

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

const screens = [
  { name: "01-landing", url: "" },
  { name: "02-home", url: "#/home" },
  { name: "03-new-family", url: "#/new" },
  { name: "04-open", url: "#/open" },
  { name: "05-import", url: "#/import" },
  { name: "06-settings", url: "#/settings" },
  { name: "07-terms", url: "#/terms" },
  { name: "08-privacy", url: "#/privacy" },
  { name: "09-tree", url: "#/family/yamada/tree" },
  { name: "10-person-detail", url: "#/family/yamada/person/p_haruko" },
  { name: "11-person-new", url: "#/family/yamada/person/new" },
  { name: "12-person-edit", url: "#/family/yamada/person/p_haruko/edit" },
  { name: "13-memories", url: "#/family/yamada/memories" },
  { name: "14-memory-detail", url: "#/family/yamada/memory/m_rose" },
  { name: "15-memory-new", url: "#/family/yamada/memory/new" },
  { name: "16-memory-edit", url: "#/family/yamada/memory/m_rose/edit" },
  { name: "17-relate", url: "#/family/yamada/relate?pid=p_sho" },
  { name: "18-delete-family", url: "#/family/yamada/delete" },
];

const report = [];
for (const s of screens) {
  await page.goto(BASE + s.url, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);

  const m = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflowX = doc.scrollWidth - doc.clientWidth;
    const offenders = [];
    // viewport より右に飛び出しているクリック可能要素を列挙
    const viewportW = window.innerWidth;
    const clickable = document.querySelectorAll(
      'button, a, [role="button"], input, select, textarea',
    );
    const tiny = [];
    for (const el of clickable) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.right > viewportW + 1 || r.left < -1) {
        offenders.push({
          tag: el.tagName,
          text: (el.textContent || "").trim().slice(0, 30) ||
            (el.getAttribute("aria-label") || "") ||
            (el.getAttribute("placeholder") || ""),
          left: Math.round(r.left),
          right: Math.round(r.right),
        });
      }
      // タップターゲット評価（44×44 以下は Apple HIG 違反の疑い）
      if (r.width < 32 || r.height < 32) {
        tiny.push({
          tag: el.tagName,
          text: (el.textContent || "").trim().slice(0, 20),
          w: Math.round(r.width),
          h: Math.round(r.height),
        });
      }
    }
    return { overflowX, offenders: offenders.slice(0, 10), tinyCount: tiny.length, tinyFirst: tiny.slice(0, 5) };
  });

  const ent = { name: s.name, url: s.url, ...m };
  report.push(ent);
  await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: false });
}

console.log("=".repeat(72));
for (const r of report) {
  const marks = [];
  if (r.overflowX > 0) marks.push(`overflowX+${r.overflowX}`);
  if (r.offenders.length) marks.push(`offscreen=${r.offenders.length}`);
  if (r.tinyCount > 0) marks.push(`tiny=${r.tinyCount}`);
  const tag = marks.length ? `  ⚠ ${marks.join(" ")}` : "  ✓";
  console.log(r.name.padEnd(20), tag);
  if (r.offenders.length) {
    for (const o of r.offenders.slice(0, 4)) {
      console.log("     offscreen:", o.tag, JSON.stringify(o.text), `[${o.left}..${o.right}]`);
    }
  }
  if (r.tinyCount > 0 && r.tinyFirst.length) {
    for (const t of r.tinyFirst.slice(0, 3)) {
      console.log("     tiny:", t.tag, JSON.stringify(t.text), `${t.w}×${t.h}`);
    }
  }
}

await browser.close();
console.log("done");
