import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "screenshots";
const BASE = "http://127.0.0.1:5173/family-tree2/";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("[browser.error]", msg.text());
});
async function snap(name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`snapped ${name}`);
}

// Wipe localStorage before each run so the test is deterministic.
await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());

// ── 1. Yamada tree (baseline, after a page reload that seeds sample data)
await page.goto(`${BASE}#/family/yamada/tree`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await snap("01-yamada-tree");

// ── 2. Create Ishii family
await page.goto(`${BASE}#/new`, { waitUntil: "networkidle" });
await page.waitForTimeout(300);

const inputs = page.locator("input[type=text], input:not([type])");
await inputs.nth(0).fill("石井家");
await inputs.nth(1).fill("石井");
await inputs.nth(2).fill("一郎");
await inputs.nth(3).fill("私");
await inputs.nth(4).fill("1990年");
await inputs.nth(5).fill("");
await page.getByRole("button", { name: /家系を作成/ }).click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(500);
await snap("02-ishii-after-create");

// Parse fid
const url = page.url();
const fidMatch = url.match(/#\/family\/([^/]+)\//);
const ishiiFid = fidMatch[1];

// Root person id
const rootPid = await page.evaluate((fid) => {
  const slots = ["ft2.state.v1.a", "ft2.state.v1.b"];
  for (const k of slots) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const payload = JSON.parse(raw).payload;
      const state = JSON.parse(payload).state;
      const fam = state.families[fid];
      return fam?.rootPersonId;
    } catch {}
  }
  return null;
}, ishiiFid);

// ── 3. Open relate page with source = root, click 親 card
await page.goto(`${BASE}#/family/${ishiiFid}/relate?pid=${rootPid}`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(400);

// Click the 親 relation-kind button (it's a button containing "親" and "父母 2 人をまとめて登録")
await page.locator('button:has-text("父母 2 人をまとめて登録")').click();
await page.waitForTimeout(300);
await snap("03-ishii-parent-flow-ready");

// Fill new persons for 親 1 and 親 2
// Expected: 4 inputs (2 drafts × [姓, 名])
const allInputs = page.locator("input:not([type=radio]):not([type=checkbox]):not([type=button])");
const count = await allInputs.count();
console.log("inputs in parent flow:", count);
for (let i = 0; i < count; i++) {
  const ph = await allInputs.nth(i).getAttribute("placeholder");
  console.log(`  input[${i}] ph="${ph}"`);
}

// Parent 1: 石井 太郎
await allInputs.nth(0).fill("石井");
await allInputs.nth(1).fill("太郎");
// Parent 2: 石井 花子
await allInputs.nth(2).fill("石井");
await allInputs.nth(3).fill("花子");

await snap("04-ishii-parent-filled");

// Click 親を登録
await page.getByRole("button", { name: /親を登録/ }).click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(700);
await snap("05-ishii-tree-after-parents");

// Also dump store state for inspection
const dump = await page.evaluate((fid) => {
  const slots = ["ft2.state.v1.a", "ft2.state.v1.b"];
  let best = null;
  let bestSeq = -1;
  for (const k of slots) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.seq > bestSeq) {
        bestSeq = parsed.seq;
        best = parsed.payload;
      }
    } catch {}
  }
  if (!best) return null;
  const state = JSON.parse(best).state;
  const fam = state.families[fid];
  return fam;
}, ishiiFid);
console.log("ishii family after:", JSON.stringify(dump, null, 2));

await browser.close();
console.log("done");
