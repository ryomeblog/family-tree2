// Custom year selector:
//   - Shows the most recent 20 years initially (newest at top).
//   - Scrolling to the bottom loads another 20.
//   - Each row shows 西暦 + 和暦.
import React, { useEffect, useRef, useState } from "react";
import { C, F, Hand } from "./ui";
import { westernToEra } from "../domain/fuzzyDate";

interface Props {
  value?: number;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  width?: number | string;
}

const CHUNK = 20;

export function YearPicker({
  value,
  onChange,
  placeholder = "年を選ぶ",
  width,
}: Props) {
  const now = React.useMemo(() => new Date().getFullYear(), []);
  const [loaded, setLoaded] = useState(CHUNK);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const years = Array.from({ length: loaded }, (_, i) => now - i);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    // Grow the list whenever the user approaches the bottom.
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setLoaded((n) => n + CHUNK);
    }
  };

  const formatShort = (y: number) => {
    const era = westernToEra(y);
    return `${y}年 ／ ${era.era}${era.year}年`;
  };

  return (
    <div ref={wrapRef} style={{ width, position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: "100%",
          padding: "8px 12px",
          minHeight: 34,
          fontFamily: F.mincho,
          fontSize: 14,
          color: value !== undefined ? C.sumi : C.pale,
          border: `1px solid ${C.sumi}`,
          borderRadius: 3,
          background: C.paper,
          boxShadow: `2px 2px 0 ${C.sumi}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          textAlign: "left",
          boxSizing: "border-box",
        }}
      >
        <span>{value !== undefined ? formatShort(value) : placeholder}</span>
        <span style={{ color: C.pale, fontSize: 11 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            minWidth: 220,
            background: C.paper,
            border: `1px solid ${C.sumi}`,
            borderRadius: 3,
            boxShadow: `2px 2px 0 ${C.sumi}, 0 12px 28px -12px rgba(0,0,0,0.3)`,
            zIndex: 50,
            overflow: "hidden",
          }}
          role="listbox"
        >
          <button
            type="button"
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "8px 12px",
              background: value === undefined ? "#FCE9E5" : "#FBF6E6",
              border: "none",
              borderBottom: `1px solid ${C.line}`,
              fontFamily: F.hand,
              fontSize: 12,
              color: value === undefined ? C.shu : C.sub,
              cursor: "pointer",
            }}
          >
            指定しない
          </button>
          <div
            ref={scrollRef}
            onScroll={onScroll}
            style={{
              maxHeight: 240,
              overflowY: "auto",
            }}
          >
            {years.map((y, i) => {
              const era = westernToEra(y);
              const active = y === value;
              return (
                <button
                  type="button"
                  key={y}
                  onClick={() => {
                    onChange(y);
                    setOpen(false);
                  }}
                  role="option"
                  aria-selected={active}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "7px 12px",
                    background: active ? "#FCE9E5" : "transparent",
                    border: "none",
                    borderTop: i === 0 ? "none" : `1px dashed ${C.line}`,
                    fontFamily: F.mincho,
                    fontSize: 13,
                    color: active ? C.shu : C.sumi,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <span style={{ flex: 1 }}>{y}年</span>
                  <span
                    style={{
                      fontFamily: F.hand,
                      fontSize: 11,
                      color: active ? C.shu : C.pale,
                    }}
                  >
                    {era.era}
                    {era.year}年
                  </span>
                </button>
              );
            })}
            <div
              style={{
                padding: "8px 12px",
                textAlign: "center",
                color: C.pale,
                fontFamily: F.hand,
                fontSize: 10.5,
                borderTop: `1px dashed ${C.line}`,
              }}
            >
              下までスクロールでさらに {CHUNK} 年…
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
