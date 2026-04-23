import { FuzzyDate } from "./types";

const ERA_TO_WESTERN: Record<string, number> = {
  明治: 1867,
  大正: 1911,
  昭和: 1925,
  平成: 1988,
  令和: 2018,
};

export function eraToWestern(era: string, year: number): number {
  return (ERA_TO_WESTERN[era] ?? 1925) + year;
}

export function westernToEra(
  y: number,
): { era: keyof typeof ERA_TO_WESTERN; year: number } {
  if (y >= 2019) return { era: "令和", year: y - 2018 };
  if (y >= 1989) return { era: "平成", year: y - 1988 };
  if (y >= 1926) return { era: "昭和", year: y - 1925 };
  if (y >= 1912) return { era: "大正", year: y - 1911 };
  return { era: "明治", year: y - 1867 };
}

export function fuzzyWesternYear(d?: FuzzyDate): number | undefined {
  if (!d) return undefined;
  if (d.kind === "exact" || d.kind === "year") return d.y;
  if (d.kind === "era") return eraToWestern(d.era, d.year);
  return undefined;
}

export function formatFuzzyDate(d?: FuzzyDate): string {
  if (!d || d.kind === "unknown") return "不明";
  if (d.kind === "year") return `${d.y}年ごろ`;
  if (d.kind === "era") {
    let s = `${d.era}${d.year}年`;
    if (d.m) s += `${d.m}月`;
    if (d.d) s += `${d.d}日`;
    return s;
  }
  let s = `${d.y}年`;
  if (d.m) s += `${d.m}月`;
  if (d.d) s += `${d.d}日`;
  return s;
}

export function compareFuzzyDate(a?: FuzzyDate, b?: FuzzyDate): number {
  const ay = fuzzyWesternYear(a) ?? -Infinity;
  const by = fuzzyWesternYear(b) ?? -Infinity;
  return ay - by;
}
