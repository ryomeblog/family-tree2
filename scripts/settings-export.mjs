// 設定画面で書き出し対象の家系を選べること・選択通りのファイルが書き出されることを確認。
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "http://127.0.0.1:5173/family-tree2/";
const tmpDir = "/tmp/ft2-settings";
await mkdir(tmpDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  acceptDownloads: true,
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

await page.goto(`${BASE}#/settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);

await page.screenshot({ path: "screenshots/settings-export.png", fullPage: false, clip: { x: 0, y: 0, width: 1280, height: 360 } });

// select の選択肢を確認
const opts = await page.evaluate(() => {
  const sel = document.querySelector("select");
  return [...(sel?.options ?? [])].map((o) => ({ value: o.value, text: o.textContent.trim() }));
});
console.log("export select options:", opts);

// 「鈴木家」を選ぶ
await page.locator("select").first().selectOption("suzuki");
await page.waitForTimeout(200);

// 書き出すボタンを押下してダウンロードを拾う
const [dl] = await Promise.all([
  page.waitForEvent("download"),
  page.getByRole("button", { name: /書き出す/ }).click(),
]);
const fn = dl.suggestedFilename();
const path = `${tmpDir}/${fn}`;
await dl.saveAs(path);
console.log("downloaded:", fn);

// ファイル名に suzuki や 鈴木 が含まれる or manifest を確認
import("node:fs/promises").then(async (fs) => {
  const buf = await fs.readFile(path);
  // JSZip で中の manifest.json を読む — 簡易チェック
  const text = buf.toString("utf8", 0, Math.min(buf.length, 200000));
  const idx = text.indexOf("鈴木家");
  console.log("zip contains 鈴木家 string:", idx >= 0);
});

await browser.close();
console.log("done");
