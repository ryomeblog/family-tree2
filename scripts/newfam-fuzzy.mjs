// 新しい家系モーダルで生年月日 FuzzyDateInput がはみ出していないか確認。
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "http://127.0.0.1:5173/family-tree2/";
await mkdir("screenshots", { recursive: true });

const browser = await chromium.launch();
for (const dname of ["iPhone SE (3rd gen)", "Pixel 5", "Galaxy S9+"]) {
  const ctx = await browser.newContext({
    ...devices[dname],
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}#/new`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // モーダル内スクロール領域を直接スクロール
  await page.evaluate(() => {
    const scrollers = [...document.querySelectorAll("div")].filter((d) => {
      const cs = getComputedStyle(d);
      return cs.overflowY === "auto" && d.scrollHeight > d.clientHeight;
    });
    scrollers[0]?.scrollTo({ top: 9999 });
  });
  await page.waitForTimeout(300);

  const info = await page.evaluate(() => {
    const labels = [...document.querySelectorAll("div")].filter((d) =>
      d.textContent?.trim() === "生年月日",
    );
    const label = labels[0];
    // 「生年月日」テキストを持つ Hand の親 div の中で、
    // border + boxShadow のある「枠」divを探す
    const wrapper = label?.parentElement;
    let box = null;
    for (const c of wrapper?.children ?? []) {
      const cs = getComputedStyle(c);
      if (cs.border.includes("1px") && cs.boxShadow !== "none") {
        box = c;
        break;
      }
    }
    const r = box?.getBoundingClientRect();
    return {
      vw: window.innerWidth,
      box: r ? { left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) } : null,
    };
  });
  const overflow = info.box ? info.box.right - info.vw : null;
  console.log(
    `${dname.padEnd(22)} vw=${info.vw} box=${JSON.stringify(info.box)} overflow=${overflow}`,
  );
  await page.screenshot({ path: `screenshots/newfam-fuzzy-${dname.replace(/\W+/g, "_")}.png` });
  await ctx.close();
}
await browser.close();
console.log("done");
