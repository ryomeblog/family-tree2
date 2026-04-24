import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Hanko,
  C,
  F,
} from "../components/ui";
import { useFamilyStore, formatPerson } from "../stores/familyStore";
import { canViewMemory } from "../domain/selectors";
import { PhotoFromIdb } from "../features/photos/PhotoFromIdb";

const MemoryBody: React.FC<{ body: string }> = ({ body }) => {
  const isHtml = /<\w+/.test(body);
  if (isHtml) {
    return (
      <div
        className="ft-memory-body"
        style={{ marginTop: 28, maxWidth: 760, position: "relative", zIndex: 1 }}
        dangerouslySetInnerHTML={{ __html: body }}
      />
    );
  }
  // Plain text — render the first character as a drop cap.
  return (
    <div
      style={{
        marginTop: 28,
        maxWidth: 760,
        fontFamily: F.mincho,
        fontSize: 17,
        lineHeight: 2,
        color: C.sumi,
        whiteSpace: "pre-wrap",
        position: "relative",
        zIndex: 1,
      }}
    >
      <p>
        <span
          style={{
            float: "left",
            fontFamily: F.mincho,
            fontWeight: 700,
            fontSize: 56,
            lineHeight: 0.9,
            color: C.shu,
            paddingRight: 10,
            paddingTop: 4,
          }}
        >
          {body[0]}
        </span>
        {body.slice(1)}
      </p>
    </div>
  );
};

const bodyStyle = `
.ft-memory-body {
  font-family: ${F.mincho};
  font-size: 17px;
  color: ${C.sumi};
  line-height: 2;
}
.ft-memory-body p { margin: 0 0 16px; }
.ft-memory-body h1 { font-size: 28px; margin: 24px 0 10px; }
.ft-memory-body h2 { font-size: 22px; margin: 20px 0 8px; }
.ft-memory-body blockquote {
  border-left: 3px solid ${C.shu};
  padding-left: 14px;
  color: ${C.sub};
  margin: 14px 0;
}
.ft-memory-body ul, .ft-memory-body ol { padding-left: 24px; margin: 10px 0; }
.ft-memory-body a { color: ${C.shu}; }
`;

export default function MemoryDetailPage() {
  const { fid = "yamada", mid = "m_rose" } = useParams();
  const nav = useNavigate();
  const store = useFamilyStore();
  const family = store.families[fid];
  const memory = family?.memories[mid];
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 並び順：閲覧可能な思い出だけを年→ID の安定順で並べる。
  // 年が取れない（"—"）ものは末尾へ。
  const { prev, next } = useMemo(() => {
    if (!family) return { prev: undefined, next: undefined };
    const yearNum = (y: string) => {
      const n = parseInt(y, 10);
      return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
    };
    const sorted = Object.values(family.memories)
      .filter((m) => canViewMemory(m, store.currentViewerPersonId))
      .sort((a, b) => {
        const d = yearNum(a.year) - yearNum(b.year);
        return d !== 0 ? d : a.id.localeCompare(b.id);
      });
    const i = sorted.findIndex((m) => m.id === mid);
    return {
      prev: i > 0 ? sorted[i - 1] : undefined,
      next: i >= 0 && i < sorted.length - 1 ? sorted[i + 1] : undefined,
    };
  }, [family, mid, store.currentViewerPersonId]);

  // 遷移後に読みたい人は先頭から読むはずなので、スクロールを頭へ戻す。
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [mid]);

  // ← / → でナビゲーション。input/textarea/contenteditable にフォーカス中は無効。
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;
      if (e.key === "ArrowLeft" && prev) {
        nav(`/family/${fid}/memory/${prev.id}`);
      } else if (e.key === "ArrowRight" && next) {
        nav(`/family/${fid}/memory/${next.id}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, fid, nav]);

  if (!family || !memory) {
    return (
      <BarePage>
        <AppHeader
          familyName={family?.name ?? "—"}
          back
          backTo={`/family/${fid}/memories`}
        />
        <div style={{ padding: 60, textAlign: "center" }}>
          <Title size={24}>思い出が見つかりません</Title>
          <Hand color={C.sub}>
            この ID の思い出はストアに存在しないか、削除されました。
          </Hand>
        </div>
      </BarePage>
    );
  }

  if (!canViewMemory(memory, store.currentViewerPersonId)) {
    return (
      <BarePage>
        <AppHeader
          familyName={family.name}
          back
          backTo={`/family/${fid}/memories`}
        />
        <div style={{ padding: 80, textAlign: "center" }}>
          <Title size={24}>この思い出は非公開です</Title>
          <Hand color={C.sub} style={{ display: "block", marginTop: 8 }}>
            書き手と閲覧者として登録された人のみ読めます。
          </Hand>
          <div style={{ marginTop: 20 }}>
            <SketchBtn to="/settings">自分を切り替える</SketchBtn>
          </div>
        </div>
      </BarePage>
    );
  }

  const authorName = formatPerson(family.people[memory.authorId]);
  const protagonistName = memory.protagonistId
    ? formatPerson(family.people[memory.protagonistId])
    : "—";
  const authorInitial = family.people[memory.authorId]?.given?.[0] ?? "署";
  const photoIds = memory.photoIds ?? [];
  const heroId =
    memory.heroPhotoId && photoIds.includes(memory.heroPhotoId)
      ? memory.heroPhotoId
      : photoIds[0];

  return (
    <BarePage>
      <style>{bodyStyle}</style>
      <AppHeader
        familyName={family.name}
        back
        backTo={`/family/${fid}/memories`}
        showFamilyMenu
        familyId={fid}
        right={
          <Row gap={10}>
            <SketchBtn
              size="sm"
              to={prev ? `/family/${fid}/memory/${prev.id}` : "#"}
              disabled={!prev}
              title={prev ? `← ${prev.year}年 ${prev.title}` : "これが最初の思い出です"}
            >
              ‹ 前へ
            </SketchBtn>
            <SketchBtn
              size="sm"
              to={next ? `/family/${fid}/memory/${next.id}` : "#"}
              disabled={!next}
              title={next ? `${next.year}年 ${next.title} →` : "これが最新の思い出です"}
            >
              次へ ›
            </SketchBtn>
            <SketchBtn
              size="sm"
              icon="筆"
              to={`/family/${fid}/memory/${memory.id}/edit`}
            >
              編集
            </SketchBtn>
          </Row>
        }
      />
      <div
        ref={scrollRef}
        style={{
          padding: "40px 60px",
          height: "calc(100vh - 56px)",
          overflowY: "auto",
          background: C.paper,
          position: "relative",
        }}
      >
        <svg
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, opacity: 0.06, pointerEvents: "none" }}
        >
          <g stroke={C.shu} strokeWidth="0.8" fill="none">
            <circle cx="85%" cy="18%" r="100" />
            <circle cx="12%" cy="88%" r="120" />
          </g>
        </svg>

        <Hand size={11} color={C.shu} style={{ letterSpacing: "0.3em" }}>
          ─── {memory.year}年 の ひとこま
        </Hand>
        <Title size={44} style={{ marginTop: 6, lineHeight: 1.2 }}>
          {memory.title}
        </Title>
        <Row gap={12} style={{ marginTop: 14 }} wrap>
          <Chip tone="shu">主人公 ・ {protagonistName}</Chip>
          <Chip>書き手 ・ {authorName}</Chip>
          <Chip tone="mute">{memory.periodLabel}</Chip>
          {memory.tags.map((t) => (
            <Chip key={t} tone="mute">
              #{t}
            </Chip>
          ))}
        </Row>

        <Brush width={200} color={C.shuSoft} />

        {heroId && (
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                aspectRatio: "16/9",
                width: "100%",
                background: "#000",
                borderRadius: 6,
                border: `1px solid ${C.sumi}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <PhotoFromIdb
                id={heroId}
                size="100%"
                aspect="16/9"
                rounded={0}
                style={{ width: "100%", height: "100%" }}
              />
              <Hand
                size={11}
                color="#F3EEDF"
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: 14,
                  background: "rgba(0,0,0,0.55)",
                  padding: "4px 10px",
                  borderRadius: 2,
                }}
              >
                {memory.year}年 ・ 代表写真
              </Hand>
            </div>
          </div>
        )}

        <MemoryBody body={memory.body} />
        {!memory.body && (
          <Hand color={C.pale}>本文はまだ書かれていません。</Hand>
        )}

        {photoIds.length > 0 && (
          <div style={{ marginTop: 36, maxWidth: 760 }}>
            <Title size={16}>写真の記録</Title>
            <Row gap={10} wrap style={{ marginTop: 12 }}>
              {photoIds.map((id) => (
                <PhotoFromIdb key={id} id={id} size={120} rounded={4} />
              ))}
            </Row>
          </div>
        )}

        {memory.related.length > 0 && (
          <div style={{ marginTop: 32, maxWidth: 760 }}>
            <Title size={16}>関わった人々</Title>
            <Row gap={10} wrap style={{ marginTop: 10 }}>
              {memory.related.map((r) => {
                const p = family.people[r];
                if (!p) return null;
                return (
                  <Chip key={r}>
                    {formatPerson(p)}
                    {p.role ? `（${p.role}）` : ""}
                  </Chip>
                );
              })}
            </Row>
          </div>
        )}

        <Row gap={14} align="center" style={{ marginTop: 40 }}>
          <div style={{ flex: 1, height: 1, background: C.line }} />
          <div style={{ textAlign: "center" }}>
            <Hand size={11} color={C.pale}>
              閲覧可能：{memory.viewers.length} 名
            </Hand>
            <div style={{ marginTop: 6, display: "flex", justifyContent: "center" }}>
              <Hanko size={40} label={authorInitial} />
            </div>
          </div>
          <div style={{ flex: 1, height: 1, background: C.line }} />
        </Row>

        <Row justify="space-between" style={{ marginTop: 24 }}>
          <Col gap={2}>
            {prev ? (
              <>
                <Hand size={10} color={C.pale}>
                  ‹ 前の思い出
                </Hand>
                <Title size={15}>
                  {prev.title} — {prev.year}
                </Title>
              </>
            ) : (
              <Hand size={11} color={C.pale}>
                これが最初の思い出です
              </Hand>
            )}
          </Col>
          <Col gap={2} style={{ textAlign: "right" }}>
            {next ? (
              <>
                <Hand size={10} color={C.pale}>
                  次の思い出 ›
                </Hand>
                <Title size={15}>
                  {next.title} — {next.year}
                </Title>
              </>
            ) : (
              <Hand size={11} color={C.pale}>
                これが最新の思い出です
              </Hand>
            )}
          </Col>
        </Row>
      </div>
    </BarePage>
  );
}
