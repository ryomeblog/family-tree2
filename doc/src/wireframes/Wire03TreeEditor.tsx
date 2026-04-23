// Wireframe 03 — Tree Editor
import React from "react";
import {
  Hanko,
  Title,
  Hand,
  SketchBtn,
  Photo,
  PersonNode,
  StickyNote,
  type Gender,
} from "./primitives";

interface Node {
  id: string;
  name: string;
  years: string;
  x: number;
  y: number;
  g: Gender;
  emph?: boolean;
}

interface Line {
  a: string;
  b: string;
  type: "h" | "v" | "child"; // child = from couple midpoint to child
  partner?: string; // for "child": the other parent, so midpoint is between a & partner
}

export const WireTreeEditor: React.FC = () => {
  const nodes: Node[] = [
    { id: "gg1", name: "曾祖父", years: "1895–1970", x: 260, y: 40, g: "m" },
    { id: "gg2", name: "曾祖母", years: "1900–1975", x: 380, y: 40, g: "f" },
    { id: "gg3", name: "曾祖父", years: "1898–1965", x: 620, y: 40, g: "m" },
    { id: "gg4", name: "曾祖母", years: "1902–1980", x: 740, y: 40, g: "f" },
    { id: "g1", name: "祖父", years: "1925–2005", x: 320, y: 160, g: "m" },
    { id: "g2", name: "祖母", years: "1930–2010", x: 680, y: 160, g: "f" },
    { id: "p1", name: "父", years: "1958–", x: 400, y: 280, g: "m" },
    { id: "p2", name: "母", years: "1960–", x: 600, y: 280, g: "f" },
    { id: "s1", name: "兄", years: "1982–", x: 360, y: 400, g: "m" },
    { id: "me", name: "私", years: "1985–", x: 500, y: 400, emph: true, g: "m" },
    { id: "s2", name: "妹", years: "1988–", x: 640, y: 400, g: "f" },
  ];

  const lines: Line[] = [
    // couples (horizontal marriage line)
    { a: "gg1", b: "gg2", type: "h" },
    { a: "gg3", b: "gg4", type: "h" },
    { a: "g1", b: "g2", type: "h" },
    { a: "p1", b: "p2", type: "h" },
    // children drop from midpoint of couple line
    { a: "g1", partner: "g1", b: "g1", type: "child" }, // will be overridden below
  ];
  // Rebuild: children connect from couple midpoint.
  const connections: Line[] = [
    { a: "gg1", b: "gg2", type: "h" },
    { a: "gg3", b: "gg4", type: "h" },
    { a: "g1", b: "g2", type: "h" },
    { a: "p1", b: "p2", type: "h" },
    // 曾祖父母 → 祖父
    { a: "gg1", partner: "gg2", b: "g1", type: "child" },
    // 曾祖父母 → 祖母
    { a: "gg3", partner: "gg4", b: "g2", type: "child" },
    // 祖父母 → 父
    { a: "g1", partner: "g2", b: "p1", type: "child" },
    // 祖父母 → 母
    { a: "g1", partner: "g2", b: "p2", type: "child" },
    // 父母 → 兄弟妹
    { a: "p1", partner: "p2", b: "s1", type: "child" },
    { a: "p1", partner: "p2", b: "me", type: "child" },
    { a: "p1", partner: "p2", b: "s2", type: "child" },
  ];
  // use connections instead
  lines.length = 0;
  lines.push(...connections);

  const byId: Record<string, Node> = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div
      style={{
        width: 1200,
        minHeight: 800,
        background: "#FFFEF8",
        fontFamily: "'Kaisei Decol', serif",
        position: "relative",
        border: "1.5px solid #1A1915",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          borderBottom: "1.5px solid #1A1915",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Hand>← 戻る</Hand>
          <div style={{ width: 1, height: 20, background: "#1A1915" }} />
          <Title size={18}>田中家</Title>
          <Hand size={11} color="#8B8574">・12世代・148名</Hand>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Hand size={11} color="#C0392B">● 未保存の変更あり</Hand>
          <SketchBtn small>↓ 画像を保存</SketchBtn>
          <SketchBtn small>保存</SketchBtn>
          <SketchBtn small primary>＋ 人物を追加</SketchBtn>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex" }}>
        <div
          style={{
            width: 60,
            borderRight: "1.5px solid #1A1915",
            background: "#F5F0E1",
            padding: "16px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          {["✋", "＋", "🔗", "✎", "📷", "🔍"].map((ic, i) => (
            <div
              key={i}
              style={{
                width: 36,
                height: 36,
                border: "1.5px solid #1A1915",
                borderRadius: 4,
                background: i === 0 ? "#FFFEF8" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                boxShadow: i === 0 ? "2px 2px 0 #1A1915" : "none",
              }}
            >
              {ic}
            </div>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            position: "relative",
            background:
              "repeating-linear-gradient(0deg, transparent 0 39px, #E8E2D0 39px 40px), repeating-linear-gradient(90deg, transparent 0 39px, #E8E2D0 39px 40px), #FFFEF8",
            overflow: "hidden",
          }}
        >
          <svg
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            width="100%"
            height="100%"
          >
            {lines.map((l, i) => {
              const a = byId[l.a];
              const b = byId[l.b];
              // node box ~92 wide x 48 tall; center = x+46, y+24
              if (l.type === "h") {
                // horizontal marriage line between centers at node bottom edge
                return (
                  <line
                    key={i}
                    x1={a.x + 60}
                    y1={a.y + 24}
                    x2={b.x + 32}
                    y2={b.y + 24}
                    stroke="#1A1915"
                    strokeWidth="1.5"
                  />
                );
              } else if (l.type === "child") {
                const partner = byId[l.partner!];
                // midpoint of couple line (between right edge of a and left edge of partner)
                const coupleY = a.y + 24;
                const midX = ((a.x + 60) + (partner.x + 32)) / 2;
                const childTopX = b.x + 46;
                const childTopY = b.y;
                // drop from couple line → down to a shared bus just above children → across → down to child top
                const bus = (coupleY + childTopY) / 2;
                return (
                  <path
                    key={i}
                    d={`M ${midX} ${coupleY} L ${midX} ${bus} L ${childTopX} ${bus} L ${childTopX} ${childTopY}`}
                    stroke="#1A1915"
                    strokeWidth="1.5"
                    fill="none"
                  />
                );
              }
              return null;
            })}
          </svg>

          {nodes.map((n) => (
            <div key={n.id} style={{ position: "absolute", left: n.x, top: n.y }}>
              <PersonNode name={n.name} years={n.years} emph={n.emph} gender={n.g} />
            </div>
          ))}

          <div
            style={{
              position: "absolute",
              right: 16,
              bottom: 16,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {["＋", "－", "⤧"].map((c, i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 32,
                  border: "1.5px solid #1A1915",
                  borderRadius: 4,
                  background: "#FFFEF8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "2px 2px 0 #1A1915",
                  fontSize: 14,
                }}
              >
                {c}
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              left: 16,
              bottom: 16,
              width: 160,
              height: 100,
              border: "1.5px solid #1A1915",
              background: "#FFFEF8",
              padding: 6,
              boxShadow: "2px 2px 0 #1A1915",
            }}
          >
            <Hand size={9} color="#8B8574">全体ビュー</Hand>
            <div
              style={{
                marginTop: 4,
                width: "100%",
                height: "75%",
                background: "#F5F0E1",
                border: "1px dashed #8B8574",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "30%",
                  top: "20%",
                  width: "35%",
                  height: "45%",
                  border: "1.5px solid #C0392B",
                  background: "rgba(192,57,43,0.1)",
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            width: 260,
            borderLeft: "1.5px solid #1A1915",
            padding: "20px 18px",
            background: "#FFFEF8",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <Hand size={10} color="#8B8574" style={{ letterSpacing: "0.15em" }}>
              選択中の人物
            </Hand>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
              <Photo w={56} h={56} round label="写真" />
              <div>
                <Title size={17}>田中 太郎</Title>
                <Hand size={11} color="#6B6456">1985年生まれ・41歳</Hand>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #D6D1C4" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["氏名", "田中 太郎"],
              ["ふりがな", "たなか たろう"],
              ["生年月日", "1985年4月3日"],
              ["出生地", "東京都世田谷区"],
              ["続柄", "長男"],
              ["職業", "会社員"],
            ].map(([k, v]) => (
              <div key={k}>
                <Hand size={10} color="#8B8574">{k}</Hand>
                <div
                  style={{
                    border: "1px solid #D6D1C4",
                    borderRadius: 3,
                    padding: "5px 8px",
                    marginTop: 2,
                    fontFamily: "'Klee One', cursive",
                    fontSize: 12,
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #D6D1C4" }} />

          <div>
            <Hand size={10} color="#8B8574" style={{ letterSpacing: "0.15em" }}>
              思い出・写真（3件）
            </Hand>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <Photo w={50} h={50} label="" />
              <Photo w={50} h={50} label="" />
              <Photo w={50} h={50} label="＋" />
            </div>
          </div>

          <SketchBtn small style={{ marginTop: "auto" }}>詳細を開く →</SketchBtn>
        </div>
      </div>

      <div style={{ position: "absolute", top: 260, left: 80 }}>
        <StickyNote rotate={-5}>
          グリッド背景＝<br />
          原稿用紙の雰囲気。<br />
          余白でゆとりを。
        </StickyNote>
      </div>
      <div style={{ position: "absolute", top: 440, right: 290 }}>
        <StickyNote rotate={3}>
          「私」は朱色の影で<br />
          強調 — 主人公。
        </StickyNote>
      </div>
    </div>
  );
};

export default WireTreeEditor;
