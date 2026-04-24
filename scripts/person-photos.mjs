// 人物詳細画面の「写真の記録」が実写真を表示するか確認：
// 1) m_rose に 3枚、m_wedding に 2枚を追加（どちらも主人公/関連に p_haruko）
// 2) /family/yamada/person/p_haruko の 写真の記録 に img が出る＋クリックで lightbox
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const BASE = "http://127.0.0.1:5173/family-tree2/";
const tmpDir = "/tmp/ft2-ppix";
await mkdir(tmpDir, { recursive: true });
await mkdir("screenshots", { recursive: true });

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
for (const [name, c] of [["a", [220, 40, 40]], ["b", [40, 80, 220]], ["c", [40, 180, 80]]]) {
  await writeFile(`${tmpDir}/${name}.png`, makePng(...c));
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// m_rose(主人公 p_haruko) に 3 枚追加
await page.goto(`${BASE}#/family/yamada/memory/m_rose/edit`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
page.once("filechooser", async (c) => {
  await c.setFiles([`${tmpDir}/a.png`, `${tmpDir}/b.png`, `${tmpDir}/c.png`]);
});
await page.getByRole("button", { name: /追加/ }).first().click();
await page.waitForTimeout(1200);
await page.locator("button").filter({ hasText: /^\s*✓\s*保存\s*$/ }).click();
await page.waitForTimeout(700);

// 人物詳細ページ
await page.goto(`${BASE}#/family/yamada/person/p_haruko`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.screenshot({ path: "screenshots/person-photos.png", fullPage: false });

const info = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")]
    .filter((i) => i.width === 96 || i.height === 96)
    .map((i) => ({ w: i.width, src: i.currentSrc.slice(0, 20) }));
  const links = [...document.querySelectorAll('a[title*="写真"]')].map((a) =>
    a.getAttribute("href")?.slice(0, 80),
  );
  return { imgs, links };
});
console.log("record section:", info);

// 1枚目クリック → lightbox
if (info.links.length) {
  await page.locator('a[title*="写真"]').first().click();
  await page.waitForTimeout(500);
  console.log("after click url:", page.url());
}

await browser.close();
console.log("done");
