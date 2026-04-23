// Wireframe 13 — Relation add (drag-out to connect)
import React from "react";
import { Title, Hand, SketchBtn, PersonNode, StickyNote } from "./primitives";

const ChoiceCard: React.FC<{
  icon: string;
  label: string;
  detail: string;
  selected?: boolean;
}> = ({ icon, label, detail, selected }) => (
  <div
    style={{
      border: `${selected ? 2.2 : 1.5}px solid ${selected ? "#C0392B" : "#1A1915"}`,
      borderRadius: 6,
      padding: "12px 14px",
      background: selected ? "#FBE4E0" : "#FFFEF8",
      boxShadow: selected ? "2px 2px 0 #C0392B" : "1.5px 1.5px 0 #1A1915",
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
    }}
  >
    <div style={{ fontSize: 22 }}>{icon}</div>
    <div>
      <Hand size={13}>{label}</Hand>
      <div>
        <Hand size={11} color="#6B6456">{detail}</Hand>
      </div>
    </div>
  </div>
);

export const WireRelationAdd: React.FC = () => (
  <div
    style={{
      width: 1200,
      height: 800,
      background: "#FFFEF8",
      border: "1.5px solid #1A1915",
      fontFamily: "'Kaisei Decol', serif",
      padding: 40,
      position: "relative",
    }}
  >
    <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.2em" }}>
      ─── ADD RELATION
    </Hand>
    <Title size={26} style={{ marginTop: 4, marginBottom: 10 }}>
      関係を追加する
    </Title>
    <Hand size={12} color="#6B6456">ノードから線をドラッグするか、インスペクタから選択</Hand>

    {/* Canvas area */}
    <div
      style={{
        marginTop: 24,
        height: 480,
        border: "1.5px solid #1A1915",
        borderRadius: 4,
        background:
          "repeating-linear-gradient(0deg, transparent 0 39px, #E8E2D0 39px 40px), repeating-linear-gradient(90deg, transparent 0 39px, #E8E2D0 39px 40px)",
        position: "relative",
      }}
    >
      {/* existing node */}
      <div style={{ position: "absolute", left: 140, top: 160 }}>
        <PersonNode name="田中 太郎" years="1985–" gender="m" emph />
      </div>

      {/* drag handle coming out */}
      <svg
        style={{ position: "absolute", left: 230, top: 180, pointerEvents: "none" }}
        width="320"
        height="220"
      >
        <path
          d="M 0 30 C 100 30, 200 160, 300 160"
          stroke="#C0392B"
          strokeWidth="2.5"
          strokeDasharray="6 4"
          fill="none"
        />
        <circle cx="300" cy="160" r="10" fill="#C0392B" />
        <text x="300" y="164" textAnchor="middle" fontSize="11" fill="#FFFEF8" fontFamily="Kaisei Decol">
          ＋
        </text>
      </svg>

      {/* drop target picker */}
      <div
        style={{
          position: "absolute",
          left: 540,
          top: 110,
          width: 280,
          background: "#FFFEF8",
          border: "1.5px solid #1A1915",
          borderRadius: 6,
          boxShadow: "4px 4px 0 #1A1915",
          padding: 14,
        }}
      >
        <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.2em" }}>
          ─── TYPE
        </Hand>
        <Title size={14} style={{ marginTop: 4, marginBottom: 10 }}>
          どんな関係？
        </Title>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ChoiceCard icon="💑" label="配偶者・パートナー" detail="結婚／再婚／事実婚" selected />
          <ChoiceCard icon="👶" label="子ども" detail="実子／養子／継子" />
          <ChoiceCard icon="👴" label="親" detail="父／母／養親" />
          <ChoiceCard icon="👫" label="きょうだい" detail="同じ親を共有" />
        </div>

        <div style={{ height: 1, background: "#E8E2D0", margin: "12px 0" }} />
        <Hand size={11} color="#6B6456">相手は？</Hand>
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <div style={{ flex: 1 }}>
            <SketchBtn small>＋ 新しい人物</SketchBtn>
          </div>
          <div style={{ flex: 1 }}>
            <SketchBtn small>既存から選ぶ</SketchBtn>
          </div>
        </div>
      </div>
    </div>

    {/* advanced options under */}
    <div
      style={{
        marginTop: 16,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 16,
      }}
    >
      <div style={{ border: "1.2px dashed #1A1915", borderRadius: 4, padding: 12 }}>
        <Hand size={11} color="#8B8574">結婚年（わかれば）</Hand>
        <div style={{ marginTop: 6 }}>
          <Hand size={13}>1983年</Hand>
        </div>
      </div>
      <div style={{ border: "1.2px dashed #1A1915", borderRadius: 4, padding: 12 }}>
        <Hand size={11} color="#8B8574">関係の種別</Hand>
        <div style={{ marginTop: 6 }}>
          <Hand size={13}>結婚 ／ 現在も続いている</Hand>
        </div>
      </div>
      <div style={{ border: "1.2px dashed #1A1915", borderRadius: 4, padding: 12 }}>
        <Hand size={11} color="#8B8574">これは再婚？</Hand>
        <div style={{ marginTop: 6 }}>
          <Hand size={13}>いいえ ／ 新しいUnion</Hand>
        </div>
      </div>
    </div>

    <div style={{ position: "absolute", top: 80, right: 40 }}>
      <StickyNote rotate={4}>
        ドラッグで出した<br />
        ピンを離すと<br />
        このポップが出る。
      </StickyNote>
    </div>
  </div>
);

export default WireRelationAdd;
