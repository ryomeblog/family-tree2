// 3つの検証:
//  A) 詳細画面下部の前/次カードがクリック遷移
//  B) 家系メニューから他家系を選ぶと同種ページに留まる（memories→memories）
//  C) 家系図の画像を保存の左に 思い出ノート ボタンがあり、クリックで遷移
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173/family-tree2/";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && console.log("[err]", m.text()));
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());

// ── A ───────────────────────────────────────────
await page.goto(`${BASE}#/family/yamada/memory/m_rose`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

// 下までスクロール
await page.evaluate(() => {
  const s = [...document.querySelectorAll("div")].find((d) => {
    const cs = getComputedStyle(d);
    return cs.overflowY === "auto" && d.scrollHeight > d.clientHeight;
  });
  s?.scrollTo({ top: 9999 });
});
await page.waitForTimeout(300);
await page.screenshot({ path: "screenshots/navA-before.png", fullPage: false });

// 「前の思い出」リンクを探す
const prevCard = page.locator('a[title*="結婚式"], a[href*="m_wedding"]');
console.log("A. prev card count:", await prevCard.count());
await prevCard.first().click();
await page.waitForTimeout(600);
console.log("A. url after prev card click:", page.url());

// 次の思い出カードで戻る
const nextCard = page.locator('a[title*="春の花"], a[href*="m_rose"]').filter({ hasText: /春の花/ });
if (await nextCard.count()) {
  await nextCard.first().click();
  await page.waitForTimeout(600);
  console.log("A. url after next card click:", page.url());
}

// ── B ───────────────────────────────────────────
await page.goto(`${BASE}#/family/yamada/memories`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
console.log("\nB. start:", page.url());

// ヘッダの家系名をクリックして切替ドロップダウンを開く
await page.locator("button").filter({ hasText: /山田家/ }).first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: "screenshots/navB-dropdown.png", fullPage: false });

// 鈴木家へ切替
const sw = page.locator("button, a").filter({ hasText: /鈴木家/ });
console.log("B. 鈴木家 count:", await sw.count());
await sw.first().click();
await page.waitForTimeout(700);
console.log("B. url after switch from memories:", page.url());

// 次：tree ページ上で切替すると tree に留まるか
await page.goto(`${BASE}#/family/suzuki/tree`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.locator("button").filter({ hasText: /鈴木家/ }).first().click();
await page.waitForTimeout(300);
const sw2 = page.locator("button, a").filter({ hasText: /山田家/ });
await sw2.first().click();
await page.waitForTimeout(700);
console.log("B. url after switch from tree:", page.url());

// ── C ───────────────────────────────────────────
await page.goto(`${BASE}#/family/yamada/tree`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: "screenshots/navC-tree-header.png", fullPage: false, clip: { x: 0, y: 0, width: 1280, height: 80 } });

const headerBtns = await page.evaluate(() => {
  const header = document.querySelector("header");
  if (!header) return [];
  return [...header.querySelectorAll("a, button, span")].map((el) => ({
    tag: el.tagName,
    text: el.textContent?.trim().slice(0, 20),
    href: el.getAttribute("href"),
  })).filter((e) => e.text);
});
console.log("C. header buttons:", headerBtns);

// 思い出ノート リンクをクリック
const memBtn = page.locator("a, button").filter({ hasText: /思い出ノート/ });
console.log("C. 思い出ノート count:", await memBtn.count());
if (await memBtn.count()) {
  await memBtn.first().click();
  await page.waitForTimeout(500);
  console.log("C. url after 思い出ノート click:", page.url());
}

await browser.close();
console.log("\ndone");
