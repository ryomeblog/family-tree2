// 別家系として追加：既存 yamada と同じ id の .ftree2 を取り込んでも、
// 既存が上書きされず yamada と yamada_2 の 2 つに増えることを確認。
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "http://127.0.0.1:5173/family-tree2/";
const tmpDir = "/tmp/ft2-dedup";
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
// 再ロードしてシード永続化を待つ
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// 初期家系を確認（yamada / suzuki / sato が seed）
const before = await page.evaluate(() => Object.keys(JSON.parse(JSON.parse(localStorage.getItem("ft2.state.v1.b") || localStorage.getItem("ft2.state.v1.a")).payload).state.families));
console.log("families before:", before);

// yamada を書き出し
await page.goto(`${BASE}#/family/yamada/tree`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.locator("button").filter({ hasText: /山田家/ }).first().click();
await page.waitForTimeout(300);
const [dl] = await Promise.all([
  page.waitForEvent("download"),
  page.locator("button, a").filter({ hasText: /この家系を書き出す/ }).first().click(),
]);
const dlPath = `${tmpDir}/yamada.ftree2`;
await dl.saveAs(dlPath);
console.log("exported yamada");

// 取り込み画面で「別家系として追加」モード（デフォルト）で取り込み
await page.goto(`${BASE}#/import`, { waitUntil: "networkidle" });
await page.waitForTimeout(300);
const chPromise = page.waitForEvent("filechooser");
await page.getByRole("button", { name: /ファイルを選ぶ/ }).click();
const ch = await chPromise;
await ch.setFiles([dlPath]);
await page.waitForTimeout(800);

// ラジオが「別の家系として追加」が選択されているか確認
const mode = await page.evaluate(() => {
  const r = document.querySelectorAll('input[type="radio"]');
  return [...r].map((x) => ({ checked: x.checked, label: x.parentElement?.textContent?.trim() }));
});
console.log("radios:", mode);

await page.getByRole("button", { name: /取り込む/ }).click();
await page.waitForTimeout(1000);

// 結果：families に yamada と yamada_2 が存在するはず
const after = await page.evaluate(() => {
  const slots = ["ft2.state.v1.a", "ft2.state.v1.b"];
  let latest = null;
  let latestSeq = -1;
  for (const k of slots) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    const p = JSON.parse(raw);
    if (p.seq > latestSeq) { latestSeq = p.seq; latest = p; }
  }
  const s = JSON.parse(latest.payload).state;
  return {
    familyIds: Object.keys(s.families),
    activeId: s.activeFamilyId,
    url: location.hash,
  };
});
console.log("after import:", after);

// 元の yamada がまだ存在することを確認し、yamada_2 の人物数が yamada と同じになっているか
const diff = await page.evaluate(() => {
  const slots = ["ft2.state.v1.a", "ft2.state.v1.b"];
  let latest = null;
  let latestSeq = -1;
  for (const k of slots) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    const p = JSON.parse(raw);
    if (p.seq > latestSeq) { latestSeq = p.seq; latest = p; }
  }
  const s = JSON.parse(latest.payload).state;
  const out = {};
  for (const id of Object.keys(s.families)) {
    out[id] = { people: Object.keys(s.families[id].people).length, memories: Object.keys(s.families[id].memories).length };
  }
  return out;
});
console.log("family contents:", diff);

await page.screenshot({ path: "screenshots/import-dedup.png", fullPage: false });
await browser.close();
console.log("done");
