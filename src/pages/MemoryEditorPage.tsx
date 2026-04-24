import React, { useMemo, useState } from "react";
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
  Field,
  Brush,
  C,
  F,
} from "../components/ui";
import { useFamilyStore, Memory, formatPerson } from "../stores/familyStore";
import { canViewMemory } from "../domain/selectors";
import { pickFile, ingestFile } from "../features/photos/ingest";
import { PhotoFromIdb } from "../features/photos/PhotoFromIdb";
import { deletePhoto } from "../storage/idb";
import RichEditor from "../features/memory/RichEditor";
import { YearPicker } from "../components/YearPicker";
import { westernToEra } from "../domain/fuzzyDate";
import { useIsMobile } from "../hooks/useMediaQuery";

const ViewerChip: React.FC<{
  name: string;
  locked?: boolean;
  onRemove?: () => void;
}> = ({ name, locked, onRemove }) => (
  <div
    style={{
      padding: "6px 10px 6px 8px",
      borderRadius: 999,
      border: `1px solid ${locked ? C.shu : C.sumi}`,
      background: locked ? "#FCE9E5" : C.paper,
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontFamily: F.hand,
      fontSize: 12,
      color: locked ? C.shu : C.sumi,
    }}
  >
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "#F3EEDF",
        display: "grid",
        placeItems: "center",
        fontSize: 10,
        color: C.sub,
      }}
    >
      {name.slice(0, 1)}
    </span>
    {name}
    {locked ? (
      <span title="書き手はロック" style={{ color: C.shu, fontSize: 11 }}>
        🔒
      </span>
    ) : (
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          color: C.pale,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 14,
          padding: 0,
        }}
      >
        ×
      </button>
    )}
  </div>
);

export default function MemoryEditorPage() {
  const { fid = "yamada", mid } = useParams();
  const nav = useNavigate();
  const store = useFamilyStore();
  const family = store.families[fid];
  const isMobile = useIsMobile();

  const existing: Memory | undefined = mid ? family?.memories[mid] : undefined;
  // 編集可否：閲覧可能な人物（書き手 ＋ 閲覧者に含まれる人物）なら誰でも編集可。
  // 新規作成（existing なし）は常に可。ガード画面は全 hooks 宣言後に条件分岐で描画する
  // （early return だと hook order が崩れる）。
  const canEdit =
    !existing ||
    canViewMemory(existing, store.currentViewerPersonId);

  const [title, setTitle] = useState(existing?.title ?? "");
  // 時期は西暦年で保持。表示用ラベル（"1995年（平成7年）ごろ"）は保存時に組み立てる。
  const [periodYear, setPeriodYear] = useState<number | undefined>(() => {
    const n = parseInt(existing?.year ?? "", 10);
    return Number.isFinite(n) ? n : undefined;
  });
  const [protagonistId, setProtagonistId] = useState(
    existing?.protagonistId ?? family?.rootPersonId ?? "",
  );
  const [authorId, setAuthorId] = useState(
    existing?.authorId ?? store.currentViewerPersonId,
  );
  const [body, setBody] = useState(existing?.body ?? "");
  const [photoIds, setPhotoIds] = useState<string[]>(existing?.photoIds ?? []);
  const [heroPhotoId, setHeroPhotoId] = useState<string | undefined>(
    existing?.heroPhotoId,
  );
  const [viewers, setViewers] = useState<string[]>(existing?.viewers ?? []);
  const [related, setRelated] = useState<string[]>(existing?.related ?? []);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");

  const addPhotos = async () => {
    try {
      const files = await pickFile("image/*", true);
      if (files.length === 0) return;
      const next = [...photoIds];
      for (const f of files) {
        if (next.length >= 10) break;
        const id = await ingestFile(f);
        next.push(id);
      }
      setPhotoIds(next);
      if (next.length >= 10 && files.length > 10 - photoIds.length) {
        store.showToast("warn", "写真は 10 枚までです");
      }
    } catch (e) {
      console.error(e);
      store.showToast("err", "写真の読み込みに失敗しました");
    }
  };
  const removePhoto = async (id: string) => {
    const next = photoIds.filter((p) => p !== id);
    setPhotoIds(next);
    // 代表写真を削除したら先頭を自動選択（無ければ未設定）。
    if (heroPhotoId === id) setHeroPhotoId(next[0]);
    await deletePhoto(id).catch(() => undefined);
    await deletePhoto(id + ".thumb").catch(() => undefined);
  };

  // 代表写真の実効値：明示指定があればそれ、なければ先頭。
  const effectiveHeroId =
    heroPhotoId && photoIds.includes(heroPhotoId) ? heroPhotoId : photoIds[0];

  const people = family ? Object.values(family.people) : [];

  const save = () => {
    if (!title.trim()) {
      store.showToast("err", "タイトルを入れてください");
      return;
    }
    const era = periodYear !== undefined ? westernToEra(periodYear) : undefined;
    const next: Memory = {
      id: existing?.id ?? "m_" + Math.random().toString(36).slice(2, 8),
      title: title.trim(),
      periodLabel:
        periodYear !== undefined && era
          ? `${periodYear}年（${era.era}${era.year}年）ごろ`
          : "",
      protagonistId: protagonistId || undefined,
      authorId,
      body,
      viewers,
      related,
      tags,
      photos: photoIds.length || existing?.photos || 0,
      photoIds,
      heroPhotoId: effectiveHeroId,
      year: periodYear !== undefined ? String(periodYear) : "—",
      era: era ? `${era.era}${era.year}` : undefined,
    };
    if (existing) {
      store.patchMemory(fid, existing.id, next);
      store.showToast("ok", "思い出を更新しました");
    } else {
      store.addMemory(fid, next);
      store.showToast("ok", "思い出を保存しました");
    }
    nav(`/family/${fid}/memory/${next.id}`);
  };

  const canChoose = useMemo(
    () => people.filter((p) => p.id !== authorId),
    [people, authorId],
  );

  if (mid && existing && !canEdit) {
    const authorName = formatPerson(family?.people[existing.authorId]);
    return (
      <BarePage>
        <AppHeader
          familyName={family?.name ?? "—"}
          back
          showFamilyMenu
          familyId={fid}
        />
        <div style={{ padding: 80, textAlign: "center" }}>
          <Title size={24}>この思い出は編集できません</Title>
          <Hand size={12} color={C.sub} style={{ display: "block", marginTop: 8 }}>
            書き手（{authorName}）と閲覧者に登録された人のみ編集できます。自分を切り替えると編集可能になる場合があります。
          </Hand>
          <div style={{ marginTop: 20 }}>
            <SketchBtn to="/settings">自分を切り替える</SketchBtn>
          </div>
        </div>
      </BarePage>
    );
  }

  return (
    <BarePage>
      <AppHeader
        familyName={family?.name ?? "—"}
        back
        backTo={`/family/${fid}/memories`}
        showFamilyMenu
        familyId={fid}
        right={
          <Row gap={10}>
            <Hand size={11} color={C.shu}>
              ● 下書き中
            </Hand>
            <SketchBtn
              size="sm"
              onClick={() => store.showToast("ok", "下書きを保存しました")}
            >
              下書き保存
            </SketchBtn>
            <SketchBtn size="sm" primary icon="✓" onClick={save}>
              保存
            </SketchBtn>
          </Row>
        }
      />
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          height: "calc(100vh - 56px)",
          overflow: isMobile ? "auto" : "hidden",
        }}
      >
        {/* Main */}
        <div
          style={{
            flex: 1,
            padding: isMobile ? "20px 18px" : "28px 40px",
            overflowY: isMobile ? "visible" : "auto",
            minWidth: 0,
          }}
        >
          <Hand size={11} color={C.shu} style={{ letterSpacing: "0.25em" }}>
            ─── 思い出ノート
          </Hand>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトル（例: 春の花が咲いた年）"
            style={{
              width: "100%",
              marginTop: 6,
              fontFamily: F.mincho,
              fontSize: 32,
              fontWeight: 700,
              color: C.sumi,
              border: "none",
              borderBottom: `2px solid ${C.sumi}`,
              padding: "6px 2px",
              outline: "none",
              background: "transparent",
            }}
          />
          <Hand
            size={11}
            color={C.pale}
            style={{ display: "block", marginTop: 6 }}
          >
            短く、あなたの言葉で。
          </Hand>

          <Row gap={12} wrap align="flex-start" style={{ marginTop: 20 }}>
            <Field label="主人公" width={200} reserveHint>
              <select
                value={protagonistId}
                onChange={(e) => setProtagonistId(e.target.value)}
                style={{
                  width: "100%",
                  fontFamily: F.mincho,
                  fontSize: 14,
                  padding: "8px 12px",
                  minHeight: 34,
                  border: `1px solid ${C.sumi}`,
                  borderRadius: 3,
                  boxShadow: `2px 2px 0 ${C.sumi}`,
                  background: C.paper,
                  boxSizing: "border-box",
                }}
              >
                <option value="">（未選択）</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatPerson(p)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="時期" width={240} reserveHint>
              <YearPicker
                value={periodYear}
                onChange={setPeriodYear}
                placeholder="年を選ぶ"
              />
            </Field>
            <Field label="書き手" width={200} hint="あなた">
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                style={{
                  width: "100%",
                  fontFamily: F.mincho,
                  fontSize: 14,
                  padding: "8px 12px",
                  minHeight: 34,
                  border: `1px solid ${C.sumi}`,
                  borderRadius: 3,
                  boxShadow: `2px 2px 0 ${C.sumi}`,
                  background: C.paper,
                  boxSizing: "border-box",
                }}
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatPerson(p)}
                  </option>
                ))}
              </select>
            </Field>
          </Row>

          <div style={{ marginTop: 24 }}>
            <Hand size={12} color={C.sub} bold>
              本文
            </Hand>
            <RichEditor value={body} onChange={setBody} />
          </div>

          <div style={{ marginTop: 24 }}>
            <Row justify="space-between">
              <Hand size={12} color={C.sub} bold>
                写真（{photoIds.length} / 10）
              </Hand>
              <Hand size={11} color={C.pale}>
                最大10枚／JPEG に圧縮してIndexedDBへ保存
              </Hand>
            </Row>
            <Hand size={11} color={C.pale} style={{ display: "block", marginTop: 4 }}>
              写真をクリックすると代表写真として選べます（既定は最初の写真）。
            </Hand>
            <Row gap={10} wrap style={{ marginTop: 10 }}>
              {photoIds.map((id) => {
                const isHero = id === effectiveHeroId;
                return (
                  <div
                    key={id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setHeroPhotoId(id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setHeroPhotoId(id);
                      }
                    }}
                    title={isHero ? "代表写真" : "クリックで代表写真に設定"}
                    style={{
                      position: "relative",
                      padding: 3,
                      border: `3px solid ${isHero ? "#2F6FEB" : "transparent"}`,
                      borderRadius: 6,
                      boxShadow: isHero ? "0 0 0 1px #2F6FEB33" : undefined,
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <PhotoFromIdb id={id} size={108} rounded={3} />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(id);
                      }}
                      title="この写真を削除"
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "rgba(255,254,248,0.95)",
                        border: `1px solid ${C.sumi}`,
                        fontFamily: F.mincho,
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                    {isHero && (
                      <span
                        style={{
                          position: "absolute",
                          right: 6,
                          bottom: 6,
                          background: "#2F6FEB",
                          color: "#fff",
                          fontFamily: F.hand,
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 2,
                          letterSpacing: "0.05em",
                          pointerEvents: "none",
                        }}
                      >
                        代表写真
                      </span>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                disabled={photoIds.length >= 10}
                onClick={addPhotos}
                style={{
                  width: 108,
                  height: 108,
                  border: `1.5px dashed ${C.pale}`,
                  borderRadius: 4,
                  background: "transparent",
                  cursor: photoIds.length >= 10 ? "not-allowed" : "pointer",
                  opacity: photoIds.length >= 10 ? 0.4 : 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: F.hand,
                  fontSize: 11,
                  color: C.pale,
                }}
              >
                <span style={{ fontSize: 24, color: C.sumi }}>＋</span>
                追加
              </button>
            </Row>
          </div>

          <Brush width="100%" color={C.shuSoft} />

          <div style={{ marginTop: 18 }}>
            <Hand size={12} color={C.sub} bold>
              関連する人物（{related.length}）
            </Hand>
            <Row gap={6} wrap style={{ marginTop: 8 }}>
              {related.map((rid) => {
                const p = family?.people[rid];
                return (
                  <Chip key={rid}>
                    {formatPerson(p)}
                    <button
                      type="button"
                      onClick={() => setRelated(related.filter((x) => x !== rid))}
                      style={{
                        background: "none",
                        border: "none",
                        color: C.pale,
                        cursor: "pointer",
                        marginLeft: 4,
                      }}
                      title="外す"
                    >
                      ×
                    </button>
                  </Chip>
                );
              })}
              <select
                value=""
                onChange={(e) => {
                  const id = e.target.value;
                  if (id && !related.includes(id)) setRelated([...related, id]);
                }}
                style={{
                  fontFamily: F.hand,
                  fontSize: 12,
                  border: `1px dashed ${C.pale}`,
                  borderRadius: 999,
                  padding: "5px 10px",
                  background: "transparent",
                  color: C.sub,
                  cursor: "pointer",
                }}
              >
                <option value="">＋ 人物を選ぶ…</option>
                {people
                  .filter((p) => !related.includes(p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatPerson(p)}
                      {p.role ? `（${p.role}）` : ""}
                    </option>
                  ))}
              </select>
            </Row>
          </div>

          <div style={{ marginTop: 18 }}>
            <Hand size={12} color={C.sub} bold>
              タグ
            </Hand>
            <Row gap={6} wrap style={{ marginTop: 8 }}>
              {tags.map((t) => (
                <Chip key={t} tone="mute">
                  <span>#{t}</span>{" "}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.pale,
                      cursor: "pointer",
                      marginLeft: 2,
                    }}
                  >
                    ×
                  </button>
                </Chip>
              ))}
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                placeholder="タグを追加"
                onKeyDown={(e) => {
                  // IME 変換中の Enter は確定用なのでタグ追加には使わない。
                  if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                  if (e.key === "Enter" && tagDraft.trim()) {
                    setTags([...tags, tagDraft.replace(/^#/, "")]);
                    setTagDraft("");
                  }
                }}
                style={{
                  fontFamily: F.hand,
                  fontSize: 12,
                  border: `1px dashed ${C.pale}`,
                  borderRadius: 999,
                  padding: "4px 12px",
                  background: "transparent",
                  outline: "none",
                  color: C.sumi,
                  minWidth: 120,
                }}
              />
            </Row>
          </div>
        </div>

        {/* Right: ViewerPicker（モバイルでは main の下にスタック） */}
        <div
          style={{
            width: isMobile ? "100%" : 320,
            flex: "none",
            borderLeft: isMobile ? "none" : `1px solid ${C.line}`,
            borderTop: isMobile ? `1px solid ${C.line}` : "none",
            background: "#FBF6E6",
            padding: isMobile ? "18px 18px 40px" : "24px 20px",
            overflowY: isMobile ? "visible" : "auto",
          }}
        >
          <Hand size={11} color={C.shu} style={{ letterSpacing: "0.2em" }}>
            ─── 閲覧者
          </Hand>
          <Title size={17} style={{ marginTop: 2 }}>
            この思い出を読める人
          </Title>
          <Hand size={11} color={C.sub} style={{ display: "block", marginTop: 6 }}>
            書き手（あなた）は常に読めます。他に読める人を追加してください。
          </Hand>

          <Col gap={8} style={{ marginTop: 16 }}>
            <ViewerChip
              name={`${formatPerson(family?.people[authorId])}（書き手）`}
              locked
            />
            {viewers
              .filter((v) => v !== authorId)
              .map((v) => (
                <ViewerChip
                  key={v}
                  name={formatPerson(family?.people[v])}
                  onRemove={() => setViewers(viewers.filter((x) => x !== v))}
                />
              ))}
          </Col>

          <div
            style={{
              marginTop: 14,
              background: C.paper,
              border: `1px solid ${C.line}`,
              borderRadius: 3,
              padding: 10,
            }}
          >
            <Row justify="space-between" align="center">
              <Hand size={11} color={C.shu} bold>
                候補（{canChoose.filter((p) => !viewers.includes(p.id)).length}）
              </Hand>
              <button
                type="button"
                onClick={() => {
                  const rest = canChoose
                    .filter((p) => !viewers.includes(p.id))
                    .map((p) => p.id);
                  if (rest.length === 0) return;
                  setViewers([...viewers, ...rest]);
                }}
                disabled={
                  canChoose.filter((p) => !viewers.includes(p.id)).length === 0
                }
                style={{
                  background: "none",
                  border: "none",
                  color: C.shu,
                  cursor: "pointer",
                  fontFamily: F.hand,
                  fontSize: 11,
                  padding: 0,
                }}
              >
                ＋ 全員を追加
              </button>
            </Row>
            <Col gap={2} style={{ marginTop: 6 }}>
              {canChoose
                .filter((p) => !viewers.includes(p.id))
                .map((p) => (
                  <Row
                    key={p.id}
                    justify="space-between"
                    style={{
                      padding: "6px 4px",
                      borderTop: `1px dashed ${C.line}`,
                    }}
                  >
                    <Hand size={12}>
                      {formatPerson(p)}
                      {p.role ? `（${p.role}）` : ""}
                    </Hand>
                    <button
                      type="button"
                      onClick={() => setViewers([...viewers, p.id])}
                      style={{
                        background: "none",
                        border: "none",
                        color: C.shu,
                        cursor: "pointer",
                        fontFamily: F.hand,
                        fontSize: 11,
                      }}
                    >
                      ＋ 追加
                    </button>
                  </Row>
                ))}
            </Col>
          </div>

          <Hand size={11} color={C.pale} style={{ display: "block", marginTop: 14 }}>
            ※ 閲覧制御は端末内の UI フィルタです。共有ファイルを配布すれば他の人は読めます。
          </Hand>
        </div>
      </div>
    </BarePage>
  );
}
