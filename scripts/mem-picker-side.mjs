// 1) 編集画面の時期セレクタが YearPicker になっていること
// 2) Dashboard の左ナビに「写真」が出ない
// 3) 一覧の右側サムネイルが実写真（空のままでもプレースホルダが消えている）
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173/family-tree2/";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && console.log("[err]", m.text()));
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());

// 1) 編集画面
await page.goto(`${BASE}#/family/yamada/memory/m_rose/edit`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);

await page.screenshot({ path: "screenshots/picker-editor.png", fullPage: false });

// YearPickerのトグルボタンが存在するか
const toggleBtn = page.locator('button[aria-haspopup="listbox"]');
console.log("1) YearPicker toggle count:", await toggleBtn.count());
// クリックで展開
await toggleBtn.first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: "screenshots/picker-open.png", fullPage: false });

const opts = await page.evaluate(() => {
  return [...document.querySelectorAll('[role="option"]')]
    .slice(0, 3)
    .map((o) => o.textContent?.trim());
});
console.log("   first options:", opts);

// 1995年を選ぶ（既存 m_rose は 1995 なのでもともと選ばれているはず）
// 「1995年」を含む option をクリック
const opt = page.locator('[role="option"]', { hasText: "1995" });
if (await opt.count()) {
  await opt.first().click();
  await page.waitForTimeout(200);
}

// 保存して詳細画面で periodLabel が正しく出るか確認
await page.locator("button").filter({ hasText: /^\s*✓\s*保存\s*$/ }).click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(500);

const periodChip = await page.evaluate(() => {
  const chips = [...document.querySelectorAll("span, div")]
    .map((e) => e.textContent?.trim() ?? "")
    .filter((t) => t.includes("1995"));
  return chips.slice(0, 3);
});
console.log("   detail periodLabel candidates:", periodChip);

// 2) Dashboard
await page.goto(`${BASE}#/home`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const sideLabels = await page.evaluate(() => {
  return [...document.querySelectorAll("a div")]
    .map((d) => d.textContent?.trim())
    .filter((t) => t && t.length < 20);
});
console.log("\n2) Dashboard side labels:", sideLabels);

await page.screenshot({ path: "screenshots/dashboard-side.png", fullPage: false });

// 3) 一覧画面
await page.goto(`${BASE}#/family/yamada/memories`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const listImgs = await page.evaluate(() => {
  return [...document.querySelectorAll("img")].length;
});
console.log("\n3) memories list imgs:", listImgs);
await page.screenshot({ path: "screenshots/memories-list.png", fullPage: false });

await browser.close();
console.log("done");
