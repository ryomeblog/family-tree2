// Wireframe 07 — New family modal (create)
import React from "react";
import { Title, Hand, SketchBtn, StickyNote } from "./primitives";

const Field: React.FC<{ label: string; placeholder?: string; hint?: string; width?: number | string }> = ({
  label,
  placeholder,
  hint,
  width = "100%",
}) => (
  <label style={{ display: "block", width }}>
    <div style={{ marginBottom: 6 }}>
      <Hand size={12}>{label}</Hand>
    </div>
    <div
      style={{
        border: "1.5px solid #1A1915",
        borderRadius: 4,
        padding: "10px 12px",
        background: "#FFFEF8",
        fontFamily: "'Klee One', cursive",
        fontSize: 13,
        color: "#8B8574",
      }}
    >
      {placeholder || "…"}
    </div>
    {hint && (
      <div style={{ marginTop: 4 }}>
        <Hand size={10} color="#8B8574">
          {hint}
        </Hand>
      </div>
    )}
  </label>
);

export const WireNewFamily: React.FC = () => (
  <div
    style={{
      width: 1200,
      height: 800,
      background: "rgba(26,25,21,0.45)",
      border: "1.5px solid #1A1915",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    }}
  >
    {/* page behind */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "repeating-linear-gradient(135deg, transparent 0 40px, rgba(255,254,248,0.06) 40px 80px)",
      }}
    />

    <div
      style={{
        width: 560,
        background: "#FFFEF8",
        border: "1.5px solid #1A1915",
        boxShadow: "6px 6px 0 #1A1915",
        padding: "32px 36px",
        position: "relative",
        fontFamily: "'Kaisei Decol', serif",
      }}
    >
      <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.2em" }}>
        ─── NEW FAMILY
      </Hand>
      <Title size={26} style={{ marginTop: 4 }}>
        新しい家系図をつくる
      </Title>
      <Hand size={12} color="#6B6456" style={{ marginTop: 4 }}>
        まず家の名前と、最初のひとりを登録します。あとから変更できます。
      </Hand>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 24 }}>
        <Field label="家の名前 *" placeholder="例：田中家、山本家（母方）" hint="ダッシュボードに表示されます" />
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="最初に登録する人 *" placeholder="あなたの名前" width="100%" />
          <Field label="続柄" placeholder="本人 / 祖父…" width={160} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="生年（わかる範囲）" placeholder="1985 / 昭和60 / 不明" />
          <Field label="性別" placeholder="男 / 女 / その他" width={160} />
        </div>
      </div>

      <div
        style={{
          marginTop: 28,
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          paddingTop: 20,
          borderTop: "1.2px solid #E8E2D0",
        }}
      >
        <SketchBtn>キャンセル</SketchBtn>
        <SketchBtn primary>つくる</SketchBtn>
      </div>

      <div style={{ position: "absolute", top: -18, right: -40 }}>
        <StickyNote rotate={6}>
          最初の一人は<br />
          「主人公」として登録。
        </StickyNote>
      </div>
    </div>
  </div>
);

export default WireNewFamily;
