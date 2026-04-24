import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
  InkDot,
  C,
  F,
} from "../components/ui";
import {
  useFamilyStore,
  formatPerson,
  formatBirthYear,
} from "../stores/familyStore";
import {
  parentsOf,
  childrenOf,
  spousesOf,
  siblingsOf,
  memoriesOfPerson,
  canViewMemory,
} from "../domain/selectors";
import { formatFuzzyDate } from "../domain/fuzzyDate";
import { PhotoFromIdb } from "../features/photos/PhotoFromIdb";
import { useIsMobile } from "../hooks/useMediaQuery";

export default function PersonDetailPage() {
  const { fid = "yamada", pid = "" } = useParams();
  const nav = useNavigate();
  const store = useFamilyStore();
  const family = store.families[fid];
  const isMobile = useIsMobile();
  const person = family?.people[pid];

  if (!family || !person) {
    return (
      <BarePage>
        <AppHeader back backTo={`/family/${fid}/tree`} />
        <div style={{ padding: 60, textAlign: "center" }}>
          <Title size={24}>人物が見つかりません</Title>
          <Hand color={C.sub} style={{ display: "block", marginTop: 8 }}>
            URL に指定された ID の人物はこの家系にいません。
          </Hand>
          <div style={{ marginTop: 16 }}>
            <SketchBtn to={`/family/${fid}/tree`}>家系図に戻る</SketchBtn>
          </div>
        </div>
      </BarePage>
    );
  }

  const parents = parentsOf(family, pid);
  const spouses = spousesOf(family, pid);
  const children = childrenOf(family, pid);
  const siblings = siblingsOf(family, pid);
  const allMemories = memoriesOfPerson(family, pid);
  const visibleMemories = allMemories.filter((m) =>
    canViewMemory(m, store.currentViewerPersonId),
  );
  // 表示可能な思い出に紐づく photoIds を集約。重複は除き、先頭で
  // ライトボックスを開いた時にも全枚数で前後遷移できるよう配列で保持。
  const personPhotoIds = Array.from(
    new Set(visibleMemories.flatMap((m) => m.photoIds ?? [])),
  );
  const photosCount = personPhotoIds.length;

  const [role, setRole] = useState(person.role ?? "");

  return (
    <BarePage>
      <AppHeader
        familyName={family.name}
        back
        backTo={`/family/${fid}/tree`}
        showFamilyMenu
        familyId={fid}
        right={
          <Row gap={8}>
            <SketchBtn
              size="sm"
              icon="筆"
              to={`/family/${fid}/person/${pid}/edit`}
              title="編集"
            >
              {isMobile ? "" : "編集"}
            </SketchBtn>
            <SketchBtn
              size="sm"
              icon="家"
              to={`/family/${fid}/tree`}
              title="家系図で見る"
            >
              {isMobile ? "" : "家系図で見る"}
            </SketchBtn>
          </Row>
        }
      />

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          height: "calc(100vh - 56px)",
          overflowY: isMobile ? "auto" : "hidden",
        }}
      >
        {/* Left: portrait / role — モバイルでは幅 100% で上段に */}
        <div
          style={{
            width: isMobile ? "100%" : 300,
            borderRight: isMobile ? "none" : `1px solid ${C.line}`,
            borderBottom: isMobile ? `1px solid ${C.line}` : "none",
            background: "#FBF6E6",
            padding: isMobile ? "18px 16px" : "28px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            flex: "none",
            overflowY: isMobile ? "visible" : "auto",
          }}
        >
          <PhotoFromIdb id={person.portrait} size={240} rounded={6} />
          <Title size={24}>{formatPerson(person)}</Title>
          <Hand size={12} color={C.sub}>
            {person.kanaSurname ?? ""} {person.kanaGiven ?? ""}
            {person.maidenName ? ` ／ 旧姓: ${person.maidenName}` : ""}
          </Hand>
          <Hand size={14}>
            {formatFuzzyDate(person.birth)} 〜 {person.deceased
              ? formatFuzzyDate(person.death)
              : "存命"}
          </Hand>
          <Row gap={6} wrap>
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
            {person.birthPlace && <Chip tone="mute">{person.birthPlace}</Chip>}
          </Row>
          <div style={{ marginTop: 8 }}>
            <Hand size={11} color={C.pale} style={{ display: "block", marginBottom: 6 }}>
              ロール
            </Hand>
            <input
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                store.patchPerson(fid, pid, { role: e.target.value });
              }}
              placeholder="例: 祖父として"
              style={{
                width: "100%",
                border: `1px solid ${C.sumi}`,
                borderRadius: 3,
                padding: "6px 10px",
                background: C.paper,
                fontFamily: "'Kaisei Decol', serif",
                fontSize: 13,
                boxShadow: `2px 2px 0 ${C.sumi}`,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Center: notes + memories */}
        <div
          style={{
            flex: 1,
            padding: isMobile ? "18px 16px" : "28px 32px",
            overflowY: isMobile ? "visible" : "auto",
            minWidth: 0,
          }}
        >
          <Hand size={11} color={C.shu} style={{ letterSpacing: "0.2em" }}>
            ─── ことの流れ
          </Hand>
          <Title size={22}>備考と思い出</Title>
          <Brush width={100} color={C.shuSoft} />

          {person.note && (
            <div
              style={{
                marginTop: 16,
                background: "#F6F0DE",
                border: `1px solid ${C.line}`,
                borderRadius: 4,
                padding: "14px 18px",
              }}
            >
              <Hand size={12} color={C.sub}>
                <b>備考</b>
                <br />
                {person.note}
              </Hand>
            </div>
          )}

          <div style={{ marginTop: 28 }}>
            <Title size={18}>
              関連する思い出（{visibleMemories.length} 件）
            </Title>
            {visibleMemories.length === 0 ? (
              <Hand size={12} color={C.pale} style={{ display: "block", marginTop: 8 }}>
                この人物に関連する思い出はまだありません。
              </Hand>
            ) : (
              <Row gap={12} wrap style={{ marginTop: 12 }}>
                {visibleMemories.map((m) => (
                  <Link
                    key={m.id}
                    to={`/family/${fid}/memory/${m.id}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      width: 200,
                      background: C.paper,
                      border: `1px solid ${C.line}`,
                      borderRadius: 4,
                      padding: "12px 14px",
                      display: "block",
                    }}
                  >
                    <Hand size={10} color={C.pale}>
                      {m.year}年
                    </Hand>
                    <Title size={14} style={{ margin: "4px 0" }}>
                      {m.title}
                    </Title>
                    <Hand size={11} color={C.sub}>
                      書き手: {formatPerson(family.people[m.authorId])}
                    </Hand>
                  </Link>
                ))}
              </Row>
            )}
          </div>

          <div style={{ marginTop: 28 }}>
            <Row justify="space-between">
              <Title size={18}>写真の記録</Title>
              <Hand size={11} color={C.pale}>
                思い出ノートから自動で集まります（{photosCount} 枚）
              </Hand>
            </Row>
            <Row gap={10} wrap style={{ marginTop: 12 }}>
              {personPhotoIds.slice(0, 12).map((id, i) => (
                <Link
                  key={id}
                  to={`/family/${fid}/photo/${id}?ids=${personPhotoIds.join(",")}&i=${i}`}
                  title={`写真 ${i + 1} / ${photosCount}`}
                  style={{
                    display: "inline-block",
                    lineHeight: 0,
                    borderRadius: 4,
                    cursor: "zoom-in",
                  }}
                >
                  <PhotoFromIdb id={id} size={96} rounded={4} />
                </Link>
              ))}
              {photosCount > 12 && (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    display: "grid",
                    placeItems: "center",
                    border: `1px dashed ${C.pale}`,
                    color: C.pale,
                    fontFamily: F.hand,
                    fontSize: 12,
                    borderRadius: 4,
                  }}
                >
                  +{photosCount - 12}
                </div>
              )}
              {photosCount === 0 && (
                <Hand size={11} color={C.pale}>
                  写真はまだありません。
                </Hand>
              )}
            </Row>
          </div>
        </div>

        {/* Right: family sidebar — モバイルでは下段に積む */}
        <div
          style={{
            width: isMobile ? "100%" : 240,
            borderLeft: isMobile ? "none" : `1px solid ${C.line}`,
            borderTop: isMobile ? `1px solid ${C.line}` : "none",
            background: C.paper,
            padding: isMobile ? "18px 16px 40px" : "24px 18px",
            flex: "none",
            overflowY: isMobile ? "visible" : "auto",
          }}
        >
          <Hand size={11} color={C.shu} style={{ letterSpacing: "0.2em" }}>
            ─── 家族
          </Hand>
          <Title size={16} style={{ marginTop: 4 }}>
            つながり
          </Title>

          {[
            { label: "両親", list: parents },
            { label: "配偶者", list: spouses },
            { label: "子", list: children },
            { label: "兄弟姉妹", list: siblings },
          ].map(({ label, list }) => (
            <div key={label} style={{ marginTop: 18 }}>
              <Hand size={11} color={C.pale}>
                {label}（{list.length}）
              </Hand>
              <Col gap={6} style={{ marginTop: 6 }}>
                {list.length === 0 ? (
                  <Hand size={11} color={C.pale}>
                    —
                  </Hand>
                ) : (
                  list.map((p) => (
                    <Link
                      key={p.id}
                      to={`/family/${fid}/person/${p.id}`}
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <InkDot />
                      <Hand size={12}>
                        {formatPerson(p)}
                        {p.deceased ? "（故）" : ""}
                        {p.role && p.role !== label ? `（${p.role}）` : ""}
                      </Hand>
                    </Link>
                  ))
                )}
              </Col>
            </div>
          ))}

          <div style={{ marginTop: 24 }}>
            <SketchBtn
              size="sm"
              icon="＋"
              to={`/family/${fid}/relate?pid=${pid}`}
            >
              関係を追加
            </SketchBtn>
          </div>
          <div style={{ marginTop: 14 }}>
            <SketchBtn
              size="sm"
              danger
              to={`/family/${fid}/person/${pid}/delete`}
            >
              この人物を削除
            </SketchBtn>
          </div>
        </div>
      </div>
    </BarePage>
  );
}
