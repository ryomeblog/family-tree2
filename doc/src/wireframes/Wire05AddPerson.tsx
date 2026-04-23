// Wireframe 05 — Add Person form (modal)
import React from "react";
import { Title, Hand, SketchBtn, Photo, Para, StickyNote } from "./primitives";

export const WireAddPerson: React.FC = () => (
  <div
    style={{
      width: 1200,
      minHeight: 800,
      background: "#FFFEF8",
      fontFamily: "'Kaisei Decol', serif",
      position: "relative",
      border: "1.5px solid #1A1915",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.15,
        background:
          "repeating-linear-gradient(0deg, transparent 0 39px, #D6D1C4 39px 40px), repeating-linear-gradient(90deg, transparent 0 39px, #D6D1C4 39px 40px)",
      }}
    />
    <div style={{ position: "absolute", inset: 0, background: "rgba(26,25,21,0.2)" }} />

    <div
      style={{
        width: 720,
        background: "#FFFEF8",
        border: "1.5px solid #1A1915",
        boxShadow: "6px 6px 0 #1A1915",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div
        style={{
          padding: "24px 32px 20px",
          borderBottom: "1.5px solid #1A1915",
          background: "#F5F0E1",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.2em" }}>
            ─── 新しい人物を追加
          </Hand>
          <Title size={26} style={{ marginTop: 6 }}>家族の一員を迎え入れる</Title>
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            border: "1.5px solid #1A1915",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          ✕
        </div>
      </div>

      <div
        style={{
          padding: "16px 32px",
          borderBottom: "1px solid #D6D1C4",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: "'Klee One', cursive",
          fontSize: 12,
        }}
      >
        {["基本情報", "続柄", "写真・思い出", "確認"].map((s, i) => (
          <React.Fragment key={s}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: i === 0 ? "#1A1915" : "#8B8574",
                fontWeight: i === 0 ? 600 : 400,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: "1.5px solid currentColor",
                  background: i === 0 ? "#C0392B" : "transparent",
                  color: i === 0 ? "#FFFEF8" : "currentColor",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {i + 1}
              </div>
              {s}
            </div>
            {i < 3 && <div style={{ flex: 1, height: 1, background: "#D6D1C4" }} />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ padding: "28px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 24 }}>
          <div>
            <Hand size={10} color="#8B8574" style={{ letterSpacing: "0.15em" }}>写真</Hand>
            <div style={{ marginTop: 6 }}>
              <Photo w={120} h={120} round label="＋ 追加" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              ["姓（必須）", "田中", true],
              ["名（必須）", "花子", true],
              ["姓（ふりがな）", "たなか", false],
              ["名（ふりがな）", "はなこ", false],
            ].map(([lbl, val, strong]) => (
              <div key={lbl as string}>
                <Hand size={10} color="#8B8574" style={{ letterSpacing: "0.15em" }}>{lbl}</Hand>
                <div
                  style={{
                    marginTop: 6,
                    border: strong ? "1.5px solid #1A1915" : "1px solid #D6D1C4",
                    padding: "10px 12px",
                    fontFamily: "'Klee One', cursive",
                    fontSize: strong ? 14 : 13,
                    color: strong ? "#1A1915" : "#8B8574",
                  }}
                >
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 20 }}>
          <div>
            <Hand size={10} color="#8B8574" style={{ letterSpacing: "0.15em" }}>性別</Hand>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {["男", "女", "その他"].map((g, i) => (
                <div
                  key={g}
                  style={{
                    padding: "6px 12px",
                    border: "1.5px solid #1A1915",
                    borderRadius: 4,
                    background: i === 1 ? "#FBE4E0" : "transparent",
                    fontFamily: "'Klee One', cursive",
                    fontSize: 12,
                    boxShadow: i === 1 ? "2px 2px 0 #1A1915" : "none",
                  }}
                >
                  {g}
                </div>
              ))}
            </div>
          </div>
          <div>
            <Hand size={10} color="#8B8574" style={{ letterSpacing: "0.15em" }}>生年月日</Hand>
            <div
              style={{
                marginTop: 6,
                border: "1.5px solid #1A1915",
                padding: "10px 12px",
                fontFamily: "'Klee One', cursive",
                fontSize: 13,
                color: "#6B6456",
              }}
            >
              1960年 3月 15日  📅
            </div>
          </div>
          <div>
            <Hand size={10} color="#8B8574" style={{ letterSpacing: "0.15em" }}>存命 / 没年</Hand>
            <div
              style={{
                marginTop: 6,
                border: "1.5px solid #1A1915",
                padding: "10px 12px",
                fontFamily: "'Klee One', cursive",
                fontSize: 13,
              }}
            >
              ● 存命　　　○ 故人
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <Hand size={10} color="#8B8574" style={{ letterSpacing: "0.15em" }}>メモ・紹介文</Hand>
          <div
            style={{
              marginTop: 6,
              border: "1.5px solid #1A1915",
              padding: "12px 14px",
              minHeight: 80,
            }}
          >
            <Para lines={2} />
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "16px 32px",
          borderTop: "1.5px solid #1A1915",
          background: "#F5F0E1",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Hand size={11} color="#6B6456">ステップ 1 / 4</Hand>
        <div style={{ display: "flex", gap: 10 }}>
          <SketchBtn small>キャンセル</SketchBtn>
          <SketchBtn small primary>次へ：続柄を決める →</SketchBtn>
        </div>
      </div>
    </div>

    <div style={{ position: "absolute", top: 80, right: 40, zIndex: 3 }}>
      <StickyNote rotate={6}>
        ステップ形式で<br />高齢ユーザーにやさしく。<br />一度に多くを聞かない。
      </StickyNote>
    </div>
  </div>
);

export default WireAddPerson;
