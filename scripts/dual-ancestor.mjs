import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "screenshots";
const BASE = "http://127.0.0.1:5173/family-tree2/";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => {
  if (m.type() === "error") console.log("[err]", m.text());
});

// Directly seed the store via localStorage — avoids driving the whole
// UI to build the scenario. The shape matches the Zustand persist
// middleware's serialization.
async function seed(fam) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate((fam) => {
    const state = {
      families: { [fam.id]: fam },
      activeFamilyId: fam.id,
      currentViewerPersonId: fam.rootPersonId,
      reminderEnabled: true,
      theme: "picture-book",
      persistGranted: false,
    };
    const payload = JSON.stringify({ state, version: 0 });
    const wrapper = JSON.stringify({ seq: 999, payload });
    localStorage.setItem("ft2.state.v1.a", wrapper);
    localStorage.removeItem("ft2.state.v1.b");
  }, fam);
}

// Scenario A: 2 grandparent couples + 2 children who marry
const scenarioA = {
  id: "ishii_dual",
  name: "石井家（両側祖父母）",
  theme: "picture-book",
  themeColor: "#E8B8B2",
  rootPersonId: "A1",
  generations: 2,
  lastUpdated: "テスト",
  people: {
    gpA_m: { id: "gpA_m", surname: "石井", given: "祖父A", gender: "m" },
    gpA_f: { id: "gpA_f", surname: "石井", given: "祖母A", gender: "f" },
    gpB_m: { id: "gpB_m", surname: "田中", given: "祖父B", gender: "m" },
    gpB_f: { id: "gpB_f", surname: "田中", given: "祖母B", gender: "f" },
    A1: { id: "A1", surname: "石井", given: "太郎", gender: "m" },
    B1: { id: "B1", surname: "田中", given: "花子", gender: "f" },
  },
  unions: [
    { id: "uA", partnerA: "gpA_m", partnerB: "gpA_f" },
    { id: "uB", partnerA: "gpB_m", partnerB: "gpB_f" },
    { id: "uAB", partnerA: "A1", partnerB: "B1" },
  ],
  links: [
    { parentUnion: "uA", childId: "A1" },
    { parentUnion: "uB", childId: "B1" },
  ],
  memories: {},
};

// Scenario B: add a third generation (A1+B1 have a child)
const scenarioB = {
  ...scenarioA,
  id: "ishii_3gen",
  name: "石井家 3 世代",
  generations: 3,
  rootPersonId: "child",
  people: {
    ...scenarioA.people,
    child: { id: "child", surname: "石井", given: "太郎の子", gender: "m" },
  },
  links: [...scenarioA.links, { parentUnion: "uAB", childId: "child" }],
};

// Scenario C: chained — both A1 and B1 have grandparents too (4 great-gp)
// This is the "親の親" case where both sides have 2 gens of ancestors.
const scenarioC = {
  ...scenarioA,
  id: "ishii_chain",
  name: "石井家 4 世代連鎖",
  generations: 4,
  rootPersonId: "child",
  people: {
    ...scenarioA.people,
    child: { id: "child", surname: "石井", given: "曾孫", gender: "m" },
    ggpA_m: { id: "ggpA_m", surname: "石井", given: "曾祖父A", gender: "m" },
    ggpA_f: { id: "ggpA_f", surname: "石井", given: "曾祖母A", gender: "f" },
    ggpB_m: { id: "ggpB_m", surname: "田中", given: "曾祖父B", gender: "m" },
    ggpB_f: { id: "ggpB_f", surname: "田中", given: "曾祖母B", gender: "f" },
  },
  unions: [
    ...scenarioA.unions,
    { id: "uGA", partnerA: "ggpA_m", partnerB: "ggpA_f" },
    { id: "uGB", partnerA: "ggpB_m", partnerB: "ggpB_f" },
  ],
  links: [
    ...scenarioA.links,
    { parentUnion: "uAB", childId: "child" },
    { parentUnion: "uGA", childId: "gpA_m" },
    { parentUnion: "uGB", childId: "gpB_m" },
  ],
};

async function go(scenario, label) {
  await seed(scenario);
  // Reload so Zustand persist middleware rehydrates from the new slot.
  await page.goto(`${BASE}#/family/${scenario.id}/tree`, {
    waitUntil: "networkidle",
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${label}.png` });
  const info = await page.evaluate(() => {
    const boxes = [];
    document.querySelectorAll("button").forEach((b) => {
      const s = b.getAttribute("style") ?? "";
      if (s.includes("position: absolute") && s.includes("144")) {
        const r = b.getBoundingClientRect();
        boxes.push({
          text: b.innerText.replace(/\n/g, " ").slice(0, 30),
          left: Math.round(r.left),
          top: Math.round(r.top),
        });
      }
    });
    const lines = [];
    document.querySelectorAll("svg line").forEach((ln) => {
      const bb = ln.getBoundingClientRect();
      if (bb.width + bb.height < 2) return;
      lines.push({
        x1: Math.round(+ln.getAttribute("x1")),
        y1: Math.round(+ln.getAttribute("y1")),
        x2: Math.round(+ln.getAttribute("x2")),
        y2: Math.round(+ln.getAttribute("y2")),
      });
    });
    return { boxes, lineCount: lines.length, lines };
  });
  console.log(`── ${label} ──`);
  console.log(JSON.stringify(info, null, 2));
}

await go(scenarioA, "A-dual-ancestors");
await go(scenarioB, "B-3gen-with-child");
await go(scenarioC, "C-chain-4gen");

await browser.close();
