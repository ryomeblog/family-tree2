import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hand,
  Title,
  SketchBtn,
  Row,
  Col,
  Field,
  Brush,
  C,
  F,
} from "../components/ui";
import {
  useFamilyStore,
  Person,
  FuzzyDate,
  Gender,
  formatPerson,
} from "../stores/familyStore";
import {
  parentsOf,
  spousesOf,
  childrenOf,
} from "../domain/selectors";
import { pickFile, ingestFile } from "../features/photos/ingest";
import { PhotoFromIdb } from "../features/photos/PhotoFromIdb";
import { deletePhoto } from "../storage/idb";

const GENDERS: { k: Gender; label: string }[] = [
  { k: "m", label: "男性" },
  { k: "f", label: "女性" },
  { k: "other", label: "その他" },
  { k: "unknown", label: "不明" },
];

type FuzzyMode = "exact" | "era" | "year" | "unknown";

function fuzzyToParts(d?: FuzzyDate) {
  if (!d || d.kind === "unknown")
    return {
      mode: "unknown" as FuzzyMode,
      era: "昭和",
      year: "",
      month: "",
      day: "",
    };
  if (d.kind === "year")
    return {
      mode: "year" as FuzzyMode,
      era: "昭和",
      year: String(d.y),
      month: "",
      day: "",
    };
  if (d.kind === "era")
    return {
      mode: "era" as FuzzyMode,
      era: d.era,
      year: String(d.year),
      month: d.m ? String(d.m) : "",
      day: d.d ? String(d.d) : "",
    };
  return {
    mode: "exact" as FuzzyMode,
    era: "昭和",
    year: String(d.y),
    month: d.m ? String(d.m) : "",
    day: d.d ? String(d.d) : "",
  };
}

function partsToFuzzy(p: ReturnType<typeof fuzzyToParts>): FuzzyDate {
  if (p.mode === "unknown") return { kind: "unknown" };
  const y = parseInt(p.year, 10);
  if (!y) return { kind: "unknown" };
  if (p.mode === "year") return { kind: "year", y };
  if (p.mode === "era") {
    return {
      kind: "era",
      era: p.era as "明治" | "大正" | "昭和" | "平成" | "令和",
      year: y,
      m: p.month ? parseInt(p.month, 10) : undefined,
      d: p.day ? parseInt(p.day, 10) : undefined,
    };
  }
  return {
    kind: "exact",
    y,
    m: p.month ? parseInt(p.month, 10) : undefined,
    d: p.day ? parseInt(p.day, 10) : undefined,
  };
}

const ERA_TO_WESTERN: Record<string, number> = {
  明治: 1867,
  大正: 1911,
  昭和: 1925,
  平成: 1988,
  令和: 2018,
};

function fuzzyPreview(p: ReturnType<typeof fuzzyToParts>): string {
  if (p.mode === "unknown") return "不明";
  const y = parseInt(p.year, 10);
  if (!y) return "（年を入力）";
  if (p.mode === "year") return `${y}年`;
  if (p.mode === "era") {
    const western = (ERA_TO_WESTERN[p.era] ?? 1925) + y;
    let s = `${p.era}${y}年`;
    if (p.month) s += `${p.month}月`;
    if (p.day) s += `${p.day}日`;
    return s + ` = ${western}年`;
  }
  let s = `${y}年`;
  if (p.month) s += `${p.month}月`;
  if (p.day) s += `${p.day}日`;
  return s;
}

const FuzzyDateInput: React.FC<{
  label: string;
  value: ReturnType<typeof fuzzyToParts>;
  onChange: (v: ReturnType<typeof fuzzyToParts>) => void;
}> = ({ label, value, onChange }) => {
  const MODES: { k: FuzzyMode; label: string }[] = [
    { k: "exact", label: "西暦" },
    { k: "era", label: "和暦" },
    { k: "year", label: "年のみ" },
    { k: "unknown", label: "不明" },
  ];
  const set = (patch: Partial<typeof value>) => onChange({ ...value, ...patch });
  const disabledAll = value.mode === "unknown";
  return (
    <div>
      <Hand
        size={12}
        color={C.sub}
        bold
        style={{ display: "block", marginBottom: 6 }}
      >
        {label}
      </Hand>
      <div
        style={{
          border: `1px solid ${C.sumi}`,
          borderRadius: 3,
          background: C.paper,
          padding: 8,
          boxShadow: `2px 2px 0 ${C.sumi}`,
        }}
      >
        <Row gap={6} wrap>
          {MODES.map((m) => (
            <button
              key={m.k}
              type="button"
              onClick={() => set({ mode: m.k })}
              style={{
                padding: "3px 10px",
                borderRadius: 3,
                fontFamily: F.hand,
                fontSize: 11,
                background: value.mode === m.k ? C.shu : "transparent",
                color: value.mode === m.k ? C.paper : C.sub,
                border: `1px solid ${value.mode === m.k ? C.shu : C.line}`,
                cursor: "pointer",
              }}
            >
              {m.label}
            </button>
          ))}
        </Row>
        <Row gap={8} wrap style={{ marginTop: 10 }}>
          {value.mode === "era" && (
            <select
              value={value.era}
              onChange={(e) => set({ era: e.target.value })}
              disabled={disabledAll}
              style={{
                fontFamily: F.mincho,
                border: `1px solid ${C.line}`,
                padding: "4px 6px",
                background: "#FBF6E6",
                fontSize: 13,
              }}
            >
              {Object.keys(ERA_TO_WESTERN).map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          )}
          <input
            placeholder="年"
            type="number"
            value={value.year}
            onChange={(e) => set({ year: e.target.value })}
            disabled={disabledAll}
            style={{
              width: 80,
              fontFamily: F.mincho,
              border: `1px solid ${C.line}`,
              padding: "4px 8px",
              fontSize: 13,
            }}
          />
          <Hand size={12}>年</Hand>
          {value.mode !== "year" && (
            <>
              <input
                placeholder="月"
                type="number"
                value={value.month}
                onChange={(e) => set({ month: e.target.value })}
                disabled={disabledAll}
                style={{
                  width: 56,
                  fontFamily: F.mincho,
                  border: `1px solid ${C.line}`,
                  padding: "4px 8px",
                  fontSize: 13,
                }}
              />
              <Hand size={12}>月</Hand>
              <input
                placeholder="日"
                type="number"
                value={value.day}
                onChange={(e) => set({ day: e.target.value })}
                disabled={disabledAll}
                style={{
                  width: 56,
                  fontFamily: F.mincho,
                  border: `1px solid ${C.line}`,
                  padding: "4px 8px",
                  fontSize: 13,
                }}
              />
              <Hand size={12}>日</Hand>
            </>
          )}
        </Row>
        <Hand size={10.5} color={C.pale} style={{ display: "block", marginTop: 6 }}>
          = {fuzzyPreview(value)}
        </Hand>
      </div>
    </div>
  );
};

export default function PersonForm({
  mode = "add",
  familyId,
  personId,
  onClose,
}: {
  mode?: "add" | "edit";
  familyId: string;
  personId?: string;
  onClose?: () => void;
}) {
  const nav = useNavigate();
  const store = useFamilyStore();
  const family = store.families[familyId];
  const existing = personId ? family?.people[personId] : undefined;

  const [surname, setSurname] = useState(existing?.surname ?? "");
  const [given, setGiven] = useState(existing?.given ?? "");
  const [role, setRole] = useState(existing?.role ?? "");
  const [kanaSurname, setKanaSurname] = useState(existing?.kanaSurname ?? "");
  const [kanaGiven, setKanaGiven] = useState(existing?.kanaGiven ?? "");
  const [maiden, setMaiden] = useState(existing?.maidenName ?? "");
  const [gender, setGender] = useState<Gender>(existing?.gender ?? "m");
  const [place, setPlace] = useState(existing?.birthPlace ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [birth, setBirth] = useState(fuzzyToParts(existing?.birth));
  const [death, setDeath] = useState(fuzzyToParts(existing?.death));
  const [portrait, setPortrait] = useState<string | undefined>(existing?.portrait);

  const choosePortrait = async () => {
    try {
      const files = await pickFile("image/*", false);
      if (files[0]) {
        const id = await ingestFile(files[0]);
        if (portrait) {
          await deletePhoto(portrait).catch(() => undefined);
          await deletePhoto(portrait + ".thumb").catch(() => undefined);
        }
        setPortrait(id);
      }
    } catch (e) {
      console.error(e);
      store.showToast("err", "写真の読み込みに失敗しました");
    }
  };
  const clearPortrait = async () => {
    if (!portrait) return;
    await deletePhoto(portrait).catch(() => undefined);
    await deletePhoto(portrait + ".thumb").catch(() => undefined);
    setPortrait(undefined);
  };

  const save = (andAdd?: boolean) => {
    if (!surname.trim() && !given.trim()) {
      store.showToast("err", "姓か名のどちらかを入れてください");
      return;
    }
    const next: Person = {
      id: existing?.id ?? "p_" + Math.random().toString(36).slice(2, 8),
      surname: surname.trim(),
      given: given.trim(),
      kanaSurname: kanaSurname || undefined,
      kanaGiven: kanaGiven || undefined,
      maidenName: maiden || undefined,
      gender,
      birth: partsToFuzzy(birth),
      death: death.mode === "unknown" ? undefined : partsToFuzzy(death),
      birthPlace: place || undefined,
      note: note || undefined,
      role: role || undefined,
      portrait,
      deceased: death.mode !== "unknown",
    };
    if (mode === "edit" && existing) {
      store.patchPerson(familyId, existing.id, next);
      store.showToast("ok", `${next.surname}${next.given} を更新しました`);
    } else {
      store.addPerson(familyId, next);
      store.showToast("ok", `${next.surname}${next.given} を追加しました`);
    }
    if (andAdd) {
      // clear most fields for the next entry
      setGiven("");
      setRole("");
      setNote("");
      setKanaGiven("");
      setMaiden("");
      setBirth(fuzzyToParts(undefined));
      setDeath(fuzzyToParts(undefined));
      return;
    }
    onClose?.();
  };

  const remove = () => {
    if (!existing) return;
    store.removePerson(familyId, existing.id);
    store.showToast("ok", "人物を削除しました");
    nav(`/family/${familyId}/tree`);
  };

  return (
    <div
      style={{
        width: 720,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "calc(100vh - 120px)",
        background: C.paper,
        border: `2px solid ${C.sumi}`,
        borderRadius: 6,
        boxShadow: "0 40px 80px -24px rgba(0,0,0,0.45)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Row
        justify="space-between"
        style={{
          padding: "20px 28px 14px",
          borderBottom: `1px solid ${C.line}`,
          flex: "none",
        }}
      >
        <div>
          <Hand size={11} color={C.shu} style={{ letterSpacing: "0.25em" }}>
            ─── {mode === "add" ? "NEW PERSON" : "EDIT PERSON"}
          </Hand>
          <Title size={22}>
            {mode === "add" ? "人物を追加" : "人物を編集"}
          </Title>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontFamily: F.hand,
            fontSize: 22,
            color: C.pale,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </Row>

      <div
        style={{
          padding: "20px 28px",
          overflowY: "auto",
          overflowX: "hidden",
          flex: 1,
          minHeight: 0,
        }}
      >
        <Row gap={24} align="flex-start" wrap>
          <Col gap={10} style={{ width: 180, alignItems: "center" }}>
            <PhotoFromIdb
              id={portrait}
              size={160}
              rounded={4}
              label="肖像"
            />
            <Row gap={6}>
              <SketchBtn size="sm" icon="↥" onClick={choosePortrait}>
                {portrait ? "写真を変更" : "写真を選ぶ"}
              </SketchBtn>
              {portrait && (
                <SketchBtn size="sm" danger onClick={clearPortrait}>
                  外す
                </SketchBtn>
              )}
            </Row>
            <Hand size={10} color={C.pale}>
              最大辺 1600px へリサイズ＋正方形サムネを同時保存
            </Hand>
          </Col>

          <Col gap={14} style={{ flex: 1, minWidth: 320 }}>
            <Row gap={12} wrap align="flex-start">
              <Field
                label="姓"
                value={surname}
                onChange={setSurname}
                placeholder="山田"
                required
                width={160}
              />
              <Field
                label="名"
                value={given}
                onChange={setGiven}
                placeholder="太郎"
                required
                width={160}
              />
              <Field
                label="続柄"
                value={role}
                onChange={setRole}
                placeholder="例: 私 / 父 / 祖母"
                width={180}
              />
            </Row>
            <Row gap={12} wrap align="flex-start">
              <Field
                label="ふりがな（姓）"
                value={kanaSurname}
                onChange={setKanaSurname}
                placeholder="やまだ"
                width={160}
              />
              <Field
                label="ふりがな（名）"
                value={kanaGiven}
                onChange={setKanaGiven}
                placeholder="はるこ"
                width={160}
              />
              <Field
                label="旧姓"
                value={maiden}
                onChange={setMaiden}
                placeholder="—"
                width={140}
              />
            </Row>
            <Row gap={12} wrap align="flex-start">
              <div>
                <Hand
                  size={12}
                  color={C.sub}
                  bold
                  style={{ display: "block", marginBottom: 6 }}
                >
                  性別
                </Hand>
                <Row gap={6} wrap>
                  {GENDERS.map((g) => (
                    <button
                      key={g.k}
                      type="button"
                      onClick={() => setGender(g.k)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 3,
                        fontFamily: F.hand,
                        fontSize: 12,
                        background: gender === g.k ? C.paper : "transparent",
                        color: gender === g.k ? C.shu : C.sub,
                        border: `1px solid ${gender === g.k ? C.sumi : C.line}`,
                        boxShadow: gender === g.k ? `1.5px 1.5px 0 ${C.sumi}` : undefined,
                        cursor: "pointer",
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </Row>
              </div>
              <Field
                label="出生地"
                value={place}
                onChange={setPlace}
                placeholder="東京都・新宿区"
                width={240}
              />
            </Row>

            <FuzzyDateInput label="生年月日" value={birth} onChange={setBirth} />
            <FuzzyDateInput
              label="没年月日（存命の場合は「不明」のまま）"
              value={death}
              onChange={setDeath}
            />

            <Field
              label="備考"
              textarea
              rows={3}
              value={note}
              onChange={setNote}
              placeholder="好きなもの・思い出・役割など"
            />
          </Col>
        </Row>

        <Brush width="100%" color={C.shuSoft} />

        {mode === "edit" && existing && family && (
          <RelationsSection
            familyId={familyId}
            personId={existing.id}
          />
        )}
      </div>

      <Row
        justify={mode === "edit" ? "space-between" : "flex-end"}
        style={{
          padding: "14px 28px",
          borderTop: `1px solid ${C.line}`,
          background: "#FBF6E6",
          flex: "none",
        }}
      >
        {mode === "edit" && (
          <SketchBtn danger icon="✕" onClick={remove}>
            この人物を削除
          </SketchBtn>
        )}
        <Row gap={10}>
          <SketchBtn onClick={onClose}>キャンセル</SketchBtn>
          {mode === "add" && (
            <SketchBtn onClick={() => save(true)}>保存して続けて追加</SketchBtn>
          )}
          <SketchBtn primary onClick={() => save(false)}>
            保存
          </SketchBtn>
        </Row>
      </Row>
    </div>
  );
}

function RelationsSection({
  familyId,
  personId,
}: {
  familyId: string;
  personId: string;
}) {
  const store = useFamilyStore();
  const family = store.families[familyId];
  if (!family) return null;
  const person = family.people[personId];
  if (!person) return null;

  const spouses = spousesOf(family, personId);
  const parents = parentsOf(family, personId);
  const children = childrenOf(family, personId);

  const Row1 = ({
    label,
    name,
    onRemove,
  }: {
    label: string;
    name: string;
    onRemove: () => void;
  }) => (
    <Row
      justify="space-between"
      style={{
        padding: "8px 12px",
        border: `1px solid ${C.line}`,
        borderRadius: 3,
        background: "#FBF6E6",
      }}
    >
      <Hand size={12}>
        <b>{label}</b>　{name}
      </Hand>
      <SketchBtn size="sm" danger onClick={onRemove}>
        外す
      </SketchBtn>
    </Row>
  );

  const total = spouses.length + parents.length + children.length;

  return (
    <div style={{ marginTop: 20 }}>
      <Title size={15}>関係（{total} 件）</Title>
      <Hand size={11} color={C.pale}>
        行単位で外す — 追加は「関係を追加…」から
      </Hand>
      <Col gap={6} style={{ marginTop: 10 }}>
        {spouses.map((sp) => {
          const union = family.unions.find(
            (u) =>
              (u.partnerA === personId && u.partnerB === sp.id) ||
              (u.partnerB === personId && u.partnerA === sp.id),
          );
          return (
            <Row1
              key={"sp-" + sp.id}
              label="配偶者"
              name={formatPerson(sp)}
              onRemove={() => {
                if (!union) return;
                store.removeUnion(familyId, union.id);
                store.showToast("ok", `${formatPerson(sp)} との配偶者関係を外しました`);
              }}
            />
          );
        })}
        {parents.map((p) => (
          <Row1
            key={"pa-" + p.id}
            label="親"
            name={formatPerson(p)}
            onRemove={() => {
              store.removeParentChildLink(
                familyId,
                (l) =>
                  l.childId === personId &&
                  (l.parentId === p.id ||
                    (!!l.parentUnion &&
                      family.unions
                        .find((u) => u.id === l.parentUnion)
                        ? [
                            family.unions.find((u) => u.id === l.parentUnion)!.partnerA,
                            family.unions.find((u) => u.id === l.parentUnion)!.partnerB,
                          ].includes(p.id)
                        : false)),
              );
              store.showToast("ok", `${formatPerson(p)} を親から外しました`);
            }}
          />
        ))}
        {children.map((c) => (
          <Row1
            key={"ch-" + c.id}
            label="子"
            name={formatPerson(c)}
            onRemove={() => {
              store.removeParentChildLink(
                familyId,
                (l) =>
                  l.childId === c.id &&
                  (l.parentId === personId ||
                    (!!l.parentUnion &&
                      family.unions
                        .find((u) => u.id === l.parentUnion)
                        ? [
                            family.unions.find((u) => u.id === l.parentUnion)!.partnerA,
                            family.unions.find((u) => u.id === l.parentUnion)!.partnerB,
                          ].includes(personId)
                        : false)),
              );
              store.showToast("ok", `${formatPerson(c)} を子から外しました`);
            }}
          />
        ))}
        {total === 0 && (
          <Hand size={12} color={C.pale}>
            登録されている関係はありません。
          </Hand>
        )}
        <div style={{ marginTop: 6 }}>
          <SketchBtn
            size="sm"
            icon="＋"
            to={`/family/${familyId}/relate?pid=${personId}`}
          >
            関係を追加…
          </SketchBtn>
        </div>
      </Col>
    </div>
  );
}
