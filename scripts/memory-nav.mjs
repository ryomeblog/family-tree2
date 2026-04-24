// 思い出の前後ナビを検証：リンク遷移・スクロール復帰・矢印キー。
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173/family-tree2/";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && console.log("[err]", m.text()));
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.goto(`${BASE}#/family/yamada/memory/m_rose`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

const getTitle = () =>
  page.evaluate(() => {
    const el = [...document.querySelectorAll("div")].find((d) => {
      const s = d.getAttribute("style") || "";
      return s.includes("font-size:44px") || s.includes("font-size: 44px");
    });
    return el?.textContent?.trim() ?? null;
  });

const getScroll = () =>
  page.evaluate(() => {
    const scrollers = [...document.querySelectorAll("div")].filter((d) => {
      const cs = getComputedStyle(d);
      return cs.overflowY === "auto" && d.scrollHeight > d.clientHeight;
    });
    return scrollers[0]?.scrollTop ?? 0;
  });

console.log("initial:", await getTitle());

// 下までスクロール
await page.evaluate(() => {
  const scrollers = [...document.querySelectorAll("div")].filter((d) => {
    const cs = getComputedStyle(d);
    return cs.overflowY === "auto" && d.scrollHeight > d.clientHeight;
  });
  scrollers[0]?.scrollTo({ top: 9999 });
});
await page.waitForTimeout(200);
console.log("scroll before nav:", await getScroll());

// 前へ（リンク）
const prevLink = page.locator("a").filter({ hasText: /前へ/ });
await prevLink.first().click();
await page.waitForTimeout(500);
console.log("after 前へ:", await getTitle(), "scroll=", await getScroll(), "url=", page.url());

// 矢印キーで次へ
await page.keyboard.press("ArrowRight");
await page.waitForTimeout(500);
console.log("after → key:", await getTitle(), "scroll=", await getScroll(), "url=", page.url());

await page.keyboard.press("ArrowRight");
await page.waitForTimeout(500);
console.log("after → key #2:", await getTitle(), "url=", page.url());

// → 押下で末尾。さらに → で動かないはず
await page.keyboard.press("ArrowRight");
await page.waitForTimeout(300);
console.log("after → at last:", await getTitle(), "url=", page.url());

// ← 押下で戻る
await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(500);
console.log("after ← key:", await getTitle(), "url=", page.url());

await page.screenshot({ path: "screenshots/nav-final.png", fullPage: false });
await browser.close();
console.log("done");
