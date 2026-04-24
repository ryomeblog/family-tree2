// ルートガード2種の検証
// A) 未知 fid → /home にリダイレクト
// B) 思い出編集を書き手でない視聴者として開くと拒否画面
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

// A) 未知 fid
await page.goto(`${BASE}#/family/ghost123/tree`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
console.log("A) url after /family/ghost123/tree:", page.url());
console.log("   expected: ends with #/home");

await page.goto(`${BASE}#/family/ghost123/memories`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
console.log("A) url after /family/ghost123/memories:", page.url());

// B) 閲覧者（p_haruko は m_rose の viewers に含まれる）として開くと編集可
await page.goto(`${BASE}#/settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const viewerSelect = page.locator("select").last();
await viewerSelect.selectOption("p_haruko");
await page.waitForTimeout(400);

await page.goto(`${BASE}#/family/yamada/memory/m_rose/edit`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const isViewerEditor = await page.evaluate(() =>
  !![...document.querySelectorAll("input")].find((i) => i.placeholder?.includes("タイトル")),
);
console.log("B1) viewer (p_haruko) can edit:", isViewerEditor, "(expected true)");

// B') 閲覧者でも書き手でもない人で開くとガード
// p_fuji は m_rose の viewers に含まれない
await page.goto(`${BASE}#/settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await viewerSelect.selectOption("p_fuji");
await page.waitForTimeout(400);
await page.goto(`${BASE}#/family/yamada/memory/m_rose/edit`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const guardTitle = await page.evaluate(() =>
  [...document.querySelectorAll("div")]
    .map((d) => d.textContent?.trim() ?? "")
    .find((t) => t.includes("この思い出は編集できません")),
);
console.log("B2) non-viewer (p_fuji) guard title:", guardTitle ? "SHOWN" : "NOT FOUND", "(expected SHOWN)");

// B'') 書き手本人に戻したら編集可
await page.goto(`${BASE}#/settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await viewerSelect.selectOption("p_sho");
await page.waitForTimeout(400);
await page.goto(`${BASE}#/family/yamada/memory/m_rose/edit`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const isAuthorEditor = await page.evaluate(() =>
  !![...document.querySelectorAll("input")].find((i) => i.placeholder?.includes("タイトル")),
);
console.log("B3) author (p_sho) can edit:", isAuthorEditor, "(expected true)");

await browser.close();
console.log("done");
