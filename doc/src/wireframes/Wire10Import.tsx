// Wireframe 10 — Import progress (in settings)
import React from "react";
import { Title, Hand, SketchBtn, StickyNote } from "./primitives";

const Step: React.FC<{ label: string; state: "done" | "now" | "todo"; detail?: string }> = ({
  label,
  state,
  detail,
}) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        border: "1.5px solid #1A1915",
        background:
          state === "done" ? "#1A1915" : state === "now" ? "#C0392B" : "#FFFEF8",
        color: state === "todo" ? "#1A1915" : "#FFFEF8",
        fontFamily: "'Kaisei Decol', serif",
        fontSize: 11,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
      }}
    >
      {state === "done" ? "✓" : "●"}
    </div>
    <div>
      <Hand size={13} color={state === "todo" ? "#8B8574" : "#1A1915"}>
        {label}
      </Hand>
      {detail && (
        <div style={{ marginTop: 2 }}>
          <Hand size={11} color="#8B8574">
            {detail}
          </Hand>
        </div>
      )}
    </div>
  </div>
);

export const WireImport: React.FC = () => (
  <div
    style={{
      width: 1200,
      height: 760,
      background: "rgba(26,25,21,0.3)",
      border: "1.5px solid #1A1915",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      fontFamily: "'Kaisei Decol', serif",
    }}
  >
    <div
      style={{
        width: 520,
        background: "#FFFEF8",
        border: "1.5px solid #1A1915",
        boxShadow: "6px 6px 0 #1A1915",
        padding: "32px 36px",
        position: "relative",
      }}
    >
      <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.2em" }}>
        ─── IMPORT
      </Hand>
      <Title size={24} style={{ marginTop: 4 }}>
        家系ファイルを取り込み中…
      </Title>

      <div
        style={{
          marginTop: 20,
          padding: 12,
          border: "1.2px dashed #1A1915",
          borderRadius: 4,
          background: "#F5F0E1",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 24 }}>📦</div>
        <div>
          <Hand size={13}>田中家.ftree2</Hand>
          <div>
            <Hand size={11} color="#8B8574">52.4 MB ・ 2025/03/12 書き出し</Hand>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <Step label="ファイル形式を確認" state="done" />
        <Step label="家系データを読み込む" state="done" detail="148名 ・ 12世代" />
        <Step label="写真を復元する" state="now" detail="218 / 642 枚…" />
        <Step label="完了" state="todo" />
      </div>

      {/* progress bar */}
      <div
        style={{
          marginTop: 20,
          height: 14,
          border: "1.5px solid #1A1915",
          borderRadius: 999,
          overflow: "hidden",
          background: "#F5F0E1",
        }}
      >
        <div
          style={{
            width: "34%",
            height: "100%",
            background:
              "repeating-linear-gradient(45deg, #C0392B 0 8px, #A02E22 8px 16px)",
          }}
        />
      </div>
      <div style={{ marginTop: 6, textAlign: "right" }}>
        <Hand size={11} color="#8B8574">34%</Hand>
      </div>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <SketchBtn small>キャンセル</SketchBtn>
      </div>

      <div style={{ position: "absolute", top: -20, left: -180 }}>
        <StickyNote rotate={-6}>
          同じfamilyIdは<br />
          取り込み側で上書き。<br />
          ユーザー確認なし。
        </StickyNote>
      </div>
    </div>
  </div>
);

export default WireImport;
