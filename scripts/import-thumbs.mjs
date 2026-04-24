// 取り込みプレビューに実写真が出るか確認：
// 1) 思い出を開いて 3 枚の写真をアップロード → 保存
// 2) その家系を書き出して .ftree2 を取得
// 3) 取り込み画面でそのファイルを選択
// 4) プレビューエリアに img が少なくとも 1 枚存在
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const BASE = "http://127.0.0.1:5173/family-tree2/";
await mkdir("screenshots", { recursive: true });

const tmpDir = "/tmp/ft2-imp";
await mkdir(tmpDir, { recursive: true });
// 小さな PNG を生成
const makePng = (r, g, b) => {
  const crc32Table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc32Table[n] = c >>> 0;
  }
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crc32Table[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const u32 = (v) => Uint8Array.of((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255);
  const chunk = (type, data) => {
    const t = new TextEncoder().encode(type);
    const td = new Uint8Array(t.length + data.length);
    td.set(t); td.set(data, t.length);
    const crc = crc32(td);
    const out = new Uint8Array(4 + t.length + data.length + 4);
    out.set(u32(data.length)); out.set(td, 4); out.set(u32(crc), 4 + td.length);
    return out;
  };
  const w = 60, h = 40;
  const ihdr = new Uint8Array(13);
  ihdr.set(u32(w)); ihdr.set(u32(h), 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const row = new Uint8Array(1 + w * 3);
  for (let x = 0; x < w; x++) { row[1 + x * 3] = r; row[2 + x * 3] = g; row[3 + x * 3] = b; }
  const raw = new Uint8Array(row.length * h);
  for (let y = 0; y < h; y++) raw.set(row, y * row.length);
  const deflate = (input) => {
    const out = [0x78, 0x01];
    let pos = 0;
    while (pos < input.length) {
      const len = Math.min(65535, input.length - pos);
      const last = pos + len >= input.length ? 1 : 0;
      out.push(last, len & 255, (len >>> 8) & 255, ~len & 255, (~len >>> 8) & 255);
      for (let i = 0; i < len; i++) out.push(input[pos + i]);
      pos += len;
    }
    let a = 1, bb = 0;
    for (const byte of input) { a = (a + byte) % 65521; bb = (bb + a) % 65521; }
    out.push((bb >>> 8) & 255, bb & 255, (a >>> 8) & 255, a & 255);
    return new Uint8Array(out);
  };
  const idat = chunk("IDAT", deflate(raw));
  const iend = chunk("IEND", new Uint8Array(0));
  const ihdrChunk = chunk("IHDR", ihdr);
  const sig = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
  const out = new Uint8Array(sig.length + ihdrChunk.length + idat.length + iend.length);
  out.set(sig);
  out.set(ihdrChunk, sig.length);
  out.set(idat, sig.length + ihdrChunk.length);
  out.set(iend, sig.length + ihdrChunk.length + idat.length);
  return out;
};
await writeFile(`${tmpDir}/a.png`, makePng(220, 40, 40));
await writeFile(`${tmpDir}/b.png`, makePng(40, 80, 220));
await writeFile(`${tmpDir}/c.png`, makePng(40, 180, 80));

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  acceptDownloads: true,
});
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && console.log("[err]", m.text()));
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());

// 1) 思い出編集で写真 3 枚アップして保存
await page.goto(`${BASE}#/family/yamada/memory/m_rose/edit`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
page.once("filechooser", async (chooser) => {
  await chooser.setFiles([`${tmpDir}/a.png`, `${tmpDir}/b.png`, `${tmpDir}/c.png`]);
});
await page.getByRole("button", { name: /追加/ }).first().click();
await page.waitForTimeout(1200);
await page.locator("button").filter({ hasText: /^\s*✓\s*保存\s*$/ }).click();
await page.waitForTimeout(800);

// 2) 家系書き出し — 設定画面から「書き出し」 or FamilyMenuDropdown から
await page.goto(`${BASE}#/family/yamada/tree`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
// ヘッダの家系メニューを開く
await page.locator("button").filter({ hasText: /山田家/ }).first().click();
await page.waitForTimeout(400);
const exportBtn = page.locator("button, a").filter({ hasText: /この家系を書き出す/ });
const [download] = await Promise.all([
  page.waitForEvent("download"),
  exportBtn.first().click(),
]);
const dlPath = `${tmpDir}/yamada.ftree2`;
await download.saveAs(dlPath);
console.log("exported to", dlPath);

// 3) 取り込み画面
// 新しいページに localStorage をクリアして取り込んでも問題ないが、既存と同 fid をマージ挙動に。
await page.goto(`${BASE}#/import`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
// ファイル選択
const chooserPromise = page.waitForEvent("filechooser");
await page.getByRole("button", { name: /ファイルを選ぶ/ }).click();
const chooser = await chooserPromise;
await chooser.setFiles([dlPath]);
await page.waitForTimeout(1200);

await page.screenshot({ path: "screenshots/import-preview.png", fullPage: false });

// 4) プレビューに img が出ているか
const imgs = await page.evaluate(() =>
  [...document.querySelectorAll("img")].map((i) => ({
    src: i.currentSrc.slice(0, 30),
    w: i.width,
    h: i.height,
  })),
);
console.log("preview imgs:", imgs);

await browser.close();
console.log("done");
