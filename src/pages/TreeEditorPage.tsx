import React, { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useNavigate, useParams } from "react-router-dom";
import SearchPopover from "../modals/SearchPopover";
import {
  BarePage,
  AppHeader,
  Hand,
  Title,
  SketchBtn,
  StickyNote,
  Row,
  Col,
  Grid,
  Photo,
  Chip,
  InkDot,
  C,
  F,
} from "../components/ui";
import {
  useFamilyStore,
  Person,
  formatPerson,
  formatBirthYear,
} from "../stores/familyStore";

type ToolMode = "select" | "add" | "line" | "edit" | "photo" | "search";
const TOOLS: { k: ToolMode; i: string; t: string }[] = [
  { k: "select", i: "◉", t: "選択" },
  { k: "add", i: "＋", t: "追加" },
  { k: "line", i: "／", t: "線" },
  { k: "edit", i: "筆", t: "編集" },
  { k: "photo", i: "写", t: "写真" },
  { k: "search", i: "⌕", t: "検索" },
];

// ── Layout engine: subtree-based. Each person's subtree is sized
// bottom-up, and parents are centered above their children's subtree
// mid-x. Spacing between siblings therefore grows with the descendants
// they carry — deeper subtrees push out the top-level gap more.
// ────────────────────────────────────────────────────────────────────
interface Node {
  id: string;
  x: number;
  y: number;
  person: Person;
}

interface UnionEdge {
  type: "union";
  unionId: string;
  aId: string;
  bId: string;
  childIds: string[];
}

interface SingleEdge {
  type: "single";
  parentId: string;
  childIds: string[];
}

type TreeEdge = UnionEdge | SingleEdge;

const NODE_W = 144;
const NODE_H = 76;
const SPOUSE_GAP = 28;
const SIBLING_GAP = 48;
const GEN_GAP = 170;
const ORIGIN_Y = 60;
const MARGIN_X = 60;

type FamilyArg = ReturnType<typeof useFamilyStore.getState>["families"][string];

interface Entry {
  person: Person;
  spouse?: Person;
  unionId?: string;
  children: Entry[];
}

function layoutFamily(fam: FamilyArg) {
  const usedUnions = new Set<string>();
  const placed = new Set<string>();

  function buildEntry(personId: string): Entry | null {
    const person = fam.people[personId];
    if (!person || placed.has(person.id)) return null;
    placed.add(person.id);

    // Pick the first unused union that this person is a partner in.
    const union = fam.unions.find(
      (u) =>
        !usedUnions.has(u.id) &&
        (u.partnerA === person.id || u.partnerB === person.id),
    );

    let spouse: Person | undefined;
    let unionId: string | undefined;
    const children: Entry[] = [];

    if (union) {
      usedUnions.add(union.id);
      unionId = union.id;
      const spouseId =
        union.partnerA === person.id ? union.partnerB : union.partnerA;
      const sp = fam.people[spouseId];
      if (sp && !placed.has(sp.id)) {
        spouse = sp;
        placed.add(sp.id);
      } else if (sp) {
        // spouse already placed elsewhere; treat as leaf partner here
        spouse = sp;
      }
      const childIds = fam.links
        .filter((l) => l.parentUnion === union.id)
        .map((l) => l.childId);
      for (const cid of childIds) {
        const ce = buildEntry(cid);
        if (ce) children.push(ce);
      }
    }

    // Also pick up direct parent links without a union (single-parent
    // relationships created via "parentId" rather than "parentUnion").
    const directChildIds = fam.links
      .filter((l) => l.parentId === person.id && !l.parentUnion)
      .map((l) => l.childId);
    for (const cid of directChildIds) {
      const ce = buildEntry(cid);
      if (ce) children.push(ce);
    }

    return { person, spouse, unionId, children };
  }

  const selfWidth = (e: Entry) =>
    e.spouse ? NODE_W * 2 + SPOUSE_GAP : NODE_W;

  function computeWidth(e: Entry): number {
    const sw = selfWidth(e);
    if (e.children.length === 0) return sw;
    const cws = e.children.map(computeWidth);
    const total =
      cws.reduce((a, b) => a + b, 0) + SIBLING_GAP * (cws.length - 1);
    return Math.max(sw, total);
  }

  const nodes: Node[] = [];
  const edges: TreeEdge[] = [];

  function place(e: Entry, startX: number, y: number): void {
    const width = computeWidth(e);
    const sw = selfWidth(e);
    const center = startX + width / 2;

    if (e.children.length > 0) {
      const cws = e.children.map(computeWidth);
      const childTotal =
        cws.reduce((a, b) => a + b, 0) + SIBLING_GAP * (cws.length - 1);
      let cursor = center - childTotal / 2;
      e.children.forEach((c, i) => {
        place(c, cursor, y + GEN_GAP);
        cursor += cws[i] + SIBLING_GAP;
      });
      if (e.unionId && e.spouse) {
        edges.push({
          type: "union",
          unionId: e.unionId,
          aId: e.person.id,
          bId: e.spouse.id,
          childIds: e.children.map((c) => c.person.id),
        });
      } else {
        edges.push({
          type: "single",
          parentId: e.person.id,
          childIds: e.children.map((c) => c.person.id),
        });
      }
    } else if (e.unionId && e.spouse) {
      edges.push({
        type: "union",
        unionId: e.unionId,
        aId: e.person.id,
        bId: e.spouse.id,
        childIds: [],
      });
    }

    const selfX = center - sw / 2;
    nodes.push({ id: e.person.id, person: e.person, x: selfX, y });
    if (e.spouse) {
      nodes.push({
        id: e.spouse.id,
        person: e.spouse,
        x: selfX + NODE_W + SPOUSE_GAP,
        y,
      });
    }
  }

  // Roots = people not referenced as childId in any link.
  const childIds = new Set(fam.links.map((l) => l.childId));
  const allPersons = Object.values(fam.people);
  const rootEntries: Entry[] = [];
  for (const p of allPersons) {
    if (childIds.has(p.id)) continue;
    if (placed.has(p.id)) continue;
    const e = buildEntry(p.id);
    if (e) rootEntries.push(e);
  }
  // Orphans: anyone still unplaced (cycles, etc).
  for (const p of allPersons) {
    if (placed.has(p.id)) continue;
    const e = buildEntry(p.id);
    if (e) rootEntries.push(e);
  }

  const rootWidths = rootEntries.map(computeWidth);
  const totalW =
    rootWidths.reduce((a, b) => a + b, 0) +
    SIBLING_GAP * Math.max(0, rootWidths.length - 1);

  let cursor = MARGIN_X;
  rootEntries.forEach((e, i) => {
    place(e, cursor, ORIGIN_Y);
    cursor += rootWidths[i] + SIBLING_GAP;
  });

  const maxY = nodes.reduce((m, n) => Math.max(m, n.y), 0);

  return {
    nodes,
    edges,
    width: MARGIN_X * 2 + totalW,
    height: maxY + NODE_H + MARGIN_X,
  };
}

// ── Main page ────────────────────────────────────────────────────────
export default function TreeEditorPage() {
  const { fid = "yamada" } = useParams();
  const nav = useNavigate();
  const store = useFamilyStore();
  const family = store.families[fid];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lineFirst, setLineFirst] = useState<string | null>(null);
  const [mode, setMode] = useState<ToolMode>("select");
  const [searchOpen, setSearchOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );

  const layout = useMemo(() => (family ? layoutFamily(family) : null), [family]);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const onSave = () => {
    // Persistence happens automatically via the Zustand persist
    // middleware; this just clears the dirty flag + gives feedback.
    store.markClean();
    store.showToast("ok", "保存しました");
  };
  const onExport = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        backgroundColor: "#FFFEF8",
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${family?.name ?? "family"}_tree.png`;
      a.click();
      store.showToast("ok", "PNG を書き出しました");
    } catch (e) {
      console.error(e);
      store.showToast("err", "書き出しに失敗しました");
    }
  };

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (mode !== "select" && mode !== "photo") return;
    dragging.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
    };
  };
  const onCanvasMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setPan({
      x: dragging.current.originX + (e.clientX - dragging.current.startX),
      y: dragging.current.originY + (e.clientY - dragging.current.startY),
    });
  };
  const onCanvasMouseUp = () => {
    dragging.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) => Math.max(0.4, Math.min(1.8, z - e.deltaY * 0.001)));
  };

  const selected = selectedId ? family?.people[selectedId] : undefined;

  const onClickNode = (id: string) => {
    if (mode === "edit") {
      nav(`/family/${fid}/person/${id}/edit`);
      return;
    }
    if (mode === "line") {
      if (!lineFirst) {
        setLineFirst(id);
        setSelectedId(id);
        store.showToast("ok", "相手のノードをクリックしてください");
        return;
      }
      if (lineFirst === id) {
        store.showToast("warn", "同じ人物は選べません");
        return;
      }
      const a = lineFirst;
      setLineFirst(null);
      nav(`/family/${fid}/relate?pid=${a}&partner=${id}`);
      return;
    }
    setSelectedId(id);
    setInspectorOpen(true);
  };
  const onAddPersonFromNode = () => {
    nav(`/family/${fid}/person/new`);
  };

  return (
    <BarePage>
      <AppHeader
        familyName={family?.name ?? "—"}
        back
        backTo="/home"
        showFamilyMenu
        familyId={fid}
        right={
          <Row gap={10}>
            {store.dirty && (
              <Hand size={11} color={C.shu}>
                ● 未保存の変更あり
              </Hand>
            )}
            <SketchBtn size="sm" icon="↓" onClick={onExport}>
              画像を保存
            </SketchBtn>
            <SketchBtn size="sm" primary icon="保" onClick={onSave}>
              保存
            </SketchBtn>
            <SketchBtn size="sm" icon="＋" onClick={onAddPersonFromNode}>
              人物を追加
            </SketchBtn>
          </Row>
        }
      />

      <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden" }}>
        {/* Toolbar */}
        <div
          style={{
            width: 56,
            background: "#F6F0DE",
            borderRight: `1px solid ${C.line}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "14px 0",
            gap: 4,
            flex: "none",
          }}
        >
          {TOOLS.map((t) => {
            const active = mode === t.k;
            return (
              <button
                key={t.k}
                type="button"
                onClick={() => {
                  setMode(t.k);
                  if (t.k === "add") nav(`/family/${fid}/person/new`);
                  if (t.k === "search") setSearchOpen((s) => !s);
                }}
                title={t.t}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 4,
                  background: active ? C.paper : "transparent",
                  border: active ? `1px solid ${C.sumi}` : "1px solid transparent",
                  boxShadow: active ? `1.5px 1.5px 0 ${C.sumi}` : undefined,
                  color: active ? C.shu : C.sub,
                  fontFamily: F.mincho,
                  fontSize: 16,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {t.i}
              </button>
            );
          })}
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            cursor: dragging.current ? "grabbing" : "grab",
            userSelect: "none",
          }}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onMouseLeave={onCanvasMouseUp}
          onWheel={onWheel}
        >
          <Grid opacity={0.1} size={28} />

          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              transition: dragging.current ? "none" : "transform 140ms ease",
            }}
          >
            {layout && <EdgesLayer layout={layout} />}
            {layout?.nodes.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClickNode(n.id);
                }}
                onDoubleClick={() => nav(`/family/${fid}/person/${n.id}`)}
                style={{
                  position: "absolute",
                  left: n.x,
                  top: n.y,
                  width: NODE_W,
                  height: NODE_H,
                  background: C.paper,
                  border: `${selectedId === n.id ? 2 : 1}px solid ${
                    selectedId === n.id ? C.shu : C.sumi
                  }`,
                  borderRadius: 4,
                  boxShadow:
                    selectedId === n.id ? `2px 2px 0 ${C.shu}` : `2px 2px 0 ${C.sumi}`,
                  padding: "6px 10px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  cursor: "pointer",
                  fontFamily: F.mincho,
                }}
              >
                {n.person.role && (
                  <span style={{ fontFamily: F.hand, fontSize: 10, color: C.pale }}>
                    {n.person.role}
                  </span>
                )}
                <span style={{ fontSize: 15, fontWeight: 500 }}>
                  {formatPerson(n.person)}
                </span>
                <span style={{ fontFamily: F.hand, fontSize: 10, color: C.sub }}>
                  {formatBirthYear(n.person)}
                  {n.person.deceased ? "  ✿" : ""}
                </span>
              </button>
            ))}
          </div>

          {/* Floating hints */}
          {mode === "add" && (
            <div style={{ position: "absolute", top: 40, right: 40 }}>
              <StickyNote rotate={-3} width={170}>
                「追加」モード中。
                <br />
                ノードを選ぶか、右上の「人物を追加」から。
              </StickyNote>
            </div>
          )}

          {searchOpen && (
            <SearchPopover
              familyId={fid}
              scope="all"
              onClose={() => setSearchOpen(false)}
              containerStyle={{
                position: "absolute",
                top: 18,
                left: 18,
                width: 360,
                maxWidth: "calc(100vw - 120px)",
                background: C.paper,
                border: `1.5px solid ${C.sumi}`,
                borderRadius: 4,
                boxShadow: `4px 4px 0 ${C.sumi}, 0 20px 40px -15px rgba(0,0,0,0.35)`,
                overflow: "hidden",
                zIndex: 40,
              }}
            />
          )}

          {/* MiniMap */}
          <div
            style={{
              position: "absolute",
              left: 18,
              bottom: 18,
              width: 170,
              height: 110,
              background: "rgba(255,254,248,0.92)",
              border: `1px solid ${C.sumi}`,
              borderRadius: 4,
              padding: 6,
            }}
          >
            <Hand size={9} color={C.pale}>
              全体図
            </Hand>
            <svg width="100%" height="90%" viewBox={`0 0 ${layout?.width ?? 1000} ${layout?.height ?? 800}`}>
              {layout?.nodes.map((n) => (
                <rect
                  key={n.id}
                  x={n.x}
                  y={n.y}
                  width={NODE_W}
                  height={NODE_H}
                  fill={selectedId === n.id ? C.shu : C.sumi}
                  opacity={selectedId === n.id ? 0.7 : 0.2}
                />
              ))}
            </svg>
          </div>

          {/* Zoom controls */}
          <div
            style={{
              position: "absolute",
              right: 18,
              bottom: 18,
              background: C.paper,
              border: `1px solid ${C.sumi}`,
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              boxShadow: `2px 2px 0 ${C.sumi}`,
            }}
          >
            {[
              { k: "in", label: "＋", h: 28, on: () => setZoom((z) => Math.min(1.8, z + 0.1)) },
              {
                k: "val",
                label: `${Math.round(zoom * 100)}%`,
                h: 24,
                on: () => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                },
              },
              { k: "out", label: "−", h: 28, on: () => setZoom((z) => Math.max(0.4, z - 0.1)) },
              {
                k: "fit",
                label: "⤢",
                h: 28,
                on: () => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                },
              },
            ].map((b, i) => (
              <button
                key={b.k}
                type="button"
                onClick={b.on}
                style={{
                  width: 36,
                  height: b.h,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: F.hand,
                  fontSize: 13,
                  color: C.sumi,
                  background: "transparent",
                  border: "none",
                  borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                  cursor: "pointer",
                }}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Inspector toggle (when closed) */}
          {!inspectorOpen && (
            <button
              type="button"
              onClick={() => setInspectorOpen(true)}
              style={{
                position: "absolute",
                right: 18,
                top: 18,
                width: 36,
                height: 36,
                background: C.paper,
                border: `1px solid ${C.sumi}`,
                borderRadius: 4,
                boxShadow: `2px 2px 0 ${C.sumi}`,
                cursor: "pointer",
                fontFamily: F.mincho,
                fontSize: 16,
              }}
              title="インスペクターを開く"
            >
              ‹
            </button>
          )}
        </div>

        {/* Inspector */}
        {inspectorOpen && (
          <Inspector
            person={selected}
            familyId={fid}
            onClose={() => setInspectorOpen(false)}
          />
        )}
      </div>
    </BarePage>
  );
}

const EdgesLayer: React.FC<{
  layout: { nodes: Node[]; edges: TreeEdge[]; width: number; height: number };
}> = ({ layout }) => {
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));
  return (
    <svg
      width={layout.width}
      height={layout.height}
      style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
    >
      <g stroke={C.sumi} strokeWidth="1" fill="none" strokeLinecap="round">
        {layout.edges.map((edge, idx) => {
          if (edge.type === "union") {
            const a = byId.get(edge.aId);
            const b = byId.get(edge.bId);
            if (!a || !b) return null;
            const left = a.x < b.x ? a : b;
            const right = a.x < b.x ? b : a;
            const y = a.y + NODE_H / 2;
            const barStart = left.x + NODE_W;
            const barEnd = right.x;
            const unionMid = (barStart + barEnd) / 2;

            if (edge.childIds.length === 0) {
              return (
                <line
                  key={`u-${idx}`}
                  x1={barStart}
                  y1={y}
                  x2={barEnd}
                  y2={y}
                />
              );
            }
            const children = edge.childIds
              .map((id) => byId.get(id))
              .filter(Boolean) as Node[];
            const childY = children[0].y;
            const distY = (y + childY) / 2;
            const centers = children.map((c) => c.x + NODE_W / 2);
            const barLeft = Math.min(unionMid, ...centers);
            const barRight = Math.max(unionMid, ...centers);
            return (
              <g key={`u-${idx}`}>
                <line x1={barStart} y1={y} x2={barEnd} y2={y} />
                <line x1={unionMid} y1={y} x2={unionMid} y2={distY} />
                <line x1={barLeft} y1={distY} x2={barRight} y2={distY} />
                {centers.map((cx, i) => (
                  <line
                    key={i}
                    x1={cx}
                    y1={distY}
                    x2={cx}
                    y2={childY}
                  />
                ))}
              </g>
            );
          }
          // single-parent edge
          const p = byId.get(edge.parentId);
          if (!p || edge.childIds.length === 0) return null;
          const children = edge.childIds
            .map((id) => byId.get(id))
            .filter(Boolean) as Node[];
          if (children.length === 0) return null;
          const parentBottomX = p.x + NODE_W / 2;
          const parentBottomY = p.y + NODE_H;
          const childY = children[0].y;
          const distY = (parentBottomY + childY) / 2;
          const centers = children.map((c) => c.x + NODE_W / 2);
          const barLeft = Math.min(parentBottomX, ...centers);
          const barRight = Math.max(parentBottomX, ...centers);
          return (
            <g key={`s-${idx}`}>
              <line
                x1={parentBottomX}
                y1={parentBottomY}
                x2={parentBottomX}
                y2={distY}
              />
              <line x1={barLeft} y1={distY} x2={barRight} y2={distY} />
              {centers.map((cx, i) => (
                <line
                  key={i}
                  x1={cx}
                  y1={distY}
                  x2={cx}
                  y2={childY}
                />
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

const Inspector: React.FC<{
  person: Person | undefined;
  familyId: string;
  onClose: () => void;
}> = ({ person, familyId, onClose }) => (
  <div
    style={{
      width: 280,
      background: C.paper,
      borderLeft: `1px solid ${C.line}`,
      padding: "20px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      flex: "none",
      overflowY: "auto",
    }}
  >
    <Row justify="space-between" align="center">
      <Hand size={11} color={C.shu} style={{ letterSpacing: "0.2em" }}>
        ─── 選択中の人物
      </Hand>
      <button
        type="button"
        onClick={onClose}
        title="インスペクターを閉じる"
        style={{
          background: "none",
          border: "none",
          color: C.pale,
          cursor: "pointer",
          fontFamily: F.hand,
          fontSize: 18,
          padding: 0,
        }}
      >
        ›
      </button>
    </Row>
    {!person ? (
      <Col gap={10} style={{ padding: "24px 4px", alignItems: "center", textAlign: "center" }}>
        <Photo size={72} label="—" />
        <Hand size={12} color={C.pale}>
          家系図の人物を選択すると、ここに情報が表示されます。
        </Hand>
      </Col>
    ) : (
      <>
        <Row gap={12} align="flex-start">
          <Photo size={72} label="肖像" />
          <Col gap={4}>
            <Title size={18}>{formatPerson(person)}</Title>
            {(person.kanaSurname || person.kanaGiven) && (
              <Hand size={11} color={C.sub}>
                {person.kanaSurname ?? ""} {person.kanaGiven ?? ""}
              </Hand>
            )}
            <Hand size={12} color={C.sumi}>
              {formatBirthYear(person)}
              {person.deceased ? " 故" : " 存命"}
            </Hand>
            <Row gap={6} style={{ marginTop: 4 }} wrap>
              {person.role && <Chip tone="shu">{person.role}</Chip>}
              <Chip>
                {person.gender === "m"
                  ? "男性"
                  : person.gender === "f"
                    ? "女性"
                    : person.gender === "other"
                      ? "その他"
                      : "不明"}
              </Chip>
            </Row>
          </Col>
        </Row>
        {person.note && (
          <Hand size={12} color={C.sub}>
            <InkDot /> {person.note}
          </Hand>
        )}
        <Row gap={8}>
          <SketchBtn size="sm" to={`/family/${familyId}/person/${person.id}`}>
            詳細を見る
          </SketchBtn>
          <SketchBtn size="sm" to={`/family/${familyId}/person/${person.id}/edit`}>
            編集
          </SketchBtn>
        </Row>
      </>
    )}
  </div>
);
