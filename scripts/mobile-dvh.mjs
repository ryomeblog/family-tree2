// dvh 対応の動作確認：Android Chrome で下部アドレスバーが出ている状態を想定し、
// viewport 高さを小さく設定してページ下端の UI が見える／触れるかチェック。
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "http://127.0.0.1:5173/family-tree2/";
await mkdir("screenshots", { recursive: true });

const browser = await chromium.launch();

// Android Pixel 5 の「アドレスバー + ナビゲーションバー分」を引いた viewport を模擬。
// 通常 viewport 851, アドレスバー表示時は 727 程度。ここでは 620 にして検証。
const ctx = await browser.newContext({
  ...devices["Pixel 5"],
  viewport: { width: 393, height: 620 },
  hasTouch: true,
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

// 人物詳細 → 「この人物を削除」ボタンが画面下端に見えるか
await page.goto(`${BASE}#/family/yamada/person/p_sho`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);

const appH = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement).getPropertyValue("--app-h");
  return s;
});
console.log("computed --app-h:", appH);

const bodyH = await page.evaluate(() => {
  // ページ全体の可視領域高さ
  return {
    innerHeight: window.innerHeight,
    documentClientHeight: document.documentElement.clientHeight,
    rootHeight: document.getElementById("root")?.clientHeight ?? 0,
  };
});
console.log("heights:", bodyH);

// 人物編集ページ → 削除ボタンの可視性
await page.goto(`${BASE}#/family/yamada/person/p_sho/edit`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
const deleteBtn = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button, a")].filter((b) =>
    b.textContent?.includes("この人物を削除"),
  );
  if (!btns.length) return { found: false };
  const r = btns[0].getBoundingClientRect();
  return {
    found: true,
    top: Math.round(r.top),
    bottom: Math.round(r.bottom),
    vh: window.innerHeight,
    visible: r.bottom <= window.innerHeight && r.top >= 0,
  };
});
console.log("delete-button:", deleteBtn);

await page.screenshot({ path: "screenshots/mobile-dvh-edit.png" });

await browser.close();
console.log("done");
