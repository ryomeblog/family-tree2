// 西暦／和暦／年のみ／不明 の4モードで日付を入力するフォーム部品。
// PersonForm と NewFamilyModal の両方で共有。
import React from "react";
import { C, F, Hand, Row } from "./ui";
import { FuzzyDate } from "../domain/types";

export type FuzzyMode = "exact" | "era" | "year" | "unknown";

export interface FuzzyParts {
  mode: FuzzyMode;
  era: string;
  year: string;
  month: string;
  day: string;
}

export const ERA_TO_WESTERN: Record<string, number> = {
  明治: 1867,
  大正: 1911,
  昭和: 1925,
  平成: 1988,
  令和: 2018,
};

export function fuzzyToParts(d?: FuzzyDate): FuzzyParts {
  if (!d || d.kind === "unknown")
    return { mode: "unknown", era: "昭和", year: "", month: "", day: "" };
  if (d.kind === "year")
    return { mode: "year", era: "昭和", year: String(d.y), month: "", day: "" };
  if (d.kind === "era")
    return {
      mode: "era",
      era: d.era,
      year: String(d.year),
      month: d.m ? String(d.m) : "",
      day: d.d ? String(d.d) : "",
    };
  return {
    mode: "exact",
    era: "昭和",
    year: String(d.y),
    month: d.m ? String(d.m) : "",
    day: d.d ? String(d.d) : "",
  };
}

export function partsToFuzzy(p: FuzzyParts): FuzzyDate {
  if (p.mode === "unknown") return { kind: "unknown" };
  const y = parseInt(p.year, 10);
  if (!y) return { kind: "unknown" };
  if (p.mode === "year") return { kind: "year", y };
  if (p.mode === "era") {
    return {
      kind: "era",
      era: p.era as "明治" | "大正" | "昭和" | "平成" | "令和",
      year: y,
      m: p.month ? parseInt(p.month, 10) : undefined,
      d: p.day ? parseInt(p.day, 10) : undefined,
    };
  }
  return {
    kind: "exact",
    y,
    m: p.month ? parseInt(p.month, 10) : undefined,
    d: p.day ? parseInt(p.day, 10) : undefined,
  };
}

function fuzzyPreview(p: FuzzyParts): string {
  if (p.mode === "unknown") return "不明";
  const y = parseInt(p.year, 10);
  if (!y) return "（年を入力）";
  if (p.mode === "year") return `${y}年`;
  if (p.mode === "era") {
    const western = (ERA_TO_WESTERN[p.era] ?? 1925) + y;
    let s = `${p.era}${y}年`;
    if (p.month) s += `${p.month}月`;
    if (p.day) s += `${p.day}日`;
    return s + ` = ${western}年`;
  }
  let s = `${y}年`;
  if (p.month) s += `${p.month}月`;
  if (p.day) s += `${p.day}日`;
  return s;
}

export const FuzzyDateInput: React.FC<{
  label: string;
  value: FuzzyParts;
  onChange: (v: FuzzyParts) => void;
}> = ({ label, value, onChange }) => {
  const MODES: { k: FuzzyMode; label: string }[] = [
    { k: "exact", label: "西暦" },
    { k: "era", label: "和暦" },
    { k: "year", label: "年のみ" },
    { k: "unknown", label: "不明" },
  ];
  const set = (patch: Partial<FuzzyParts>) => onChange({ ...value, ...patch });
  const disabledAll = value.mode === "unknown";
  return (
    <div>
      <Hand
        size={12}
        color={C.sub}
        bold
        style={{ display: "block", marginBottom: 6 }}
      >
        {label}
      </Hand>
      <div
        style={{
          border: `1px solid ${C.sumi}`,
          borderRadius: 3,
          background: C.paper,
          padding: 8,
          boxShadow: `2px 2px 0 ${C.sumi}`,
        }}
      >
        <Row gap={6} wrap>
          {MODES.map((m) => (
            <button
              key={m.k}
              type="button"
              onClick={() => set({ mode: m.k })}
              style={{
                padding: "3px 10px",
                borderRadius: 3,
                fontFamily: F.hand,
                fontSize: 11,
                background: value.mode === m.k ? C.shu : "transparent",
                color: value.mode === m.k ? C.paper : C.sub,
                border: `1px solid ${value.mode === m.k ? C.shu : C.line}`,
                cursor: "pointer",
              }}
            >
              {m.label}
            </button>
          ))}
        </Row>
        <Row gap={8} wrap style={{ marginTop: 10 }}>
          {value.mode === "era" && (
            <select
              value={value.era}
              onChange={(e) => set({ era: e.target.value })}
              disabled={disabledAll}
              style={{
                fontFamily: F.mincho,
                border: `1px solid ${C.line}`,
                padding: "4px 6px",
                background: "#FBF6E6",
                fontSize: 13,
              }}
            >
              {Object.keys(ERA_TO_WESTERN).map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          )}
          <input
            placeholder="年"
            type="number"
            value={value.year}
            onChange={(e) => set({ year: e.target.value })}
            disabled={disabledAll}
            style={{
              width: 80,
              fontFamily: F.mincho,
              border: `1px solid ${C.line}`,
              padding: "4px 8px",
              fontSize: 13,
            }}
          />
          <Hand size={12}>年</Hand>
          {value.mode !== "year" && (
            <>
              <input
                placeholder="月"
                type="number"
                value={value.month}
                onChange={(e) => set({ month: e.target.value })}
                disabled={disabledAll}
                style={{
                  width: 56,
                  fontFamily: F.mincho,
                  border: `1px solid ${C.line}`,
                  padding: "4px 8px",
                  fontSize: 13,
                }}
              />
              <Hand size={12}>月</Hand>
              <input
                placeholder="日"
                type="number"
                value={value.day}
                onChange={(e) => set({ day: e.target.value })}
                disabled={disabledAll}
                style={{
                  width: 56,
                  fontFamily: F.mincho,
                  border: `1px solid ${C.line}`,
                  padding: "4px 8px",
                  fontSize: 13,
                }}
              />
              <Hand size={12}>日</Hand>
            </>
          )}
        </Row>
        <Hand size={10.5} color={C.pale} style={{ display: "block", marginTop: 6 }}>
          = {fuzzyPreview(value)}
        </Hand>
      </div>
    </div>
  );
};
