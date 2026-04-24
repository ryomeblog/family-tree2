// 3点検証:
// 1) 人物追加画面のヘッダが現在の家系を表示する（別家系を開くと familyName が追従）
// 2) 思い出ノート一覧に「家系図」ボタンがあり tree に遷移する
// 3) tree editor → 編集 → ✕／← で tree に戻る（以前は person 詳細に行っていた）
//    person 詳細 → 編集 → ✕ で person 詳細に戻る
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173/family-tree2/";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

// ── 1. 人物追加画面のヘッダが現在の家系（鈴木家）を表示するか ──
await page.goto(`${BASE}#/family/suzuki/person/new`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: "screenshots/header-person-new.png", fullPage: false, clip: { x: 0, y: 0, width: 800, height: 80 } });
const dump = await page.evaluate(() => {
  const hdr = document.querySelector("div[class], body > div > div");
  const nodes = [...document.querySelectorAll("*")].slice(0, 30);
  return [...document.querySelectorAll("div")]
    .filter((d) => /鈴木|山田/.test(d.textContent ?? ""))
    .slice(0, 5)
    .map((d) => ({
      fontSize: getComputedStyle(d).fontSize,
      text: d.textContent?.trim().slice(0, 30),
    }));
});
console.log("debug dump:", dump);
const famName1 = await page.evaluate(() => {
  // 17px mincho の Title (AppHeader の familyName 部分)
  const els = [...document.querySelectorAll("div")];
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.fontSize === "17px" && /家/.test(el.textContent ?? "")) {
      return el.textContent?.trim();
    }
  }
  return null;
});
console.log("1) person/new header family name:", famName1, "(expected: 鈴木家)");

// 編集画面も（yamada/person/p_sho）
await page.goto(`${BASE}#/family/suzuki/person/p_ichiro/edit`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const famName2 = await page.evaluate(() => {
  const els = [...document.querySelectorAll("div")];
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.fontSize === "17px" && /家/.test(el.textContent ?? "")) {
      return el.textContent?.trim();
    }
  }
  return null;
});
console.log("1) person/edit header family name:", famName2, "(expected: 鈴木家)");

// ── 2. 思い出ノート一覧の 家系図 ボタン ──
await page.goto(`${BASE}#/family/yamada/memories`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const treeBtn = page.locator("a, button").filter({ hasText: /^家家系図$|家系図$/ });
const count = await treeBtn.count();
console.log("2) memories 家系図 btn count:", count);
if (count > 0) {
  await treeBtn.first().click();
  await page.waitForTimeout(400);
  console.log("2) url after click:", page.url());
}

// ── 3a. tree → 編集 → 戻ると tree ──
// ツリー画面を開いたあと、インスペクタの「編集」リンクと同等の URL へ Link 経由で遷移する。
await page.goto(`${BASE}#/family/yamada/tree`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
// SPA 内の Link で遷移させるため、JS で navigate
await page.evaluate(() => {
  location.hash = "#/family/yamada/person/p_sho/edit";
});
await page.waitForTimeout(600);
console.log("3a) at edit url:", page.url());
await page.locator('button[aria-label="戻る"]').first().click();
await page.waitForTimeout(500);
console.log("3a) after ← url:", page.url(), "(expected /tree)");

// ── 3b. person 詳細 → 編集 → 戻ると person 詳細 ──
await page.goto(`${BASE}#/family/yamada/person/p_sho`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const edit2 = page.locator("a, button").filter({ hasText: /編集/ });
if (await edit2.count()) {
  await edit2.first().click();
  await page.waitForTimeout(500);
  console.log("3b) after 編集 click url:", page.url());
  await page.locator('button[aria-label="戻る"]').first().click();
  await page.waitForTimeout(500);
  console.log("3b) after ← url:", page.url(), "(expected /person/p_sho)");
}

// 3c. person 詳細 → 編集 → ✕（キャンセル）で戻ると person 詳細
await page.goto(`${BASE}#/family/yamada/person/p_sho`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await edit2.first().click();
await page.waitForTimeout(500);
// フォーム上部の × ボタン
const xBtn = page.locator("button", { hasText: /^×$/ });
if (await xBtn.count()) {
  await xBtn.first().click();
  await page.waitForTimeout(400);
  console.log("3c) after × url:", page.url(), "(expected /person/p_sho)");
}

await browser.close();
console.log("done");
