// モバイル幅（iPhone 14 相当 390×844）で主要画面が破綻していないかを撮影。
// レイアウトチェックの最低ライン：横スクロールが出ていないこと、ヘッダボタンが見えること。
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173/family-tree2/";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const pages = [
  { name: "01-home", url: "#/home" },
  { name: "02-tree", url: "#/family/yamada/tree" },
  { name: "03-memories", url: "#/family/yamada/memories" },
  { name: "04-memory-detail", url: "#/family/yamada/memory/m_rose" },
  { name: "05-memory-editor", url: "#/family/yamada/memory/m_rose/edit" },
  { name: "06-person", url: "#/family/yamada/person/p_haruko" },
  { name: "07-settings", url: "#/settings" },
  { name: "08-new-family", url: "#/new" },
];

for (const p of pages) {
  await page.goto(BASE + p.url, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const overflow = await page.evaluate(() => {
    const scrollX = document.documentElement.scrollWidth;
    const clientX = document.documentElement.clientWidth;
    return { scrollX, clientX, overflow: scrollX - clientX };
  });
  console.log(p.name.padEnd(22), "overflowX =", overflow.overflow, "(scroll", overflow.scrollX, "client", overflow.clientX, ")");
  await page.screenshot({ path: `screenshots/mobile-${p.name}.png`, fullPage: false });
}

await browser.close();
console.log("done");
