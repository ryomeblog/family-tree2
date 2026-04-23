// Wireframe 06 — Memories timeline
import React from "react";
import { Hanko, Title, Hand, SketchBtn, Photo, Para, StickyNote } from "./primitives";

interface Memory {
  year: string;
  title: string;
  author: string;
  layout: "photo-right" | "photo-grid";
}

export const WireMemories: React.FC = () => {
  const memories: Memory[] = [
    { year: "1985", title: "太郎、誕生", author: "お母さんより", layout: "photo-right" },
    { year: "1992", title: "家族旅行・箱根", author: "お父さんより", layout: "photo-grid" },
    { year: "2012", title: "太郎と花子、結婚", author: "おばあちゃんより", layout: "photo-right" },
  ];

  return (
    <div
      style={{
        width: 1200,
        minHeight: 900,
        background: "#FFFEF8",
        fontFamily: "'Kaisei Decol', serif",
        position: "relative",
        border: "1.5px solid #1A1915",
        display: "flex",
      }}
    >
      <div
        style={{
          width: 64,
          borderRight: "1.5px solid #1A1915",
          background: "#F5F0E1",
          padding: "20px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Hanko size={36} text="家" />
        {["🌳", "📷", "📖", "🖨", "⚙"].map((i, idx) => (
          <div
            key={idx}
            style={{
              width: 36,
              height: 36,
              border: "1.5px solid #1A1915",
              borderRadius: 4,
              background: idx === 2 ? "#FFFEF8" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              boxShadow: idx === 2 ? "2px 2px 0 #1A1915" : "none",
            }}
          >
            {i}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: "32px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <Hand size={12} color="#C0392B" style={{ letterSpacing: "0.2em" }}>
              ─── 田中家の思い出
            </Hand>
            <Title size={36} style={{ marginTop: 6 }}>思い出ノート</Title>
            <Hand size={12} color="#6B6456" style={{ marginTop: 4 }}>
              家族の物語を、一冊の絵本のように
            </Hand>
          </div>
          <SketchBtn primary>＋ 新しい思い出を書く</SketchBtn>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 28,
            borderBottom: "1.5px solid #1A1915",
          }}
        >
          {["すべて", "写真", "エピソード", "手紙・書類", "音声"].map((t, i) => (
            <div
              key={t}
              style={{
                padding: "8px 16px",
                border: "1.5px solid #1A1915",
                borderBottom: i === 0 ? "1.5px solid #FFFEF8" : "1.5px solid #1A1915",
                borderRadius: "4px 4px 0 0",
                background: i === 0 ? "#FFFEF8" : "#F5F0E1",
                fontFamily: "'Klee One', cursive",
                fontSize: 12,
                fontWeight: i === 0 ? 600 : 400,
                marginBottom: -1.5,
              }}
            >
              {t}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28, position: "relative", paddingLeft: 40 }}>
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 10,
              bottom: 0,
              width: 2,
              background: "#1A1915",
            }}
          />

          {memories.map((item, i) => (
            <div key={i} style={{ marginBottom: 32, position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: -32,
                  top: 6,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#C0392B",
                  border: "2px solid #FFFEF8",
                  boxShadow: "0 0 0 1.5px #1A1915",
                }}
              />
              <div
                style={{
                  border: "1.5px solid #1A1915",
                  background: "#FFFEF8",
                  boxShadow: "3px 3px 0 #1A1915",
                  padding: "20px 24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.1em" }}>
                      {item.year}年
                    </Hand>
                    <Title size={22} style={{ marginTop: 2 }}>{item.title}</Title>
                  </div>
                  <Hand size={11} color="#6B6456">{item.author}</Hand>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    display: "grid",
                    gridTemplateColumns:
                      item.layout === "photo-grid" ? "1fr 1fr 1fr 1fr" : "2fr 1fr",
                    gap: 16,
                  }}
                >
                  {item.layout === "photo-grid" ? (
                    Array.from({ length: 4 }).map((_, j) => (
                      <Photo key={j} w="100%" h={120} label="" />
                    ))
                  ) : (
                    <>
                      <div>
                        <Para lines={5} />
                      </div>
                      <Photo w="100%" h={180} label="写真" />
                    </>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    borderTop: "1px solid #D6D1C4",
                    paddingTop: 12,
                  }}
                >
                  <Hand size={11}>♡ いいね 12</Hand>
                  <Hand size={11}>💬 コメント 3</Hand>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                    <Hand size={11} color="#C0392B">編集</Hand>
                    <Hand size={11} color="#6B6456">共有</Hand>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div
            style={{
              border: "1.5px dashed #1A1915",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <Hand color="#8B8574">＋ このタイムラインに思い出を追加</Hand>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", top: 140, right: -40 }}>
        <StickyNote rotate={4}>
          カード＝絵本の見開き。<br />写真と文章が<br />交互にリズムを刻む。
        </StickyNote>
      </div>
    </div>
  );
};

export default WireMemories;
