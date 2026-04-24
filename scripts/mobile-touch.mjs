// iPhone SE (375×667) でタッチドラッグによる家系図パンと、検索シートの収まりを検証。
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "http://127.0.0.1:5173/family-tree2/";
await mkdir("screenshots", { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  ...devices["iPhone SE (3rd gen)"],
  hasTouch: true,
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// ── 1. TreeEditor でタッチドラッグによるパン ───────────────────
await page.goto(`${BASE}#/family/yamada/tree`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const beforePan = await page.evaluate(() => {
  const t = document.querySelector('div[style*="translate("]');
  return t ? t.getAttribute("style") : null;
});
console.log("pan before:", beforePan?.match(/translate\([^)]+\)/)?.[0]);

// 画面中央から右下へスワイプ
const cx = 200;
const cy = 400;
await page.touchscreen.tap(cx, cy);  // dummy warm-up
await page.waitForTimeout(50);
// Playwright の低レベル touchscreen は drag 未サポートなので dispatchEvent 経由
await page.evaluate(({ cx, cy }) => {
  const canvas = document.querySelector('div[style*="touch-action: none"]');
  const rect = canvas.getBoundingClientRect();
  const fire = (type, x, y) => {
    const touch = new Touch({
      identifier: 1,
      target: canvas,
      clientX: x,
      clientY: y,
    });
    const ev = new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      touches: type === "touchend" ? [] : [touch],
      targetTouches: type === "touchend" ? [] : [touch],
      changedTouches: [touch],
    });
    canvas.dispatchEvent(ev);
  };
  fire("touchstart", cx, cy);
  fire("touchmove", cx + 80, cy + 60);
  fire("touchmove", cx + 160, cy + 120);
  fire("touchend", cx + 160, cy + 120);
}, { cx, cy });
await page.waitForTimeout(300);

const afterPan = await page.evaluate(() => {
  const t = document.querySelector('div[style*="translate("]');
  return t ? t.getAttribute("style") : null;
});
console.log("pan after :", afterPan?.match(/translate\([^)]+\)/)?.[0]);
console.log("pan changed?", beforePan !== afterPan ? "✓ YES" : "✗ NO");
await page.screenshot({ path: "screenshots/mobile-tree-panned.png" });

// ── 2. 検索ボタンを開き、シートが viewport に収まるか ──────────
await page.goto(`${BASE}#/family/yamada/tree`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);

// 左ツールバーの ⌕ アイコンボタン
const searchBtn = page.locator('button[title="検索"]').first();
if (await searchBtn.count()) {
  await searchBtn.click();
  await page.waitForTimeout(400);
  const geo = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="検索"]');
    const sheet = input?.closest('div[style*="position:"]');
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = sheet?.getBoundingClientRect();
    return { vw, vh, sheet: r ? { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width } : null };
  });
  console.log("tree search popover:", JSON.stringify(geo));
  await page.screenshot({ path: "screenshots/mobile-tree-search.png" });
}

// ── 3. 思い出一覧画面でも検索ポップオーバー ────────────────────
await page.goto(`${BASE}#/family/yamada/memories`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);

const memSearchBtn = page.locator('button[title="検索"]').first();
if (await memSearchBtn.count()) {
  await memSearchBtn.click();
  await page.waitForTimeout(400);
  const geo2 = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="検索"]');
    const sheet = input?.closest('div[style*="position:"]');
    const vw = window.innerWidth;
    const r = sheet?.getBoundingClientRect();
    return { vw, sheet: r ? { left: r.left, right: r.right, width: r.width } : null };
  });
  console.log("memories search popover:", JSON.stringify(geo2));
  await page.screenshot({ path: "screenshots/mobile-memories-search.png" });
}

await browser.close();
console.log("done");
