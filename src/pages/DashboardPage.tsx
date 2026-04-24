import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarePage,
  Hanko,
  Hand,
  Title,
  SketchBtn,
  Row,
  Chip,
  Grid,
  C,
  F,
} from "../components/ui";
import { useFamilyStore, Family } from "../stores/familyStore";
import { useIsMobile } from "../hooks/useMediaQuery";

const NAV = [
  { i: "家", t: "家系図", to: "/home", active: true },
  { i: "帖", t: "思い出", to: "/family/yamada/memories" },
  { i: "設", t: "設定", to: "/settings" },
];

const Side: React.FC<{
  mobile: boolean;
  open: boolean;
  onClose: () => void;
}> = ({ mobile, open, onClose }) => {
  // モバイルではドロワー（オーバーレイ）。閉じないと main のボタンが押せないので
  // 背景タップで閉じられるようにする。
  if (mobile && !open) return null;
  return (
    <>
      {mobile && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(26,25,21,0.32)",
            zIndex: 40,
          }}
        />
      )}
      <div
        style={{
          position: mobile ? "fixed" : "relative",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: mobile ? 50 : undefined,
          width: mobile ? 240 : 200,
          maxWidth: "80vw",
          background: "#F6F0DE",
          borderRight: `1px solid ${C.line}`,
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flex: "none",
          boxShadow: mobile
            ? "8px 0 24px -8px rgba(0,0,0,0.35)"
            : undefined,
        }}
      >
        <Row
          justify="space-between"
          align="center"
          style={{ marginBottom: 20, padding: "0 4px" }}
        >
          <Row gap={10}>
            <Hanko size={32} />
            <Title size={14}>家系図</Title>
          </Row>
          {mobile && (
            <button
              type="button"
              onClick={onClose}
              aria-label="メニューを閉じる"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: F.mincho,
                fontSize: 22,
                color: C.sub,
                width: 40,
                height: 40,
                borderRadius: 4,
              }}
            >
              ×
            </button>
          )}
        </Row>
        {NAV.map((n) => (
          <Link
            key={n.t}
            to={n.to}
            onClick={onClose}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                padding: "10px 12px",
                minHeight: 44,
                borderRadius: 4,
                background: n.active ? "#FFFEF8" : "transparent",
                border: n.active ? `1px solid ${C.sumi}` : `1px solid transparent`,
                boxShadow: n.active ? `2px 2px 0 ${C.sumi}` : undefined,
                display: "flex",
                gap: 10,
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontFamily: F.mincho,
                  fontSize: 14,
                  color: n.active ? C.shu : C.sub,
                  width: 22,
                  height: 22,
                  borderRadius: 3,
                  border: `1px solid ${n.active ? C.shu : C.pale}`,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {n.i}
              </span>
              <Hand size={13} color={n.active ? C.sumi : C.sub} bold={n.active}>
                {n.t}
              </Hand>
            </div>
          </Link>
        ))}
        <div style={{ flex: 1 }} />
        <Hand size={10} color={C.pale}>
          v0.1.0 ／ 端末のみ
        </Hand>
      </div>
    </>
  );
};

const FamilyCard: React.FC<{ fam: Family }> = ({ fam }) => {
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  return (
    <div
      style={{
        position: "relative",
        background: C.paper,
        border: `1px solid ${C.sumi}`,
        borderRadius: 6,
        boxShadow: `3px 3px 0 ${C.sumi}`,
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Link
        to={`/family/${fam.id}/tree`}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <div
          style={{
            height: 78,
            background: "#F6F0DE",
            borderBottom: `1px solid ${C.sumi}`,
            borderRadius: "6px 6px 0 0",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", right: 10, top: 10 }}>
            <Hanko size={28} />
          </div>
          <svg width="100%" height="78" style={{ opacity: 0.45 }}>
            <g stroke={C.sumi} fill="none" strokeWidth="0.6">
              <line x1="50%" y1="16" x2="50%" y2="30" />
              <line x1="36" y1="36" x2="82%" y2="36" />
              <line x1="36" y1="36" x2="36" y2="50" />
              <line x1="50%" y1="36" x2="50%" y2="50" />
              <line x1="82%" y1="36" x2="82%" y2="50" />
            </g>
            <rect x="42%" y="2" width="60" height="16" fill="#FFFEF8" stroke={C.sumi} />
            <rect x="20" y="52" width="50" height="20" fill="#FFFEF8" stroke={C.sumi} />
            <rect x="45%" y="52" width="50" height="20" fill="#FFFEF8" stroke={C.sumi} />
            <rect x="72%" y="52" width="50" height="20" fill="#FFFEF8" stroke={C.sumi} />
          </svg>
        </div>
        <div style={{ padding: "12px 16px", flex: 1 }}>
          <Title size={16}>{fam.name}</Title>
          <Row gap={10} style={{ marginTop: 6 }}>
            <Chip>人物 {Object.keys(fam.people).length}</Chip>
            <Chip tone="mute">{fam.generations}世代</Chip>
          </Row>
          <Hand size={11} color={C.pale} style={{ marginTop: 8, display: "block" }}>
            最終更新 {fam.lastUpdated}
          </Hand>
        </div>
      </Link>

      {/* Kebab menu — bottom-right of card */}
      <div ref={ref} style={{ position: "absolute", right: 8, bottom: 8 }}>
        <button
          type="button"
          aria-label="この家系のメニュー"
          title="メニュー"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: menuOpen ? "#F6F0DE" : "transparent",
            border: `1px solid ${menuOpen ? C.sumi : C.line}`,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            fontFamily: F.mincho,
            fontSize: 18,
            color: C.sub,
            padding: 0,
            lineHeight: 1,
          }}
        >
          ⋮
        </button>
        {menuOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: 38,
              minWidth: 160,
              background: C.paper,
              border: `1.5px solid ${C.sumi}`,
              borderRadius: 4,
              boxShadow: `3px 3px 0 ${C.sumi}, 0 20px 40px -15px rgba(0,0,0,0.35)`,
              padding: 6,
              zIndex: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                nav(`/family/${fam.id}/tree`);
              }}
              style={menuBtnStyle()}
            >
              開く
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                nav(`/settings`);
              }}
              style={menuBtnStyle()}
            >
              書き出し…
            </button>
            <div style={{ height: 1, background: C.line, margin: "4px 2px" }} />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                nav(`/family/${fam.id}/delete`);
              }}
              style={menuBtnStyle(true)}
            >
              削除…
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function menuBtnStyle(danger = false): React.CSSProperties {
  return {
    width: "100%",
    textAlign: "left",
    background: "transparent",
    border: "none",
    borderRadius: 3,
    padding: "7px 12px",
    fontFamily: F.hand,
    fontSize: 13,
    color: danger ? C.shu : C.sumi,
    cursor: "pointer",
  };
}

export default function DashboardPage() {
  const families = useFamilyStore((s) => Object.values(s.families));
  const isMobile = useIsMobile();
  const [sideOpen, setSideOpen] = useState(false);

  return (
    <BarePage>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Side mobile={isMobile} open={sideOpen} onClose={() => setSideOpen(false)} />
        <div
          style={{
            flex: 1,
            position: "relative",
            padding: isMobile ? "14px 16px" : "24px 36px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Grid opacity={0.05} />
          {/* モバイル用：サイドメニュー呼び出しボタン */}
          {isMobile && (
            <Row
              align="center"
              style={{ marginBottom: 10, flex: "none" }}
              gap={10}
            >
              <button
                type="button"
                onClick={() => setSideOpen(true)}
                aria-label="メニューを開く"
                style={{
                  width: 44,
                  height: 44,
                  border: `1px solid ${C.sumi}`,
                  borderRadius: 4,
                  background: C.paper,
                  fontFamily: F.mincho,
                  fontSize: 18,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ☰
              </button>
              <Hanko size={32} />
              <Title size={16}>家系図</Title>
            </Row>
          )}
          <Row
            justify="space-between"
            align={isMobile ? "stretch" : "flex-end"}
            style={{
              marginBottom: 8,
              flex: "none",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 12 : 0,
            } as React.CSSProperties}
            gap={10}
          >
            <div>
              <Hand size={12} color={C.shu} style={{ letterSpacing: "0.2em" }}>
                ─── MY FAMILY TREES
              </Hand>
              <Title size={isMobile ? 22 : 28}>あなたの家系</Title>
              <Hand size={12} color={C.sub}>
                {families.length} つの家系が端末に保存されています
              </Hand>
            </div>
            <Row gap={10} wrap>
              <SketchBtn icon="↥" size={isMobile ? "sm" : "md"} to="/import">
                ファイル取り込み
              </SketchBtn>
              <SketchBtn icon="開" size={isMobile ? "sm" : "md"} to="/open">
                開く
              </SketchBtn>
              <SketchBtn primary icon="＋" size={isMobile ? "sm" : "md"} to="/new">
                新規
              </SketchBtn>
            </Row>
          </Row>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 18,
              marginTop: 20,
              flex: 1,
              minHeight: 0,
              alignContent: "start",
              overflowY: "auto",
            }}
          >
            {families.map((fam) => (
              <FamilyCard key={fam.id} fam={fam} />
            ))}
            {families.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: 40,
                  textAlign: "center",
                  border: `1.5px dashed ${C.pale}`,
                  borderRadius: 6,
                  background: "#FBF6E6",
                }}
              >
                <Title size={22}>最初の家系を始めましょう</Title>
                <Hand
                  size={12}
                  color={C.sub}
                  style={{ display: "block", marginTop: 8 }}
                >
                  まずは「私」から。親や兄弟を少しずつ足していけます。
                </Hand>
              </div>
            )}
            <Link to="/new" style={{ textDecoration: "none" }}>
              <div
                style={{
                  border: `1.5px dashed ${C.pale}`,
                  borderRadius: 6,
                  minHeight: 180,
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                  color: C.pale,
                  fontFamily: F.hand,
                  fontSize: 13,
                  gap: 6,
                  cursor: "pointer",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, color: C.sumi }}>＋</div>
                  新しい家系を始める
                </div>
              </div>
            </Link>
          </div>

          <Hand
            size={11}
            color={C.pale}
            style={{ marginTop: 10, flex: "none", alignSelf: "flex-end" }}
          >
            保存先: この端末（localStorage ＋ IndexedDB）
          </Hand>
        </div>
      </div>
    </BarePage>
  );
}
