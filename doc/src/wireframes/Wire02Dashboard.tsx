// Wireframe 02 — Dashboard
import React from "react";
import { Hanko, Title, Hand, SketchBtn, Photo, StickyNote } from "./primitives";

export const WireDashboard: React.FC = () => (
  <div
    style={{
      width: 1200,
      minHeight: 800,
      background: "#FFFEF8",
      fontFamily: "'Kaisei Decol', serif",
      position: "relative",
      border: "1.5px solid #1A1915",
      display: "flex",
    }}
  >
    <div
      style={{
        width: 220,
        borderRight: "1.5px solid #1A1915",
        padding: "24px 20px",
        background: "#F5F0E1",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Hanko size={32} text="家" />
        <Title size={15}>ファミリーツリー２</Title>
      </div>

      <div>
        <Hand size={10} color="#8B8574" style={{ letterSpacing: "0.15em" }}>
          メニュー
        </Hand>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          {([
            ["■", "マイ家系図", true],
            ["□", "共有された図", false],
            ["□", "写真ライブラリ", false],
            ["□", "思い出ノート", false],
            ["□", "印刷・製本", false],
          ] as const).map(([icon, label, active]) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                background: active ? "#FFFEF8" : "transparent",
                border: active ? "1.5px solid #1A1915" : "1.5px solid transparent",
                borderRadius: 4,
                fontFamily: "'Klee One', cursive",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                boxShadow: active ? "2px 2px 0 #1A1915" : "none",
              }}
            >
              <span style={{ color: "#C0392B" }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        <Photo w={36} h={36} round label="私" />
        <div>
          <Hand size={12}>田中 太郎</Hand>
          <div>
            <Hand size={10} color="#6B6456">設定</Hand>
          </div>
        </div>
      </div>
    </div>

    <div style={{ flex: 1, padding: "32px 40px", position: "relative" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 24,
        }}
      >
        <div>
          <Hand size={12} color="#6B6456">おかえりなさい、太郎さん</Hand>
          <Title size={32} style={{ marginTop: 4 }}>マイ家系図</Title>
        </div>
        <SketchBtn primary>＋ 新しい家系図をつくる</SketchBtn>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div
          style={{
            flex: 1,
            border: "1.5px solid #1A1915",
            borderRadius: 4,
            padding: "8px 14px",
            background: "#FFFEF8",
          }}
        >
          <Hand size={12} color="#8B8574">🔍 名前で検索…</Hand>
        </div>
        <div
          style={{
            border: "1.5px solid #1A1915",
            borderRadius: 4,
            padding: "8px 14px",
          }}
        >
          <Hand size={12}>並び順：更新日 ▼</Hand>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 20,
        }}
      >
        {[
          { title: "田中家", sub: "12世代・148名", updated: "昨日", isNew: false },
          { title: "山本家（母方）", sub: "8世代・67名", updated: "3日前", isNew: false },
          { title: "祖父の本家", sub: "15世代・221名", updated: "先週", isNew: false },
          { title: "妻の実家", sub: "6世代・42名", updated: "先月", isNew: false },
          { title: "新しい家系図", sub: "", updated: "", isNew: true },
        ].map((card, i) => (
          <div
            key={i}
            style={{
              border: "1.5px solid #1A1915",
              borderRadius: 6,
              background: card.isNew ? "transparent" : "#FFFEF8",
              borderStyle: card.isNew ? "dashed" : "solid",
              padding: 20,
              boxShadow: card.isNew ? "none" : "3px 3px 0 #1A1915",
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {card.isNew ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 32, color: "#8B8574" }}>＋</div>
                <Hand color="#8B8574">新規作成</Hand>
              </div>
            ) : (
              <>
                <div
                  style={{
                    height: 100,
                    background: "#F5F0E1",
                    border: "1.2px dashed #1A1915",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                  }}
                >
                  <Hand size={10} color="#8B8574">〔 家系図サムネイル 〕</Hand>
                </div>
                <Title size={18}>{card.title}</Title>
                <Hand size={11} color="#6B6456" style={{ marginTop: 4 }}>
                  {card.sub}
                </Hand>
                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 12,
                  }}
                >
                  <Hand size={10} color="#8B8574">更新：{card.updated}</Hand>
                  <Hand size={11} color="#C0392B">開く →</Hand>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", top: 120, right: -30 }}>
        <StickyNote rotate={4}>
          カード＝絵本の表紙風。<br />
          紙の質感と影で厚みを。
        </StickyNote>
      </div>
    </div>
  </div>
);

export default WireDashboard;
