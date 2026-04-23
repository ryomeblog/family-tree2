import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "screenshots";
const BASE = "http://127.0.0.1:5173/family-tree2/";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  acceptDownloads: true,
});
const page = await ctx.newPage();
page.on("console", (m) => console.log("[console]", m.type(), m.text().slice(0, 200)));
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.goto(`${BASE}#/family/yamada/tree`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);

// Find the 画像を保存 button
const btn = page.locator("text=画像を保存").first();
console.log("button count:", await page.locator("text=画像を保存").count());

const downloadPromise = page.waitForEvent("download", { timeout: 20000 }).catch((e) => {
  console.log("no download fired:", e.message);
  return null;
});
await btn.click();
const download = await downloadPromise;
if (download) {
  const savePath = `${OUT}/exported-tree.png`;
  await download.saveAs(savePath);
  console.log("saved:", savePath);
} else {
  console.log("export did not fire a download");
}
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/tree-viewport.png` });
await browser.close();
