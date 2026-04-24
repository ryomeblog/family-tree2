import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Hanko, Hand, Title, C, F, Row } from "../components/ui";
import { useFamilyStore } from "../stores/familyStore";
import { writeFtree2 } from "../features/importExport/writeFtree2";

const MenuRow: React.FC<{
  icon: string;
  label: string;
  hint?: string;
  danger?: boolean;
  onClick?: () => void;
  to?: string;
  active?: boolean;
}> = ({ icon, label, hint, danger, onClick, to, active }) => {
  const inner = (
    <div
      style={{
        padding: "9px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: active ? "#FBF6E6" : "transparent",
        color: danger ? C.shu : C.sumi,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 3,
          border: `1px solid ${danger ? C.shu : C.line}`,
          display: "grid",
          placeItems: "center",
          fontFamily: F.mincho,
          fontSize: 12,
          color: danger ? C.shu : C.sub,
          flex: "none",
        }}
      >
        {icon}
      </span>
      <div style={{ flex: 1 }}>
        <Hand size={13} color={danger ? C.shu : C.sumi} bold>
          {label}
        </Hand>
        {hint && (
          <div>
            <Hand size={10.5} color={C.pale}>
              {hint}
            </Hand>
          </div>
        )}
      </div>
    </div>
  );
  const common: React.CSSProperties = {
    display: "block",
    textDecoration: "none",
    color: "inherit",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    width: "100%",
    textAlign: "left",
    padding: 0,
    font: "inherit",
  };
  if (to) {
    return (
      <Link to={to} style={common} onClick={onClick}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} style={common}>
      {inner}
    </button>
  );
};

const Divider = () => (
  <div style={{ height: 1, background: C.line, margin: "6px 0" }} />
);

export default function FamilyMenuDropdown({
  familyId,
  onNavigate,
}: {
  familyId: string;
  onNavigate: () => void;
}) {
  const nav = useNavigate();
  const loc = useLocation();
  const store = useFamilyStore();
  const families = Object.values(store.families);
  const current = store.families[familyId];

  // 切替先のパス：現在のページ種別を維持して別家系へ。
  // 例) /family/A/memories → /family/B/memories
  //     /family/A/memory/mid → /family/B/memories （具体的な memory ID は引き継げない）
  //     /family/A/person/pid → /family/B/tree （同上）
  //     それ以外 → /family/B/tree
  const targetPathFor = (id: string) => {
    const m = loc.pathname.match(/^\/family\/[^/]+\/([^/]+)(\/|$)/);
    const section = m?.[1] ?? "tree";
    if (section === "memories" || section === "memory") return `/family/${id}/memories`;
    if (section === "tree") return `/family/${id}/tree`;
    return `/family/${id}/tree`;
  };

  const onSwitch = (id: string) => {
    store.setActiveFamily(id);
    nav(targetPathFor(id));
    onNavigate();
  };
  const onExport = async () => {
    try {
      onNavigate();
      await writeFtree2(familyId);
      store.setLastExport();
    } catch (e) {
      store.showToast("err", "書き出しに失敗しました");
      console.error(e);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        width: 320,
        background: C.paper,
        border: `1.5px solid ${C.sumi}`,
        borderRadius: 4,
        boxShadow: `4px 4px 0 ${C.sumi}, 0 20px 40px -15px rgba(0,0,0,0.35)`,
        overflow: "hidden",
        zIndex: 40,
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          background: "#FBF6E6",
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <Hand size={10} color={C.pale} style={{ letterSpacing: "0.2em" }}>
          現在の家系
        </Hand>
        <Row gap={10} style={{ marginTop: 4 }}>
          <Hanko size={28} />
          <Title size={16}>{current?.name ?? "—"}</Title>
        </Row>
        <Hand size={10.5} color={C.sub}>
          人物 {current ? Object.keys(current.people).length : 0} ・ 思い出{" "}
          {current ? Object.keys(current.memories).length : 0}
        </Hand>
      </div>

      <div style={{ padding: "6px 0" }}>
        <Hand
          size={10}
          color={C.pale}
          style={{ padding: "4px 14px", display: "block" }}
        >
          家系を切り替える
        </Hand>
        {families.map((f) => (
          <MenuRow
            key={f.id}
            icon="家"
            label={f.name}
            hint={
              f.id === familyId
                ? "✓ 表示中"
                : `${Object.keys(f.people).length} 人物 ・ ${f.generations} 世代`
            }
            active={f.id === familyId}
            onClick={() => onSwitch(f.id)}
          />
        ))}
        <Divider />
        <MenuRow
          icon="帖"
          label="思い出ノート"
          to={`/family/${familyId}/memories`}
          onClick={onNavigate}
        />
        <Divider />
        <MenuRow
          icon="+"
          label="新しい家系を作る"
          to="/new"
          onClick={onNavigate}
        />
        <MenuRow
          icon="↥"
          label="ファイルから取り込む"
          hint=".ftree2"
          to="/import"
          onClick={onNavigate}
        />
        <MenuRow
          icon="↓"
          label="この家系を書き出す"
          hint=".ftree2 として保存"
          onClick={onExport}
        />
        <Divider />
        <MenuRow
          icon="色"
          label="テーマを変える"
          to="/settings"
          onClick={onNavigate}
        />
        <MenuRow
          icon="✕"
          label="この家系を削除…"
          danger
          to={`/family/${familyId}/delete`}
          onClick={onNavigate}
        />
      </div>
    </div>
  );
}
