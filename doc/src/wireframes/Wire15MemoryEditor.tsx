// Wireframe 15 — Memory editor (1 episode = 1 screen, rich text + up to 10 photos)
import React from "react";
import { Title, Hand, SketchBtn, Photo, StickyNote, Hanko } from "./primitives";

const ToolBtn: React.FC<{ children: React.ReactNode; active?: boolean }> = ({ children, active }) => (
  <div
    style={{
      minWidth: 28,
      height: 28,
      padding: "0 8px",
      border: "1.5px solid #1A1915",
      borderRadius: 4,
      background: active ? "#1A1915" : "#FFFEF8",
      color: active ? "#FFFEF8" : "#1A1915",
      fontFamily: "'Kaisei Decol', serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 600,
    }}
  >
    {children}
  </div>
);

export const WireMemoryEditor: React.FC = () => (
  <div
    style={{
      width: 1200,
      minHeight: 820,
      background: "#FFFEF8",
      border: "1.5px solid #1A1915",
      fontFamily: "'Kaisei Decol', serif",
      padding: "20px 0 0",
      position: "relative",
    }}
  >
    {/* Top bar */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 32px 16px",
        borderBottom: "1.5px solid #1A1915",
      }}
    >
      <Hanko size={28} />
      <div>
        <Hand size={11} color="#6B6456">田中家・思い出ノート</Hand>
        <Title size={18} style={{ marginTop: 2 }}>思い出を書く</Title>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
        <Hand size={11} color="#C0392B">● 未保存の変更があります</Hand>
        <SketchBtn small>下書きに戻す</SketchBtn>
        <SketchBtn small primary>保存する</SketchBtn>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 0 }}>
      {/* Main editor */}
      <div style={{ padding: "24px 32px", borderRight: "1.5px solid #E8E2D0" }}>
        {/* title */}
        <div
          style={{
            border: "1.5px dashed #1A1915",
            borderRadius: 4,
            padding: 14,
            marginBottom: 14,
            fontFamily: "'Kaisei Decol', serif",
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          父との最後の温泉旅行
        </div>

        {/* meta row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div
            style={{
              flex: 1,
              border: "1.2px solid #1A1915",
              borderRadius: 4,
              padding: "8px 12px",
            }}
          >
            <Hand size={10} color="#8B8574">主に誰の思い出？ *</Hand>
            <div>
              <Hand size={13}>田中 一郎（父） ▼</Hand>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              border: "1.2px solid #1A1915",
              borderRadius: 4,
              padding: "8px 12px",
            }}
          >
            <Hand size={10} color="#8B8574">時期</Hand>
            <div>
              <Hand size={13}>2015年 秋 ／ 昭和・平成・令和…</Hand>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              border: "1.2px solid #1A1915",
              borderRadius: 4,
              padding: "8px 12px",
            }}
          >
            <Hand size={10} color="#8B8574">書き手</Hand>
            <div>
              <Hand size={13}>田中 太郎 ▼</Hand>
            </div>
          </div>
        </div>

        {/* format toolbar */}
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: 6,
            background: "#F5F0E1",
            border: "1.5px solid #1A1915",
            borderRadius: 4,
            marginBottom: 10,
          }}
        >
          <ToolBtn active>H1</ToolBtn>
          <ToolBtn>H2</ToolBtn>
          <ToolBtn><b>B</b></ToolBtn>
          <ToolBtn><i>I</i></ToolBtn>
          <ToolBtn>「…」</ToolBtn>
          <ToolBtn>・</ToolBtn>
          <div style={{ width: 1, background: "#1A1915", margin: "0 6px" }} />
          <ToolBtn>↶</ToolBtn>
          <ToolBtn>↷</ToolBtn>
          <div style={{ flex: 1 }} />
          <Hand size={10} color="#8B8574">⌘Z / ⌘⇧Z でも可</Hand>
        </div>

        {/* body */}
        <div
          style={{
            minHeight: 280,
            border: "1.5px solid #1A1915",
            borderRadius: 4,
            padding: 18,
            lineHeight: 2,
            background: "#FFFEF8",
            fontFamily: "'Klee One', cursive",
            fontSize: 14,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 17, fontFamily: "'Kaisei Decol', serif" }}>
            箱根、秋
          </div>
          <div style={{ height: 8 }} />
          <div>
            父と二人で行った<b>最後の温泉旅行</b>でした。紅葉はすでに終わりかけで、
            朝晩は冷え込んでいたのを覚えています。
          </div>
          <div style={{ height: 8 }} />
          <div style={{ color: "#8B8574" }}>｜</div>
        </div>

        {/* photos */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Hand size={12} color="#1A1915">写真（3 / 10枚）</Hand>
            <SketchBtn small>＋ 写真を追加</SketchBtn>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ position: "relative" }}>
                <Photo w={100} h={100} label={`#${i + 1}`} />
                <div
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 22,
                    height: 22,
                    border: "1.5px solid #1A1915",
                    background: "#FFFEF8",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                  }}
                >
                  ✕
                </div>
              </div>
            ))}
            <Photo w={100} h={100} label="＋ 追加" />
          </div>
          <div style={{ marginTop: 6 }}>
            <Hand size={10} color="#8B8574">
              1枚 300KB〜1.5MB目安 ・ 正方形（はみ出しは黒余白で）
            </Hand>
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ padding: "24px 20px" }}>
        <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.2em" }}>
          ─── RELATED
        </Hand>
        <Title size={14} style={{ marginTop: 4, marginBottom: 10 }}>
          関連する人々
        </Title>
        {["田中 一郎（父）★ 主人公", "田中 太郎（書き手）", "田中 花子（母）"].map((n) => (
          <div
            key={n}
            style={{
              padding: "8px 10px",
              border: "1.2px solid #1A1915",
              borderRadius: 4,
              marginBottom: 6,
            }}
          >
            <Hand size={12}>{n}</Hand>
          </div>
        ))}
        <SketchBtn small>＋ 人を追加</SketchBtn>

        <div style={{ height: 24 }} />
        <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.2em" }}>
          ─── VIEWERS（閲覧者）
        </Hand>
        <Title size={14} style={{ marginTop: 4, marginBottom: 6 }}>
          この思い出を見られる人
        </Title>
        <Hand size={10} color="#6B6456" style={{ display: "block", lineHeight: 1.6, marginBottom: 8 }}>
          書き手に加えて、登録された閲覧者もこのノートを読めます。
        </Hand>
        {[
          { n: "田中 太郎（書き手・常に可）", locked: true },
          { n: "田中 花子（母）", locked: false },
          { n: "田中 さくら（娘）", locked: false },
        ].map((v) => (
          <div
            key={v.n}
            style={{
              padding: "6px 10px",
              border: "1.2px solid #1A1915",
              borderRadius: 4,
              marginBottom: 6,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: v.locked ? "#F5F0E1" : "#FFFEF8",
            }}
          >
            <Hand size={11}>{v.n}</Hand>
            {!v.locked && <Hand size={10} color="#C0392B">外す</Hand>}
          </div>
        ))}
        <SketchBtn small>＋ 閲覧者を追加</SketchBtn>

        <div style={{ height: 24 }} />
        <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.2em" }}>
          ─── TAGS
        </Hand>
        <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["#旅行", "#父", "#秋", "＋"].map((t) => (
            <div
              key={t}
              style={{
                padding: "4px 10px",
                border: "1.2px solid #1A1915",
                borderRadius: 999,
                fontFamily: "'Klee One', cursive",
                fontSize: 11,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div style={{ position: "absolute", top: 80, right: -40 }}>
      <StickyNote rotate={6}>
        編集も閲覧も同じ骨格。<br />
        保存ボタンは常に右上。
      </StickyNote>
    </div>
  </div>
);

export default WireMemoryEditor;
