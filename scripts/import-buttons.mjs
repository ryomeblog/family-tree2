// 取り込みプレビュー画面の下部ボタンレイアウトをモバイルで確認
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "http://127.0.0.1:5173/family-tree2/";
await mkdir("screenshots", { recursive: true });

// 最小 ZIP の .ftree2 を作る
const tmpDir = "/tmp/ft2-import-buttons";
await mkdir(tmpDir, { recursive: true });

const browser = await chromium.launch();
const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
const dPage = await desktopCtx.newPage();
await dPage.goto(BASE, { waitUntil: "networkidle" });
await dPage.evaluate(() => localStorage.clear());
await dPage.goto(`${BASE}#/family/yamada/tree`, { waitUntil: "networkidle" });
await dPage.waitForTimeout(700);
await dPage.locator("button").filter({ hasText: /山田家/ }).first().click();
await dPage.waitForTimeout(300);
const [download] = await Promise.all([
  dPage.waitForEvent("download"),
  dPage.locator("button, a").filter({ hasText: /この家系を書き出す/ }).first().click(),
]);
const dlPath = `${tmpDir}/yamada.ftree2`;
await download.saveAs(dlPath);
await desktopCtx.close();
console.log("created .ftree2");

// 各モバイル幅で取り込み画面を開いて、選択 → プレビュー → ボタン確認
for (const dname of ["iPhone SE (3rd gen)", "Pixel 5", "Galaxy S9+"]) {
  const ctx = await browser.newContext({ ...devices[dname], hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}#/import`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);

  const cp = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /ファイルを選ぶ/ }).click();
  const ch = await cp;
  await ch.setFiles([dlPath]);
  await page.waitForTimeout(800);

  // 下部までスクロール
  await page.evaluate(() => {
    const ss = [...document.querySelectorAll("div")].filter((d) => {
      const cs = getComputedStyle(d);
      return cs.overflowY === "auto" && d.scrollHeight > d.clientHeight;
    });
    ss[0]?.scrollTo({ top: 9999 });
  });
  await page.waitForTimeout(300);

  // 各ボタンの位置と viewport との関係
  const info = await page.evaluate(() => {
    const titles = ["← ファイルを選び直す", "キャンセル", "取り込む"];
    const results = [];
    for (const t of titles) {
      const el = [...document.querySelectorAll("a, button")].find((b) => b.textContent?.trim().includes(t));
      if (!el) {
        results.push({ t, found: false });
        continue;
      }
      const r = el.getBoundingClientRect();
      results.push({
        t,
        x: Math.round(r.x),
        right: Math.round(r.right),
        w: Math.round(r.width),
        offscreen: r.right > window.innerWidth + 1 || r.left < -1,
      });
    }
    return { vw: window.innerWidth, results };
  });
  console.log(`\n=== ${dname} (vw=${info.vw}) ===`);
  for (const r of info.results) {
    console.log(`  ${r.t.padEnd(22)} ${r.found === false ? "NOT FOUND" : `x=${r.x} right=${r.right} w=${r.w}${r.offscreen ? " ⚠" : ""}`}`);
  }
  await page.screenshot({ path: `screenshots/import-buttons-${dname.replace(/\W+/g, "_")}.png` });
  await ctx.close();
}

await browser.close();
console.log("\ndone");
