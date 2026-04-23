import React from "react";
import { Link } from "react-router-dom";
import {
  BarePage,
  Hanko,
  Hand,
  Title,
  SketchBtn,
  Row,
  Col,
  Brush,
  C,
  F,
} from "../components/ui";

export default function LandingPage() {
  return (
    <BarePage scroll="flow">
      {/* nav */}
      <Row
        style={{ padding: "18px 40px", borderBottom: `1px solid ${C.line}` }}
        justify="space-between"
      >
        <Row gap={12}>
          <Hanko size={38} />
          <Title size={20}>ファミリーツリー２</Title>
        </Row>
        <Row gap={24}>
          <SketchBtn size="sm" to="/home">
            はじめる
          </SketchBtn>
        </Row>
      </Row>

      {/* hero */}
      <div style={{ padding: "64px 40px 40px", position: "relative" }}>
        <Row align="flex-start" gap={48} wrap>
          <Col gap={20} style={{ flex: 1, minWidth: 360, paddingTop: 20 }}>
            <Hand
              size={12}
              color={C.shu}
              style={{ letterSpacing: "0.25em" }}
            >
              ─── 家族の物語を、絵本のように
            </Hand>
            <Title size={56} style={{ lineHeight: 1.2 }}>
              家族の歴史を、
              <br />
              <span style={{ color: C.shu }}>あなたの端末</span>に。
            </Title>
            <Hand size={15} color={C.sub} style={{ maxWidth: 460 }}>
              写真・エピソード・関係性をひとつの家系図にまとめる、
              端末内完結の家族アルバム。クラウド不要、サインアップ不要、
              プライバシー最優先。
            </Hand>
            <Row gap={12} wrap style={{ marginTop: 8 }}>
              <SketchBtn primary size="lg" icon="＋" to="/new">
                無料で家系図をつくる
              </SketchBtn>
              <SketchBtn size="lg" to="/import">
                取り込み（.ftree2）
              </SketchBtn>
            </Row>
            <Row gap={18} wrap style={{ marginTop: 4 }}>
              <Hand size={11} color={C.pale}>
                ✓ 完全オフライン
              </Hand>
              <Hand size={11} color={C.pale}>
                ✓ サインアップ不要
              </Hand>
              <Hand size={11} color={C.pale}>
                ✓ PWA でホームに追加
              </Hand>
            </Row>
          </Col>

          {/* hero illustration — small tree laid out with the same
              rule as TreeEditor: spouse bar between parents, drop
              from its midpoint, distribution bar, drop to each child.
              Children are anchored to the bottom of the frame. */}
          <div
            style={{
              width: 440,
              height: 340,
              background: "#FBF6E6",
              border: `1px dashed ${C.pale}`,
              borderRadius: 6,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 440 340">
              {(() => {
                const W = 96;
                const H = 48;
                // Generation 1 — two grandparents, gap of 32px.
                const g1y = 40;
                const g1Gap = 32;
                const g1Total = W * 2 + g1Gap;
                const g1x = (440 - g1Total) / 2;
                const gpa = { x: g1x, y: g1y, name: "祖父", d: "1935〜" };
                const gma = { x: g1x + W + g1Gap, y: g1y, name: "祖母", d: "1938〜" };
                // Generation 2 — three children, gap of 24px,
                // anchored to 20px from the bottom.
                const bottomMargin = 20;
                const g2y = 340 - bottomMargin - H;
                const g2Gap = 24;
                const g2Total = W * 3 + g2Gap * 2;
                const g2x = (440 - g2Total) / 2;
                const c1 = { x: g2x, y: g2y, name: "父", d: "1965〜" };
                const c2 = { x: g2x + W + g2Gap, y: g2y, name: "叔父", d: "1968〜" };
                const c3 = { x: g2x + (W + g2Gap) * 2, y: g2y, name: "叔母", d: "1972〜" };
                // Edge geometry.
                const spouseY = g1y + H / 2;
                const spouseX1 = gpa.x + W;
                const spouseX2 = gma.x;
                const midX = (spouseX1 + spouseX2) / 2;
                const distY = (spouseY + g2y) / 2;
                const childMid = (c: { x: number }) => c.x + W / 2;
                const distX1 = Math.min(midX, childMid(c1));
                const distX2 = Math.max(midX, childMid(c3));
                return (
                  <>
                    <g
                      stroke={C.sumi}
                      strokeWidth="1"
                      fill="none"
                      strokeLinecap="round"
                    >
                      {/* spouse bar */}
                      <line x1={spouseX1} y1={spouseY} x2={spouseX2} y2={spouseY} />
                      {/* drop from spouse-bar midpoint */}
                      <line x1={midX} y1={spouseY} x2={midX} y2={distY} />
                      {/* distribution bar */}
                      <line x1={distX1} y1={distY} x2={distX2} y2={distY} />
                      {/* drops to each child */}
                      {[c1, c2, c3].map((c) => (
                        <line
                          key={c.name}
                          x1={childMid(c)}
                          y1={distY}
                          x2={childMid(c)}
                          y2={c.y}
                        />
                      ))}
                    </g>
                    {[gpa, gma, c1, c2, c3].map((p) => (
                      <g key={p.name}>
                        <rect
                          x={p.x}
                          y={p.y}
                          width={W}
                          height={H}
                          fill="#FFFEF8"
                          stroke={C.sumi}
                          rx={3}
                        />
                        <text
                          x={p.x + W / 2}
                          y={p.y + 20}
                          textAnchor="middle"
                          fontFamily={F.mincho}
                          fontSize="13"
                          fill={C.sumi}
                          fontWeight="600"
                        >
                          {p.name}
                        </text>
                        <text
                          x={p.x + W / 2}
                          y={p.y + 37}
                          textAnchor="middle"
                          fontFamily={F.hand}
                          fontSize="10"
                          fill={C.sub}
                        >
                          {p.d}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
            <div style={{ position: "absolute", top: 12, right: 14 }}>
              <Hanko size={40} label="家" />
            </div>
          </div>
        </Row>

      </div>

      <div style={{ padding: "0 40px" }}>
        <Brush width="100%" color={C.shuSoft} />
      </div>

      {/* three features */}
      <div style={{ padding: "56px 40px 48px" }}>
        <Title size={28} style={{ textAlign: "center", marginBottom: 8 }}>
          三つの特長
        </Title>
        <Hand
          size={12}
          color={C.pale}
          style={{ textAlign: "center", display: "block", marginBottom: 36 }}
        >
          ─── three promises
        </Hand>
        <Row gap={24} align="stretch" wrap>
          {[
            {
              n: "一",
              t: "端末内で完結",
              d: "家系情報も写真も端末のみに保存。サーバーへ送信しません。",
            },
            {
              n: "二",
              t: "絵本のような閲覧",
              d: "思い出ノートは一話ずつ。写真10枚まで添えて物語として残せます。",
            },
            {
              n: "三",
              t: "取り込み・書き出し",
              d: ".ftree2 ファイルで家系ごと持ち運び・家族共有。",
            },
          ].map((it) => (
            <Col
              key={it.n}
              gap={10}
              style={{
                flex: 1,
                minWidth: 240,
                padding: 28,
                background: C.paper,
                border: `1px solid ${C.line}`,
                borderRadius: 6,
              }}
            >
              <Title size={44} color={C.shu}>
                {it.n}
              </Title>
              <Title size={18}>{it.t}</Title>
              <Hand size={13} color={C.sub}>
                {it.d}
              </Hand>
            </Col>
          ))}
        </Row>
      </div>

      {/* footer */}
      <div
        style={{
          padding: "24px 40px",
          borderTop: `1px solid ${C.line}`,
          background: "#F6F0DE",
        }}
      >
        <Row justify="space-between" wrap>
          <Hand size={11} color={C.pale}>
            © 2026 ファミリーツリー２
          </Hand>
          <Row gap={16}>
            <Link
              to="/terms"
              style={{
                textDecoration: "none",
                color: C.sub,
                fontFamily: F.hand,
                fontSize: 11,
              }}
            >
              利用規約
            </Link>
            <Link
              to="/privacy"
              style={{
                textDecoration: "none",
                color: C.sub,
                fontFamily: F.hand,
                fontSize: 11,
              }}
            >
              プライバシー
            </Link>
            <Hand size={11} color={C.sub}>
              GitHub
            </Hand>
          </Row>
        </Row>
      </div>
    </BarePage>
  );
}
