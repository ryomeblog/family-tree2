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
import { PhotoFromIdb } from "../features/photos/PhotoFromIdb";
import { useIsMobile } from "../hooks/useMediaQuery";

type ToolMode = "select" | "add" | "line" | "edit" | "search";
const TOOLS: { k: ToolMode; i: string; t: string }[] = [
  { k: "select", i: "◉", t: "選択" },
  { k: "add", i: "＋", t: "追加" },
  { k: "line", i: "／", t: "線" },
  { k: "edit", i: "筆", t: "編集" },
  { k: "search", i: "⌕", t: "検索" },
];

// ── Layout engine: generation-based.
//
// 1. Assign each person a generation number (gen), derived by walking
//    parent-child links and aligning spouses to the same gen.
// 2. Group each gen into "groups" — a union (two partners adjacent)
//    or a single person. For each group compute an ideal midX as the
//    average of its parents' midpoints at gen-1 (empty if roots).
// 3. Place groups left-to-right in ideal-x order, pushing later groups
//    right when they would collide.
// 4. After placement, for every union that has a parent at gen-1 on
//    EITHER side, emit the parent→child edge using the previously
//    placed coordinates. Both sides are drawn independently, so shared
//    descendants (A×B where A has grandparents on one side and B on
//    the other) get lines from BOTH parent unions.
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
const COUPLE_GAP = 64; // horizontal gap between different couples at same gen
const GEN_GAP = 170;
const ORIGIN_Y = 60;
const MARGIN_X = 60;

type FamilyArg = ReturnType<typeof useFamilyStore.getState>["families"][string];

function layoutFamily(fam: FamilyArg) {
  // ── Step 1: compute generation per person ────────────────────────
  const gen = new Map<string, number>();
  const childIds = new Set(fam.links.map((l) => l.childId));
  for (const p of Object.values(fam.people)) {
    if (!childIds.has(p.id)) gen.set(p.id, 0);
  }
  // Iteratively propagate: child's gen ≥ max(parents) + 1, and
  // spouses share the same gen (take the max of both).
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 200) {
    changed = false;
    for (const link of fam.links) {
      let parentGen: number | undefined;
      if (link.parentUnion) {
        const u = fam.unions.find((x) => x.id === link.parentUnion);
        if (u) {
          const gA = gen.get(u.partnerA);
          const gB = gen.get(u.partnerB);
          const candidates = [gA, gB].filter(
            (x): x is number => x !== undefined,
          );
          if (candidates.length > 0) parentGen = Math.max(...candidates);
        }
      } else if (link.parentId) {
        parentGen = gen.get(link.parentId);
      }
      if (parentGen !== undefined) {
        const expected = parentGen + 1;
        const cur = gen.get(link.childId);
        if (cur === undefined || cur < expected) {
          gen.set(link.childId, expected);
          changed = true;
        }
      }
    }
    for (const u of fam.unions) {
      const gA = gen.get(u.partnerA);
      const gB = gen.get(u.partnerB);
      if (gA !== undefined && gB !== undefined && gA !== gB) {
        const m = Math.max(gA, gB);
        if (gA !== m) {
          gen.set(u.partnerA, m);
          changed = true;
        }
        if (gB !== m) {
          gen.set(u.partnerB, m);
          changed = true;
        }
      } else if (gA !== undefined && gB === undefined) {
        gen.set(u.partnerB, gA);
        changed = true;
      } else if (gB !== undefined && gA === undefined) {
        gen.set(u.partnerA, gB);
        changed = true;
      }
    }
  }
  for (const p of Object.values(fam.people)) {
    if (!gen.has(p.id)) gen.set(p.id, 0);
  }
  const maxGen = Math.max(0, ...Array.from(gen.values()));

  // ── Step 2: helpers ──────────────────────────────────────────────
  // For each person, their union (if any) and spouse.
  const unionByPerson = new Map<string, { unionId: string; spouseId: string }>();
  for (const u of fam.unions) {
    unionByPerson.set(u.partnerA, { unionId: u.id, spouseId: u.partnerB });
    unionByPerson.set(u.partnerB, { unionId: u.id, spouseId: u.partnerA });
  }

  // Parent union/person for each person (if any).
  const parentOfPerson = new Map<
    string,
    { kind: "union"; unionId: string } | { kind: "single"; personId: string }
  >();
  for (const link of fam.links) {
    if (link.parentUnion) {
      parentOfPerson.set(link.childId, {
        kind: "union",
        unionId: link.parentUnion,
      });
    } else if (link.parentId) {
      parentOfPerson.set(link.childId, {
        kind: "single",
        personId: link.parentId,
      });
    }
  }

  // ── Step 3: place persons by generation ─────────────────────────
  const personX = new Map<string, number>();
  // Key to lookup group mid: "u:<unionId>" for unions, "p:<personId>" for
  // singles. midX is the "parent's midpoint" that children align to.
  const groupMidX = new Map<string, number>();

  // Helper: return the parent-midpoint x for a given person, using
  // already-placed coords at higher gens.
  const parentMidX = (pid: string): number | undefined => {
    const parent = parentOfPerson.get(pid);
    if (!parent) return undefined;
    if (parent.kind === "union") {
      return groupMidX.get("u:" + parent.unionId);
    }
    return groupMidX.get("p:" + parent.personId);
  };

  for (let g = 0; g <= maxGen; g++) {
    // Collect persons at this gen.
    const gPersons = Object.values(fam.people).filter(
      (p) => gen.get(p.id) === g,
    );

    // Group into union groups (2 persons) and singles.
    const used = new Set<string>();
    interface Group {
      ids: [string] | [string, string]; // [a] or [a, b] where a is left
      idealMid?: number;
      key: string; // for groupMidX
      unionId?: string;
    }
    const groups: Group[] = [];

    for (const p of gPersons) {
      if (used.has(p.id)) continue;
      const u = unionByPerson.get(p.id);
      if (u && !used.has(u.spouseId) && gen.get(u.spouseId) === g) {
        used.add(p.id);
        used.add(u.spouseId);
        // Decide left/right order by preferred x of each partner.
        const midP = parentMidX(p.id);
        const midS = parentMidX(u.spouseId);
        let leftId = p.id;
        let rightId = u.spouseId;
        if (midP !== undefined && midS !== undefined) {
          if (midP > midS) {
            leftId = u.spouseId;
            rightId = p.id;
          }
        } else if (midS !== undefined && midP === undefined) {
          leftId = u.spouseId;
          rightId = p.id;
        }
        const midLeft = parentMidX(leftId);
        const midRight = parentMidX(rightId);
        let ideal: number | undefined;
        if (midLeft !== undefined && midRight !== undefined) {
          ideal = (midLeft + midRight) / 2;
        } else if (midLeft !== undefined) {
          ideal = midLeft + (NODE_W + SPOUSE_GAP) / 2;
        } else if (midRight !== undefined) {
          ideal = midRight - (NODE_W + SPOUSE_GAP) / 2;
        }
        groups.push({
          ids: [leftId, rightId],
          idealMid: ideal,
          key: "u:" + u.unionId,
          unionId: u.unionId,
        });
      } else {
        used.add(p.id);
        const mid = parentMidX(p.id);
        groups.push({
          ids: [p.id],
          idealMid: mid,
          key: "p:" + p.id,
        });
      }
    }

    // Group width: for a union try to honor parent midpoint spacing.
    const groupWidth = (g: Group): number => {
      if (g.ids.length === 1) return NODE_W;
      // Couple. If both partners have parent midpoints, try to space the
      // partners such that each sits exactly under their parent mid.
      const mA = parentMidX(g.ids[0]);
      const mB = parentMidX(g.ids[1]);
      let gap = SPOUSE_GAP;
      if (mA !== undefined && mB !== undefined) {
        gap = Math.max(SPOUSE_GAP, mB - mA - NODE_W);
      }
      return NODE_W * 2 + gap;
    };

    // Sort by idealMid (undefined last) to preserve left-right order.
    groups.sort((a, b) => {
      if (a.idealMid === undefined && b.idealMid === undefined) return 0;
      if (a.idealMid === undefined) return 1;
      if (b.idealMid === undefined) return -1;
      return a.idealMid - b.idealMid;
    });

    // Place left to right, respecting ideal but enforcing no overlap.
    let cursor = MARGIN_X;
    for (const grp of groups) {
      const w = groupWidth(grp);
      let midX: number;
      if (grp.idealMid !== undefined) {
        midX = Math.max(grp.idealMid, cursor + w / 2);
      } else {
        midX = cursor + w / 2;
      }
      const leftX = midX - w / 2;

      if (grp.ids.length === 1) {
        personX.set(grp.ids[0], leftX);
        groupMidX.set(grp.key, midX);
      } else {
        // Preserve each partner's ideal x if possible; otherwise use
        // standard spouse gap centered on midX.
        const mA = parentMidX(grp.ids[0]);
        const mB = parentMidX(grp.ids[1]);
        if (
          mA !== undefined &&
          mB !== undefined &&
          mB - mA >= NODE_W + SPOUSE_GAP
        ) {
          // Enough room to align partners under their parent midpoints.
          personX.set(grp.ids[0], mA - NODE_W / 2);
          personX.set(grp.ids[1], mB - NODE_W / 2);
          // Shift if partners would overlap previous group.
          const aX = mA - NODE_W / 2;
          if (aX < cursor) {
            const shift = cursor - aX;
            personX.set(grp.ids[0], aX + shift);
            personX.set(grp.ids[1], mB - NODE_W / 2 + shift);
          }
          const finalAx = personX.get(grp.ids[0])!;
          const finalBx = personX.get(grp.ids[1])!;
          const unionCenter = (finalAx + NODE_W + finalBx) / 2;
          groupMidX.set(grp.key, unionCenter);
        } else {
          // Default: partners adjacent with SPOUSE_GAP, centered on midX.
          personX.set(grp.ids[0], leftX);
          personX.set(grp.ids[1], leftX + NODE_W + SPOUSE_GAP);
          groupMidX.set(grp.key, midX);
        }
      }

      const actualRight =
        grp.ids.length === 1
          ? personX.get(grp.ids[0])! + NODE_W
          : personX.get(grp.ids[1])! + NODE_W;
      cursor = actualRight + COUPLE_GAP;
    }
  }

  // ── Step 4: emit nodes and edges ─────────────────────────────────
  const nodes: Node[] = [];
  for (const p of Object.values(fam.people)) {
    const x = personX.get(p.id);
    if (x === undefined) continue;
    nodes.push({
      id: p.id,
      person: p,
      x,
      y: ORIGIN_Y + (gen.get(p.id) ?? 0) * GEN_GAP,
    });
  }

  const edges: TreeEdge[] = [];
  // Spouse edges (with their children — used to draw parent→child lines).
  for (const u of fam.unions) {
    if (!fam.people[u.partnerA] || !fam.people[u.partnerB]) continue;
    const myChildren = fam.links
      .filter((l) => l.parentUnion === u.id)
      .map((l) => l.childId)
      .filter((id) => personX.has(id));
    edges.push({
      type: "union",
      unionId: u.id,
      aId: u.partnerA,
      bId: u.partnerB,
      childIds: myChildren,
    });
  }
  // Single-parent edges (parentId without union).
  const singleParents = new Map<string, string[]>();
  for (const l of fam.links) {
    if (l.parentId && !l.parentUnion) {
      const list = singleParents.get(l.parentId) ?? [];
      list.push(l.childId);
      singleParents.set(l.parentId, list);
    }
  }
  for (const [pid, ids] of singleParents) {
    if (!fam.people[pid]) continue;
    const visible = ids.filter((id) => personX.has(id));
    if (visible.length === 0) continue;
    // Only emit single edge if the person is NOT in a union (to avoid
    // overlapping with the union edge).
    if (unionByPerson.has(pid)) continue;
    edges.push({ type: "single", parentId: pid, childIds: visible });
  }

  // ── Step 5: bounding box ─────────────────────────────────────────
  const width = Math.max(
    MARGIN_X * 2,
    ...nodes.map((n) => n.x + NODE_W + MARGIN_X),
  );
  const height = ORIGIN_Y + (maxGen + 1) * GEN_GAP + MARGIN_X;

  return { nodes, edges, width, height };
}

// ── Main page ────────────────────────────────────────────────────────
export default function TreeEditorPage() {
  const { fid = "yamada" } = useParams();
  const nav = useNavigate();
  const store = useFamilyStore();
  const family = store.families[fid];

  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lineFirst, setLineFirst] = useState<string | null>(null);
  const [mode, setMode] = useState<ToolMode>("select");
  const [searchOpen, setSearchOpen] = useState(false);
  // モバイルではキャンバスを確保したいのでデフォルトで閉じておく。
  const [inspectorOpen, setInspectorOpen] = useState(!isMobile);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );

  const layout = useMemo(() => (family ? layoutFamily(family) : null), [family]);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const onSave = () => {
    // Persistence happens automatically via the Zustand persist
    // middleware; this just clears the dirty flag + gives feedback.
    store.markClean();
    store.showToast("ok", "保存しました");
  };
  const onExport = async () => {
    // Mount a print-only surface (no toolbar/minimap/zoom), let the
    // browser lay it out, capture it, then unmount. The surface is
    // rendered on-screen but clipped behind the existing chrome via
    // z-index + overflow hidden.
    if (!layout) return;
    setExporting(true);
    // Two rAFs so the newly-mounted element is painted before capture.
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    try {
      if (!printRef.current) throw new Error("print surface missing");
      const dataUrl = await toPng(printRef.current, {
        cacheBust: true,
        backgroundColor: "#FFFEF8",
        pixelRatio: 2,
        width: layout.width,
        height: layout.height,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${family?.name ?? "family"}_tree.png`;
      a.click();
      store.showToast("ok", "PNG を書き出しました");
    } catch (e) {
      console.error(e);
      store.showToast("err", "書き出しに失敗しました");
    } finally {
      setExporting(false);
    }
  };

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (mode !== "select") return;
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
  // モバイル／タブレット向けのタッチドラッグ。単指で pan、2 指でピンチズーム。
  // 2 指ピンチのための初期距離を持つ。
  const pinch = useRef<{ startDist: number; startZoom: number } | null>(null);
  const touchDist = (t: React.TouchList) => {
    const dx = t[0].clientX - t[1].clientX;
    const dy = t[0].clientY - t[1].clientY;
    return Math.hypot(dx, dy);
  };
  const onCanvasTouchStart = (e: React.TouchEvent) => {
    if (mode !== "select") return;
    if (e.touches.length === 1) {
      dragging.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        originX: pan.x,
        originY: pan.y,
      };
    } else if (e.touches.length === 2) {
      dragging.current = null;
      pinch.current = { startDist: touchDist(e.touches), startZoom: zoom };
    }
  };
  const onCanvasTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch.current) {
      e.preventDefault();
      const d = touchDist(e.touches);
      const ratio = d / pinch.current.startDist;
      setZoom(Math.max(0.4, Math.min(1.8, pinch.current.startZoom * ratio)));
      return;
    }
    if (!dragging.current || e.touches.length !== 1) return;
    // ブラウザのネイティブスクロール/プルリフレッシュを抑制してキャンバス操作を優先。
    if (e.cancelable) e.preventDefault();
    setPan({
      x: dragging.current.originX + (e.touches[0].clientX - dragging.current.startX),
      y: dragging.current.originY + (e.touches[0].clientY - dragging.current.startY),
    });
  };
  const onCanvasTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      dragging.current = null;
      pinch.current = null;
    } else if (e.touches.length === 1) {
      pinch.current = null;
      // 2指→1指に戻ったとき pan 起点を再取得
      dragging.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        originX: pan.x,
        originY: pan.y,
      };
    }
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
          <Row gap={8}>
            {store.dirty && !isMobile && (
              <Hand size={11} color={C.shu}>
                ● 未保存の変更あり
              </Hand>
            )}
            {/* 思い出ノート / 画像を保存 は幅が足りない mobile では出さない。
                思い出ノートは AppHeader の 家系名 ▾ ドロップダウンからアクセス可。
                画像を保存はモバイルでは需要が低い想定。 */}
            {!isMobile && (
              <SketchBtn
                size="sm"
                icon="帖"
                to={`/family/${fid}/memories`}
                title="思い出ノート"
              >
                思い出ノート
              </SketchBtn>
            )}
            {!isMobile && (
              <SketchBtn
                size="sm"
                icon="↓"
                onClick={onExport}
                title="画像を保存"
              >
                画像を保存
              </SketchBtn>
            )}
            <SketchBtn
              size="sm"
              primary
              icon="保"
              onClick={onSave}
              title={store.dirty ? "保存（未保存あり）" : "保存"}
            >
              {isMobile ? "" : "保存"}
            </SketchBtn>
            <SketchBtn
              size="sm"
              icon="＋"
              onClick={onAddPersonFromNode}
              title="人物を追加"
            >
              {isMobile ? "" : "人物を追加"}
            </SketchBtn>
          </Row>
        }
      />

      <div style={{ display: "flex", height: "calc(var(--app-h) - 56px)", overflow: "hidden" }}>
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
            // モバイル：タッチでページスクロール/プルリフレッシュが走ると
            // 家系図がドラッグできない。キャンバス内は自前ハンドラに任せる。
            touchAction: "none",
            WebkitUserSelect: "none",
          }}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onMouseLeave={onCanvasMouseUp}
          onTouchStart={onCanvasTouchStart}
          onTouchMove={onCanvasTouchMove}
          onTouchEnd={onCanvasTouchEnd}
          onTouchCancel={onCanvasTouchEnd}
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
              // モバイルは SearchPopover 既定の全幅固定シートに任せる。
              // デスクトップはキャンバス左上にドックする。
              containerStyle={
                isMobile
                  ? undefined
                  : {
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
                    }
              }
            />
          )}

          {/* MiniMap — モバイルでは画面が狭くキャンバスを圧迫するので出さない。 */}
          {!isMobile && (
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
              <svg
                width="100%"
                height="90%"
                viewBox={`0 0 ${layout?.width ?? 1000} ${layout?.height ?? 800}`}
              >
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
          )}

          {/* Zoom controls — モバイルは 2 指ピンチでズームできるため非表示。
              +/- ボタンが検索シートやヘッダに被って押しにくい問題の回避。 */}
          {!isMobile && (
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
          )}

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

        {/* Inspector — モバイルではキャンバス上にオーバーレイ */}
        {inspectorOpen && (
          <Inspector
            person={selected}
            familyId={fid}
            onClose={() => setInspectorOpen(false)}
            overlay={isMobile}
          />
        )}
      </div>

      {/* Print surface — mounted briefly while `exporting === true`.
          Rendered on-screen (so the browser lays it out for capture)
          inside a size-0 overflow container so it doesn't disturb the
          UI. */}
      {exporting && layout && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            overflow: "visible",
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          <div
            ref={printRef}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: layout.width,
              height: layout.height,
              background: "#FFFEF8",
            }}
          >
            <PrintTree layout={layout} />
          </div>
        </div>
      )}
    </BarePage>
  );
}

const PrintTree: React.FC<{
  layout: { nodes: Node[]; edges: TreeEdge[]; width: number; height: number };
}> = ({ layout }) => (
  <div
    style={{
      position: "relative",
      width: layout.width,
      height: layout.height,
      background: "#FFFEF8",
    }}
  >
    <EdgesLayer layout={layout} />
    {layout.nodes.map((n) => (
      <div
        key={n.id}
        style={{
          position: "absolute",
          left: n.x,
          top: n.y,
          width: NODE_W,
          height: NODE_H,
          background: C.paper,
          border: `1px solid ${C.sumi}`,
          borderRadius: 4,
          boxShadow: `2px 2px 0 ${C.sumi}`,
          padding: "6px 10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          boxSizing: "border-box",
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
      </div>
    ))}
  </div>
);

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
  overlay?: boolean;
}> = ({ person, familyId, onClose, overlay }) => (
  <div
    style={{
      // モバイルではキャンバス上にオーバーレイ表示（キャンバス幅を圧迫しない）
      position: overlay ? "absolute" : "relative",
      top: overlay ? 0 : undefined,
      right: overlay ? 0 : undefined,
      bottom: overlay ? 0 : undefined,
      zIndex: overlay ? 30 : undefined,
      width: overlay ? "min(320px, 92vw)" : 280,
      maxWidth: "100%",
      background: C.paper,
      borderLeft: `1px solid ${C.line}`,
      boxShadow: overlay ? "-8px 0 24px -12px rgba(0,0,0,0.35)" : undefined,
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
          <PhotoFromIdb id={person.portrait} size={72} label="肖像" />
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
