// モバイルで：
//  1) 全体図（ミニマップ）が非表示
//  2) 検索シートがズームコントロール（右下）に被らない
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

await page.goto(`${BASE}#/family/yamada/tree`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);

// 1) 全体図が表示されていないこと
const miniMap = await page.evaluate(() => {
  const el = [...document.querySelectorAll("div")].find((d) =>
    d.textContent?.trim().startsWith("全体図"),
  );
  return el ? "present" : "absent";
});
console.log("1) MiniMap on mobile:", miniMap, "(expected: absent)");
await page.screenshot({ path: "screenshots/mobile-tree-no-minimap.png" });

// 2) 検索を開いて、検索シートの bottom とズーム button の top を比較
await page.locator('button[title="検索"]').first().click();
await page.waitForTimeout(400);

const geo = await page.evaluate(() => {
  const input = document.querySelector('input[placeholder*="検索"]');
  const sheet = input?.closest('div[style*="position:"]');
  const sheetRect = sheet?.getBoundingClientRect();

  // ズームコントロールは右下 fixed absolute で + − ボタンを内包。
  // ＋ ボタンを探す。
  const zoomBtns = [...document.querySelectorAll("button")].filter((b) => b.textContent?.trim() === "＋" || b.textContent?.trim() === "−");
  const zoomRects = zoomBtns.map((b) => b.getBoundingClientRect()).filter((r) => r.width > 0);

  return {
    vh: window.innerHeight,
    sheet: sheetRect ? { top: sheetRect.top, bottom: sheetRect.bottom, height: sheetRect.height } : null,
    zoom: zoomRects.map((r) => ({ top: Math.round(r.top), bottom: Math.round(r.bottom) })),
  };
});
console.log("2) sheet & zoom:", JSON.stringify(geo, null, 2));

// シート bottom がズーム top より上（小さい値）である = 被らない
const sheetBottom = geo.sheet?.bottom ?? 0;
const zoomTop = Math.min(...geo.zoom.map((r) => r.top));
console.log(
  `   sheet.bottom(${sheetBottom}) vs zoom.top(${zoomTop}): `,
  sheetBottom < zoomTop ? "✓ NO OVERLAP" : "✗ OVERLAP",
);

await page.screenshot({ path: "screenshots/mobile-tree-search-v2.png" });

await browser.close();
console.log("done");
