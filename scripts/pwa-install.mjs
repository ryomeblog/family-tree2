// Settings 「ホーム画面に追加（PWA）」行の 3 状態を確認：
// 1) デスクトップ（beforeinstallprompt 未発火）→ "プロンプト待機中" + ヒント
// 2) iOS Safari UA → "手順を見る" ボタン + クリックで手順展開
// 3) display-mode: standalone（インストール済み扱い）→ "✓ インストール済み"
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173/family-tree2/";
const browser = await chromium.launch();

// シナリオ 1: 素のデスクトップ
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}#/settings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const row = await page.evaluate(() => {
    const label = [...document.querySelectorAll("*")].find((e) => e.textContent?.trim() === "ホーム画面に追加（PWA）");
    const container = label?.closest("div[style]")?.parentElement;
    return container?.textContent?.trim().slice(0, 200) ?? null;
  });
  console.log("1) desktop row text:", row);
  await page.screenshot({ path: "screenshots/pwa-desktop.png", clip: { x: 0, y: 0, width: 1280, height: 600 } });
  await ctx.close();
}

// シナリオ 2: iOS Safari UA
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}#/settings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const btn = page.locator("button, a").filter({ hasText: /手順を見る/ });
  const btnCount = await btn.count();
  console.log("2) iOS: 手順を見る button count:", btnCount);
  if (btnCount > 0) {
    await btn.first().click();
    await page.waitForTimeout(400);
    const steps = await page.evaluate(() => {
      const ol = document.querySelector("ol");
      return ol ? [...ol.querySelectorAll("li")].map((l) => l.textContent?.trim()) : [];
    });
    console.log("2) iOS steps:", steps);
    await page.screenshot({ path: "screenshots/pwa-ios.png" });
  }
  await ctx.close();
}

// シナリオ 3: display-mode: standalone を発火させる
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // matchMedia の差し替えは goto 前に init script として登録する必要がある
  await ctx.addInitScript(() => {
    const orig = window.matchMedia;
    window.matchMedia = function (q) {
      if (typeof q === "string" && q.includes("standalone")) {
        return {
          matches: true,
          media: q,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          onchange: null,
          dispatchEvent: () => false,
        };
      }
      return orig.call(window, q);
    };
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}#/settings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const installed = await page.evaluate(() =>
    !![...document.querySelectorAll("*")].find((e) =>
      e.textContent?.trim() === "✓ インストール済み",
    ),
  );
  console.log("3) standalone: shows ✓ インストール済み:", installed);
  await page.screenshot({ path: "screenshots/pwa-standalone.png", clip: { x: 0, y: 0, width: 1280, height: 600 } });
  await ctx.close();
}

await browser.close();
console.log("done");
