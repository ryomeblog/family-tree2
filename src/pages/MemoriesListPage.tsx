import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BarePage,
  AppHeader,
  Hand,
  Title,
  SketchBtn,
  Row,
  Col,
  Chip,
  Brush,
  C,
} from "../components/ui";
import { PhotoFromIdb } from "../features/photos/PhotoFromIdb";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useFamilyStore, Memory, formatPerson } from "../stores/familyStore";
import { canViewMemory } from "../domain/selectors";
import SearchPopover from "../modals/SearchPopover";

const FilterChip: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}> = ({ label, value, onChange, options }) => (
  <label
    style={{
      background: C.paper,
      border: `1px solid ${C.sumi}`,
      borderRadius: 3,
      padding: "3px 12px",
      fontFamily: "'Klee One', cursive",
      fontSize: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      cursor: "pointer",
    }}
  >
    <span style={{ color: C.pale }}>{label}：</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "transparent",
        border: "none",
        fontFamily: "inherit",
        fontSize: "inherit",
        color: C.sumi,
        cursor: "pointer",
        outline: "none",
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </label>
);

const Card: React.FC<{
  memory: Memory;
  familyId: string;
  authorName: string;
  protagonistName: string;
  viewerNames: string;
}> = ({ memory, familyId, authorName, protagonistName, viewerNames }) => (
  <Row gap={14} align="flex-start">
    <Col gap={2} style={{ width: 64, paddingTop: 6, flex: "none" }}>
      <Title size={18}>{memory.year}</Title>
      {memory.era && (
        <Hand size={10} color={C.pale}>
          {memory.era}
        </Hand>
      )}
    </Col>
    <div
      style={{
        position: "relative",
        width: 2,
        background: C.line,
        alignSelf: "stretch",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: -5,
          top: 10,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: C.paper,
          border: `2px solid ${C.shu}`,
        }}
      />
    </div>
    <Link
      to={`/family/${familyId}/memory/${memory.id}`}
      style={{
        flex: 1,
        textDecoration: "none",
        color: "inherit",
        background: C.paper,
        border: `1px solid ${C.sumi}`,
        borderRadius: 4,
        boxShadow: `3px 3px 0 ${C.sumi}`,
        padding: "16px 20px",
        marginBottom: 20,
        display: "block",
      }}
    >
      <Row justify="space-between" align="flex-start">
        <Col gap={4} style={{ flex: 1 }}>
          <Title size={18}>{memory.title}</Title>
          <Row gap={10} wrap>
            <Chip tone="shu">主人公・{protagonistName}</Chip>
            <Chip>書き手・{authorName}</Chip>
            {memory.locked ? (
              <Chip tone="mute">鍵付 — {viewerNames}</Chip>
            ) : (
              <Chip tone="mute">{viewerNames}</Chip>
            )}
          </Row>
        </Col>
        <Row gap={6}>
          {(memory.photoIds ?? []).slice(0, 3).map((id) => (
            <PhotoFromIdb key={id} id={id} size={52} rounded={3} />
          ))}
          {(memory.photoIds?.length ?? 0) > 3 && (
            <div
              style={{
                width: 52,
                height: 52,
                display: "grid",
                placeItems: "center",
                border: `1px dashed ${C.pale}`,
                color: C.pale,
                fontFamily: "'Klee One', cursive",
                fontSize: 11,
                borderRadius: 3,
              }}
            >
              +{(memory.photoIds?.length ?? 0) - 3}
            </div>
          )}
        </Row>
      </Row>
      <Hand size={13} color={C.sub} style={{ display: "block", marginTop: 10 }}>
        {memory.body.replace(/<[^>]+>/g, "").slice(0, 140)}
      </Hand>
      <Row justify="space-between" style={{ marginTop: 10 }}>
        <Row gap={6} wrap>
          {memory.tags.map((t) => (
            <Chip key={t} tone="mute">
              #{t}
            </Chip>
          ))}
        </Row>
        <Hand size={11} color={C.pale}>
          読む →
        </Hand>
      </Row>
    </Link>
  </Row>
);

export default function MemoriesListPage() {
  const { fid = "yamada" } = useParams();
  const store = useFamilyStore();
  const family = store.families[fid];
  const isMobile = useIsMobile();
  const [protagonist, setProtagonist] = useState("全員");
  const [author, setAuthor] = useState("全員");
  const [yearFilter, setYearFilter] = useState("すべて");
  const [searchOpen, setSearchOpen] = useState(false);

  const people = family ? Object.values(family.people) : [];
  const allMemories = family ? Object.values(family.memories) : [];
  const memories = allMemories.filter((m) =>
    canViewMemory(m, store.currentViewerPersonId),
  );
  const hiddenCount = allMemories.length - memories.length;

  const protagonistOptions = useMemo(
    () => ["全員", ...people.map((p) => p.given)],
    [people],
  );
  const authorOptions = useMemo(
    () => ["全員", ...people.map((p) => p.given)],
    [people],
  );
  const yearOptions = useMemo(() => {
    const decades = new Set<string>();
    memories.forEach((m) => {
      if (/^\d{4}$/.test(m.year)) {
        decades.add(`${m.year.slice(0, 3)}0年代`);
      }
    });
    return ["すべて", ...Array.from(decades).sort()];
  }, [memories]);

  const filtered = memories.filter((m) => {
    if (protagonist !== "全員") {
      const p = family?.people[m.protagonistId ?? ""];
      if (!p || p.given !== protagonist) return false;
    }
    if (author !== "全員") {
      const a = family?.people[m.authorId];
      if (!a || a.given !== author) return false;
    }
    if (yearFilter !== "すべて") {
      const dec = m.year.slice(0, 3) + "0年代";
      if (dec !== yearFilter) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => b.year.localeCompare(a.year));

  return (
    <BarePage>
      <AppHeader
        familyName={family?.name ?? "—"}
        back
        backTo={`/family/${fid}/tree`}
        showFamilyMenu
        familyId={fid}
        right={
          <Row gap={8}>
            <div style={{ position: "relative" }}>
              <SketchBtn
                size="sm"
                icon="⌕"
                onClick={() => setSearchOpen((v) => !v)}
                title="検索"
              >
                {isMobile ? "" : "検索"}
              </SketchBtn>
              {searchOpen && (
                <SearchPopover
                  familyId={fid}
                  scope="memories"
                  onClose={() => setSearchOpen(false)}
                />
              )}
            </div>
            <SketchBtn
              size="sm"
              icon="家"
              to={`/family/${fid}/tree`}
              title="家系図"
            >
              {isMobile ? "" : "家系図"}
            </SketchBtn>
            <SketchBtn
              size="sm"
              primary
              icon="筆"
              to={`/family/${fid}/memory/new`}
              title="思い出を書く"
            >
              {isMobile ? "" : "思い出を書く"}
            </SketchBtn>
          </Row>
        }
      />
      <div
        style={{
          padding: isMobile ? "16px 14px" : "24px 40px",
          height: "calc(var(--app-h) - 56px)",
          overflowY: "auto",
        }}
      >
        <Hand size={11} color={C.shu} style={{ letterSpacing: "0.2em" }}>
          ─── MEMORIES
        </Hand>
        <Title size={28}>思い出ノート</Title>
        <Hand size={13} color={C.sub}>
          家族のエピソードを一話ずつ残す、絵本のようなノート。
        </Hand>
        <Brush width={180} color={C.shuSoft} />

        <div
          style={{
            marginTop: 16,
            background: "#FBF6E6",
            border: `1px solid ${C.line}`,
            borderRadius: 4,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Hand size={11} color={C.pale}>
            絞り込み:
          </Hand>
          <FilterChip
            label="主人公"
            value={protagonist}
            onChange={setProtagonist}
            options={protagonistOptions}
          />
          <FilterChip
            label="書き手"
            value={author}
            onChange={setAuthor}
            options={authorOptions}
          />
          <FilterChip
            label="年代"
            value={yearFilter}
            onChange={setYearFilter}
            options={yearOptions}
          />
          <div style={{ flex: 1 }} />
          <Hand size={11} color={C.sub}>
            閲覧可 {memories.length} 件 ／ 表示 {sorted.length} 件
            {hiddenCount > 0 ? ` ／ 非公開 ${hiddenCount} 件` : ""}
          </Hand>
        </div>

        <Col gap={0} style={{ marginTop: 18 }}>
          {sorted.map((m) => (
            <Card
              key={m.id}
              memory={m}
              familyId={fid}
              authorName={formatPerson(family?.people[m.authorId])}
              protagonistName={
                m.protagonistId
                  ? formatPerson(family?.people[m.protagonistId])
                  : "—"
              }
              viewerNames={(() => {
                if (m.viewers.length === 0) return "家族全員";
                // 名前を集めるが、Chip の幅が爆発しないよう 4 名で打ち切り、
                // 残りは「他 N 名」と省略表示。
                const MAX = 4;
                const names = m.viewers
                  .map((v) => family?.people[v]?.given)
                  .filter(Boolean) as string[];
                if (names.length <= MAX) return names.join("・");
                return names.slice(0, MAX).join("・") + ` ほか ${names.length - MAX} 名`;
              })()}
            />
          ))}
          {sorted.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                background: "#FBF6E6",
                border: `1.5px dashed ${C.pale}`,
                borderRadius: 6,
              }}
            >
              <Title size={20}>
                {memories.length === 0
                  ? "はじめての一話を書きましょう"
                  : "条件に当てはまる思い出はありません"}
              </Title>
              <Hand
                size={12}
                color={C.sub}
                style={{ display: "block", marginTop: 8 }}
              >
                {memories.length === 0
                  ? "写真と一緒に、エピソードを一話ずつ残せます。"
                  : "フィルタを減らすと、より多くの結果が見つかります。"}
              </Hand>
              <div style={{ marginTop: 14 }}>
                <SketchBtn
                  primary
                  icon="筆"
                  to={`/family/${fid}/memory/new`}
                >
                  思い出を書く
                </SketchBtn>
              </div>
            </div>
          )}
        </Col>

        <div
          style={{
            marginTop: 8,
            textAlign: "center",
            padding: 20,
            color: C.pale,
            fontFamily: "'Klee One', cursive",
            fontSize: 12,
          }}
        >
          ─── これ以上の記録はありません ───
        </div>
      </div>
    </BarePage>
  );
}
