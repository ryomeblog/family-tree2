// 新しい家系モーダルで生年月日（和暦: 平成5年7月23日）を入力して保存、
// ルート人物の birth が { kind: "era", era: "平成", year: 5, m: 7, d: 23 } になるか確認。
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173/family-tree2/";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

// 新規家系モーダル
await page.goto(`${BASE}#/new`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: "screenshots/newfam-modal.png", fullPage: false });

// 家系名・姓名を入力
await page.locator('input[placeholder*="山田家"]').fill("テスト家");
await page.locator('input[placeholder="山田"]').fill("試験");
await page.locator('input[placeholder="翔"]').fill("太郎");

// FuzzyDateInput: 「和暦」モードに切替
await page.getByRole("button", { name: "和暦", exact: true }).click();
await page.waitForTimeout(100);

// 元号 select を「平成」に
await page.locator("select").filter({ hasText: /昭和|平成|令和/ }).selectOption("平成");
// 年・月・日を入力
await page.locator('input[placeholder="年"]').fill("5");
await page.locator('input[placeholder="月"]').fill("7");
await page.locator('input[placeholder="日"]').fill("23");
await page.waitForTimeout(200);

// プレビュー確認
const preview = await page.evaluate(() =>
  [...document.querySelectorAll("span, div")]
    .map((el) => el.textContent?.trim())
    .filter((t) => t?.startsWith("= "))
    .slice(0, 3),
);
console.log("preview:", preview);

await page.screenshot({ path: "screenshots/newfam-filled.png", fullPage: false });

// 保存
await page.getByRole("button", { name: /家系を作成/ }).click();
await page.waitForTimeout(800);
console.log("url:", page.url());

// localStorage からルート人物の birth を読む
const root = await page.evaluate(() => {
  const slots = ["ft2.state.v1.a", "ft2.state.v1.b"];
  let latest = null, latestSeq = -1;
  for (const k of slots) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    const p = JSON.parse(raw);
    if (p.seq > latestSeq) { latestSeq = p.seq; latest = p; }
  }
  const s = JSON.parse(latest.payload).state;
  const fid = Object.keys(s.families).find((id) => s.families[id].name === "テスト家");
  const fam = s.families[fid];
  const root = fam.people[fam.rootPersonId];
  return {
    fid,
    rootName: root.surname + root.given,
    birth: root.birth,
    birthPlace: root.birthPlace,
  };
});
console.log("root person:", root);

await browser.close();
console.log("done");
