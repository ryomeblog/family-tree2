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
const SIBLING_GAP = 48; // 同じ親（union/single）の子同士の間隔
const COUPLE_GAP = 140; // 親が異なる subtree 同士の間隔（バス線が重なって見えないよう余裕を取る）
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

  // ── Step 3: build group tree & bottom-up subtree widths ──────────
  // 各 group（couple または single）を1ノードとし、最下層の subtree 幅を
  // 計算してから親世代を「子の中点」に配置する。これで線が構造的に重ならない。
  //
  // bridge couple（両配偶者ともに家系内に親がいる）は左配偶者の親側を
  // 「主親」として配置する。右配偶者の親からは fam.links 経由で edge が
  // 別途引かれる（既存の EdgesLayer が自動で扱う）。
  interface Group {
    key: string;
    ids: [string] | [string, string]; // 配置順（left, right）
    primaryParent?: string; // この group が属する親 group キー（無ければルート）
    secondaryParent?: string; // bridge の場合のもう片方の親
    leftIsPrimaryChild: boolean; // couple の場合: 左 partner が主親の子か
    children: string[]; // この group の子 group キー
    gen: number;
  }

  const groups = new Map<string, Group>();
  const groupKeyOf = new Map<string, string>(); // personId → groupKey
  const parentKeyOf = (id: string): string | undefined => {
    const par = parentOfPerson.get(id);
    if (!par) return undefined;
    return par.kind === "union" ? "u:" + par.unionId : "p:" + par.personId;
  };

  for (const p of Object.values(fam.people)) {
    if (groupKeyOf.has(p.id)) continue;
    const u = unionByPerson.get(p.id);
    if (
      u &&
      fam.people[u.spouseId] &&
      gen.get(p.id) === gen.get(u.spouseId) &&
      !groupKeyOf.has(u.spouseId)
    ) {
      const key = "u:" + u.unionId;
      const parA = parentKeyOf(p.id);
      const parB = parentKeyOf(u.spouseId);
      // 配置順: 左に置きたい partner を先に。
      // - 片方のみ親を持つ：親持ちが「主親側」、外から嫁いだ方は反対側に配置。
      //   主親側は family の中央に近い側に置く（既定: 左）。
      // - 両者親持ち（bridge）：a の親と b の親の上下関係（gen + ID）から
      //   とりあえず「a を左、b を右」と暫定。ルート間の左右は配置時に決まる。
      let leftId = p.id;
      let rightId = u.spouseId;
      let primaryParent: string | undefined;
      let secondaryParent: string | undefined;
      let leftIsPrimaryChild = true;
      if (parA && parB) {
        primaryParent = parA;
        secondaryParent = parB;
        leftIsPrimaryChild = true; // p.id が左、その親が主親
      } else if (parA) {
        primaryParent = parA;
        leftIsPrimaryChild = true;
      } else if (parB) {
        primaryParent = parB;
        // 親を持つ方を左に揃える（subtree が左に寄る）
        leftId = u.spouseId;
        rightId = p.id;
        leftIsPrimaryChild = true;
      }
      groups.set(key, {
        key,
        ids: [leftId, rightId],
        primaryParent,
        secondaryParent,
        leftIsPrimaryChild,
        children: [],
        gen: gen.get(p.id) ?? 0,
      });
      groupKeyOf.set(p.id, key);
      groupKeyOf.set(u.spouseId, key);
    } else {
      const key = "p:" + p.id;
      groups.set(key, {
        key,
        ids: [p.id],
        primaryParent: parentKeyOf(p.id),
        leftIsPrimaryChild: true,
        children: [],
        gen: gen.get(p.id) ?? 0,
      });
      groupKeyOf.set(p.id, key);
    }
  }

  // 子リストを構築（primaryParent のみ）
  for (const g of groups.values()) {
    if (g.primaryParent && groups.has(g.primaryParent)) {
      groups.get(g.primaryParent)!.children.push(g.key);
    }
  }
  // 子順: bridge couple は親世代の子ブロックの「端」（secondary parent の root に
  // 近い側）に置きたい。今回は roots を [primary root, secondary root] の順で
  // 並べているので、bridge couple は親の子リストの **末尾** に置く。
  for (const g of groups.values()) {
    g.children.sort((a, b) => {
      const ga = groups.get(a)!;
      const gb = groups.get(b)!;
      const aBridge = !!ga.secondaryParent;
      const bBridge = !!gb.secondaryParent;
      if (aBridge !== bBridge) return aBridge ? 1 : -1;
      return a.localeCompare(b);
    });
  }

  // 各 group の subtree レイアウト
  interface GroupLayout {
    width: number; // subtree 全体幅
    coupleLeftOffset: number; // subtree 左端から couple/single の左端まで
    primaryAnchorOffset: number; // subtree 左端から「主親が接続する人物の centerX」まで
    secondaryAnchorOffset?: number; // bridge: もう片方の親が接続する人物の centerX
    childrenBlockOffset: number; // subtree 左端から子ブロック左端まで
    childrenBlockWidth: number; // 子ブロック幅（子無しは 0）
  }
  const layouts = new Map<string, GroupLayout>();

  const ownWidth = (g: Group): number =>
    g.ids.length === 2 ? NODE_W * 2 + SPOUSE_GAP : NODE_W;

  const computeLayout = (key: string): GroupLayout => {
    const cached = layouts.get(key);
    if (cached) return cached;
    const g = groups.get(key)!;
    const own = ownWidth(g);

    // 子ブロック幅（再帰）
    let childrenBlockWidth = 0;
    for (let i = 0; i < g.children.length; i++) {
      const cl = computeLayout(g.children[i]);
      childrenBlockWidth += cl.width;
      if (i > 0) childrenBlockWidth += SIBLING_GAP;
    }

    let width: number;
    let coupleLeftOffset: number;
    let childrenBlockOffset: number;
    if (childrenBlockWidth > own) {
      width = childrenBlockWidth;
      coupleLeftOffset = (childrenBlockWidth - own) / 2;
      childrenBlockOffset = 0;
    } else {
      width = own;
      coupleLeftOffset = 0;
      childrenBlockOffset = (own - childrenBlockWidth) / 2;
    }

    // 主親アンカー（親 bus がここに落ちる）
    let primaryAnchorOffset: number;
    let secondaryAnchorOffset: number | undefined;
    if (g.ids.length === 1) {
      primaryAnchorOffset = coupleLeftOffset + NODE_W / 2;
    } else {
      const leftCenter = coupleLeftOffset + NODE_W / 2;
      const rightCenter = coupleLeftOffset + NODE_W + SPOUSE_GAP + NODE_W / 2;
      primaryAnchorOffset = g.leftIsPrimaryChild ? leftCenter : rightCenter;
      if (g.secondaryParent) {
        secondaryAnchorOffset = g.leftIsPrimaryChild ? rightCenter : leftCenter;
      }
    }

    const result: GroupLayout = {
      width,
      coupleLeftOffset,
      primaryAnchorOffset,
      secondaryAnchorOffset,
      childrenBlockOffset,
      childrenBlockWidth,
    };
    layouts.set(key, result);
    return result;
  };

  // ルート（親無し）を抽出。複数ある場合は左右に並べる。
  // 並び順: bridge 関係を考慮して、bridge の primary 親 → secondary 親の順。
  const roots = Array.from(groups.values())
    .filter((g) => !g.primaryParent)
    .map((g) => g.key);
  // 安定ソート: 関連 bridge が多い root → 少ない root の順、とすると
  // bridge couple が左 root の右端に来て secondary 親が右 root の左寄りに来やすい。
  // ここでは単純に keys を辞書順で並べる（手調整は今後）。
  roots.sort();
  // ただし bridge couple が存在する場合、その primary 親と secondary 親が
  // 隣接するように並べ替える。
  const bridges = Array.from(groups.values()).filter((g) => g.secondaryParent);
  if (bridges.length > 0 && roots.length >= 2) {
    // 最初の bridge を基に、primary 親 root → secondary 親 root の順を確定
    const b = bridges[0];
    const primaryRoot = (() => {
      let cur = groups.get(b.primaryParent!);
      while (cur && cur.primaryParent) cur = groups.get(cur.primaryParent);
      return cur?.key;
    })();
    const secondaryRoot = (() => {
      let cur = groups.get(b.secondaryParent!);
      while (cur && cur.primaryParent) cur = groups.get(cur.primaryParent);
      return cur?.key;
    })();
    if (primaryRoot && secondaryRoot) {
      const others = roots.filter(
        (r) => r !== primaryRoot && r !== secondaryRoot,
      );
      const ordered = [primaryRoot, secondaryRoot, ...others];
      roots.length = 0;
      roots.push(...ordered);
    }
  }

  for (const r of roots) computeLayout(r);

  // ── Step 4: top-down 配置 ─────────────────────────────────────────
  const personX = new Map<string, number>();

  const placeGroup = (key: string, leftEdge: number) => {
    const g = groups.get(key)!;
    const lay = layouts.get(key)!;
    const coupleX = leftEdge + lay.coupleLeftOffset;
    if (g.ids.length === 1) {
      personX.set(g.ids[0], coupleX);
    } else {
      personX.set(g.ids[0], coupleX);
      personX.set(g.ids[1], coupleX + NODE_W + SPOUSE_GAP);
    }
    let cursor = leftEdge + lay.childrenBlockOffset;
    for (let i = 0; i < g.children.length; i++) {
      const ck = g.children[i];
      const cl = layouts.get(ck)!;
      placeGroup(ck, cursor);
      cursor += cl.width;
      if (i < g.children.length - 1) cursor += SIBLING_GAP;
    }
  };

  let cursorX = MARGIN_X;
  for (const r of roots) {
    const lay = layouts.get(r)!;
    placeGroup(r, cursorX);
    cursorX += lay.width + COUPLE_GAP;
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
          <Row gap={isMobile ? 4 : 8}>
            {store.dirty && !isMobile && (
              <Hand size={11} color={C.shu}>
                ● 未保存の変更あり
              </Hand>
            )}
            {/* モバイルではすべてアイコンのみ。タップ領域は SketchBtn size="sm"
                の inline-flex で確保される。横スクロール（AppHeader 右側）も
                併用しているので 4 つでも収まらない場合はスワイプ可。 */}
            <SketchBtn
              size="sm"
              icon="帖"
              to={`/family/${fid}/memories`}
              title="思い出ノート"
            >
              {isMobile ? "" : "思い出ノート"}
            </SketchBtn>
            <SketchBtn
              size="sm"
              icon="↓"
              onClick={onExport}
              title="画像を保存"
            >
              {isMobile ? "" : "画像を保存"}
            </SketchBtn>
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

// 同じ世代遷移で X 範囲が重なるバス線を異なる Y（トラック）に振り分け、
// 隣接夫婦のバスが視覚的に 1 本に見えてしまうのを防ぐ。
// トラック 0 は従来位置、それ以降は子方向にずらす（親寄りにずらすと
// 親ボックス底辺と被るため）。
const TRACK_DELTA = 18;
const TRACK_BUFFER = 12; // バス同士の最小水平余白

interface EdgeGeom {
  type: "union" | "single";
  edgeIdx: number;
  spouseY?: number; // union: 夫婦バーの Y
  spouseStart?: number;
  spouseEnd?: number;
  parentX: number; // バスへの垂直線が落ちる X（unionMid または single 親の centerX）
  parentDropFromY: number; // バスへ向けて垂直線を始める Y（union: spouseY、single: 親 bottom Y）
  childY: number; // 子の上端 Y
  busLeft: number;
  busRight: number;
  childCenters: number[];
}

const EdgesLayer: React.FC<{
  layout: { nodes: Node[]; edges: TreeEdge[]; width: number; height: number };
}> = ({ layout }) => {
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));

  // 1) 各 edge の幾何情報を集める
  const geoms: (EdgeGeom | null)[] = layout.edges.map((edge, edgeIdx) => {
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
        return {
          type: "union",
          edgeIdx,
          spouseY: y,
          spouseStart: barStart,
          spouseEnd: barEnd,
          parentX: unionMid,
          parentDropFromY: y,
          childY: y,
          busLeft: unionMid,
          busRight: unionMid,
          childCenters: [],
        };
      }
      const children = edge.childIds
        .map((id) => byId.get(id))
        .filter((n): n is Node => Boolean(n));
      if (children.length === 0) return null;
      const childY = children[0].y;
      const centers = children.map((c) => c.x + NODE_W / 2);
      return {
        type: "union",
        edgeIdx,
        spouseY: y,
        spouseStart: barStart,
        spouseEnd: barEnd,
        parentX: unionMid,
        parentDropFromY: y,
        childY,
        busLeft: Math.min(unionMid, ...centers),
        busRight: Math.max(unionMid, ...centers),
        childCenters: centers,
      };
    }
    const p = byId.get(edge.parentId);
    if (!p || edge.childIds.length === 0) return null;
    const children = edge.childIds
      .map((id) => byId.get(id))
      .filter((n): n is Node => Boolean(n));
    if (children.length === 0) return null;
    const parentX = p.x + NODE_W / 2;
    const parentBottomY = p.y + NODE_H;
    const childY = children[0].y;
    const centers = children.map((c) => c.x + NODE_W / 2);
    return {
      type: "single",
      edgeIdx,
      parentX,
      parentDropFromY: parentBottomY,
      childY,
      busLeft: Math.min(parentX, ...centers),
      busRight: Math.max(parentX, ...centers),
      childCenters: centers,
    };
  });

  // 2) 子の Y（世代遷移）ごとにグループ化して interval scheduling でトラック割当
  const trackOf = new Map<number, number>();
  const buckets = new Map<number, EdgeGeom[]>();
  geoms.forEach((g) => {
    if (!g || g.childCenters.length === 0) return;
    if (!buckets.has(g.childY)) buckets.set(g.childY, []);
    buckets.get(g.childY)!.push(g);
  });
  for (const list of buckets.values()) {
    list.sort((a, b) => a.busLeft - b.busLeft);
    const tracks: number[] = []; // それぞれのトラックで使われている右端 X
    for (const g of list) {
      let placed = -1;
      for (let t = 0; t < tracks.length; t++) {
        if (tracks[t] + TRACK_BUFFER < g.busLeft) {
          tracks[t] = g.busRight;
          placed = t;
          break;
        }
      }
      if (placed === -1) {
        placed = tracks.length;
        tracks.push(g.busRight);
      }
      trackOf.set(g.edgeIdx, placed);
    }
  }

  return (
    <svg
      width={layout.width}
      height={layout.height}
      style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
    >
      <g stroke={C.sumi} strokeWidth="1" fill="none" strokeLinecap="round">
        {layout.edges.map((edge, idx) => {
          const g = geoms[idx];
          if (!g) return null;
          if (edge.type === "union" && edge.childIds.length === 0) {
            return (
              <line
                key={`u-${idx}`}
                x1={g.spouseStart!}
                y1={g.spouseY!}
                x2={g.spouseEnd!}
                y2={g.spouseY!}
              />
            );
          }
          const baseDistY = (g.parentDropFromY + g.childY) / 2;
          const track = trackOf.get(idx) ?? 0;
          // 子方向にトラックを下ろす。child の上端を超えないようクランプ。
          const maxY = g.childY - 6;
          const distY = Math.min(baseDistY + track * TRACK_DELTA, maxY);

          if (edge.type === "union") {
            return (
              <g key={`u-${idx}`}>
                <line
                  x1={g.spouseStart!}
                  y1={g.spouseY!}
                  x2={g.spouseEnd!}
                  y2={g.spouseY!}
                />
                <line
                  x1={g.parentX}
                  y1={g.spouseY!}
                  x2={g.parentX}
                  y2={distY}
                />
                <line
                  x1={g.busLeft}
                  y1={distY}
                  x2={g.busRight}
                  y2={distY}
                />
                {g.childCenters.map((cx, i) => (
                  <line
                    key={i}
                    x1={cx}
                    y1={distY}
                    x2={cx}
                    y2={g.childY}
                  />
                ))}
              </g>
            );
          }
          // single
          return (
            <g key={`s-${idx}`}>
              <line
                x1={g.parentX}
                y1={g.parentDropFromY}
                x2={g.parentX}
                y2={distY}
              />
              <line
                x1={g.busLeft}
                y1={distY}
                x2={g.busRight}
                y2={distY}
              />
              {g.childCenters.map((cx, i) => (
                <line
                  key={i}
                  x1={cx}
                  y1={distY}
                  x2={cx}
                  y2={g.childY}
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
