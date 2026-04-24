import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Hand, Title, Row, C, F } from "../components/ui";
import { useFamilyStore, formatPerson } from "../stores/familyStore";
import { useIsMobile } from "../hooks/useMediaQuery";

type Hit =
  | { kind: "person"; id: string; label: string; hint?: string }
  | { kind: "memory"; id: string; label: string; hint?: string };

interface Props {
  familyId: string;
  onClose: () => void;
  scope?: "all" | "people" | "memories";
  anchorRef?: React.RefObject<HTMLElement>;
  /** Override container style (default = dropdown anchored top:100%, right:0). */
  containerStyle?: React.CSSProperties;
}

export default function SearchPopover({
  familyId,
  onClose,
  scope = "all",
  anchorRef: _anchorRef,
  containerStyle,
}: Props) {
  const store = useFamilyStore();
  const family = store.families[familyId];
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    inputRef.current?.focus();
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const hits: Hit[] = useMemo(() => {
    if (!family) return [];
    const needle = q.trim().toLowerCase();
    const results: Hit[] = [];
    if (scope === "all" || scope === "people") {
      for (const p of Object.values(family.people)) {
        const haystack = [
          p.surname,
          p.given,
          p.kanaSurname,
          p.kanaGiven,
          p.role,
          p.birthPlace,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!needle || haystack.includes(needle)) {
          results.push({
            kind: "person",
            id: p.id,
            label: formatPerson(p),
            hint: p.role,
          });
        }
      }
    }
    if (scope === "all" || scope === "memories") {
      for (const m of Object.values(family.memories)) {
        const bodyText = m.body.replace(/<[^>]+>/g, "");
        const haystack = [m.title, m.periodLabel, ...m.tags, bodyText]
          .join(" ")
          .toLowerCase();
        if (!needle || haystack.includes(needle)) {
          results.push({
            kind: "memory",
            id: m.id,
            label: m.title,
            hint: m.periodLabel,
          });
        }
      }
    }
    return results.slice(0, 20);
  }, [family, q, scope]);

  const go = (h: Hit) => {
    onClose();
    if (h.kind === "person") nav(`/family/${familyId}/person/${h.id}`);
    else nav(`/family/${familyId}/memory/${h.id}`);
  };

  // デスクトップ：ボタン直下に 360px のドロップダウン。
  // モバイル：ヘッダ直下に viewport 全幅で貼り付く固定シート。高さは画面下端まで
  // 使い、家系図のズーム/ミニマップは非表示にして被り衝突を避ける（TreeEditor 側）。
  // 親の overflow-x から逃げるため position: fixed が必要。
  const defaultStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        top: 56,
        left: 8,
        right: 8,
        bottom: 8,
        background: C.paper,
        border: `1.5px solid ${C.sumi}`,
        borderRadius: 4,
        boxShadow: `4px 4px 0 ${C.sumi}, 0 20px 40px -15px rgba(0,0,0,0.35)`,
        overflow: "hidden",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
      }
    : {
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: 360,
        maxWidth: "calc(100vw - 24px)",
        background: C.paper,
        border: `1.5px solid ${C.sumi}`,
        borderRadius: 4,
        boxShadow: `4px 4px 0 ${C.sumi}, 0 20px 40px -15px rgba(0,0,0,0.35)`,
        overflow: "hidden",
        zIndex: 40,
      };
  return (
    <div ref={wrapRef} style={containerStyle ?? defaultStyle}>
      <div
        style={{
          padding: 10,
          borderBottom: `1px solid ${C.line}`,
          background: "#FBF6E6",
          flex: "none",
        }}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            scope === "people"
              ? "人物を検索…"
              : scope === "memories"
                ? "思い出を検索…"
                : "人物・思い出を検索…"
          }
          style={{
            width: "100%",
            border: `1px solid ${C.sumi}`,
            borderRadius: 3,
            padding: "7px 10px",
            background: C.paper,
            fontFamily: F.mincho,
            fontSize: 14,
            boxShadow: `2px 2px 0 ${C.sumi}`,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
      <div
        style={{
          maxHeight: isMobile ? undefined : 320,
          flex: isMobile ? 1 : undefined,
          overflowY: "auto",
          padding: 4,
        }}
      >
        {hits.length === 0 ? (
          <div style={{ padding: 16, textAlign: "center" }}>
            <Hand size={12} color={C.pale}>
              該当する結果がありません
            </Hand>
          </div>
        ) : (
          hits.map((h) => (
            <button
              key={h.kind + h.id}
              type="button"
              onClick={() => go(h)}
              style={{
                width: "100%",
                textAlign: "left",
                background: "transparent",
                border: "none",
                padding: "8px 10px",
                borderRadius: 3,
                cursor: "pointer",
                fontFamily: "inherit",
                color: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 3,
                  border: `1px solid ${C.line}`,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: F.mincho,
                  fontSize: 12,
                  color: h.kind === "person" ? C.shu : C.sub,
                  background: h.kind === "person" ? "#FCE9E5" : "#FBF6E6",
                  flex: "none",
                }}
              >
                {h.kind === "person" ? "人" : "帖"}
              </span>
              <div style={{ flex: 1 }}>
                <Title size={13}>{h.label}</Title>
                {h.hint && (
                  <Hand size={10.5} color={C.pale}>
                    {h.hint}
                  </Hand>
                )}
              </div>
            </button>
          ))
        )}
      </div>
      <Row
        justify="space-between"
        style={{
          padding: "8px 12px",
          borderTop: `1px solid ${C.line}`,
          background: "#FBF6E6",
          flex: "none",
        }}
      >
        <Hand size={10.5} color={C.pale}>
          {hits.length} 件
        </Hand>
        <Link
          to={`/family/${familyId}/memories`}
          onClick={onClose}
          style={{
            fontFamily: F.hand,
            fontSize: 11,
            color: C.shu,
            textDecoration: "none",
          }}
        >
          思い出一覧へ →
        </Link>
      </Row>
    </div>
  );
}
