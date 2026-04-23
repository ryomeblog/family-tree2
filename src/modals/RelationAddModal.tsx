import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  Photo,
  C,
  F,
} from "../components/ui";
import {
  useFamilyStore,
  Person,
  formatPerson,
  Gender,
} from "../stores/familyStore";

type Kind = "spouse" | "ex-spouse" | "parent" | "child" | "sibling" | "adopted";

const KINDS: { k: Kind; mark: string; title: string; body: string }[] = [
  { k: "spouse", mark: "夫", title: "配偶者", body: "結婚中のパートナー" },
  { k: "ex-spouse", mark: "元", title: "元配偶者", body: "離別・死別" },
  { k: "parent", mark: "親", title: "親", body: "父母 2 人をまとめて登録" },
  { k: "child", mark: "子", title: "子", body: "配偶者と子どもをまとめて登録" },
  { k: "sibling", mark: "兄", title: "兄弟姉妹", body: "同じ親の子" },
  { k: "adopted", mark: "養", title: "養子", body: "養子縁組" },
];

const RelCard: React.FC<{
  item: (typeof KINDS)[number];
  active: boolean;
  onClick: () => void;
}> = ({ item, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      flex: 1,
      minWidth: 180,
      padding: 16,
      background: active ? "#FFF5F2" : C.paper,
      border: `${active ? 2 : 1}px solid ${active ? C.shu : C.line}`,
      borderRadius: 4,
      boxShadow: active ? `2px 2px 0 ${C.shu}` : undefined,
      cursor: "pointer",
      textAlign: "left",
    }}
  >
    <Row gap={10}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: active ? C.shu : "#FBF6E6",
          color: active ? C.paper : C.sub,
          display: "grid",
          placeItems: "center",
          fontFamily: F.mincho,
          fontWeight: 700,
          fontSize: 15,
          border: `1px solid ${active ? C.shu : C.line}`,
          flex: "none",
        }}
      >
        {item.mark}
      </div>
      <Col gap={2}>
        <Title size={14}>{item.title}</Title>
        <Hand size={11} color={C.pale}>
          {item.body}
        </Hand>
      </Col>
    </Row>
  </button>
);

// ────────────────────────────────────────────────────────────────
// Entry point
// ────────────────────────────────────────────────────────────────
export default function RelationAddModal() {
  const { fid = "yamada" } = useParams();
  const [search] = useSearchParams();
  const nav = useNavigate();
  const store = useFamilyStore();
  const family = store.families[fid];

  const sourcePid = search.get("pid") ?? store.currentViewerPersonId;
  const source = family?.people[sourcePid];

  const [kind, setKind] = useState<Kind>("spouse");

  if (!family || !source) {
    return (
      <BarePage>
        <AppHeader back backTo={`/family/${fid}/tree`} />
        <div style={{ padding: 40, textAlign: "center" }}>
          <Title size={20}>起点の人物が見つかりません</Title>
          <Hand size={12} color={C.sub} style={{ display: "block", marginTop: 8 }}>
            ツリーから人物を選んで「関係を追加」を押してください。
          </Hand>
          <div style={{ marginTop: 14 }}>
            <SketchBtn to={`/family/${fid}/tree`}>家系図へ</SketchBtn>
          </div>
        </div>
      </BarePage>
    );
  }

  return (
    <BarePage>
      <AppHeader
        familyName={family.name}
        back
        backTo={`/family/${fid}/tree`}
        showFamilyMenu
        familyId={fid}
      />
      <div style={{ height: "calc(100vh - 56px)", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(26,25,21,0.36)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            overflow: "hidden",
          }}
        >
          <Shell onClose={() => nav(-1)}>
            <SourceHeader source={source} />
            <div style={{ marginTop: 18 }}>
              <Hand size={12} color={C.sub} bold>
                どんな関係ですか？
              </Hand>
              <div
                style={{
                  marginTop: 10,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 10,
                }}
              >
                {KINDS.map((it) => (
                  <RelCard
                    key={it.k}
                    item={it}
                    active={kind === it.k}
                    onClick={() => setKind(it.k)}
                  />
                ))}
              </div>
            </div>
            <Brush width="100%" color={C.shuSoft} />

            {(kind === "spouse" || kind === "ex-spouse") && (
              <SpouseFlow
                familyId={fid}
                source={source}
                kind={kind}
                seededPartner={search.get("partner") ?? ""}
                onDone={() => nav(`/family/${fid}/tree`)}
              />
            )}
            {kind === "sibling" && (
              <SiblingFlow
                familyId={fid}
                source={source}
                onDone={() => nav(`/family/${fid}/tree`)}
              />
            )}
            {(kind === "child" || kind === "adopted") && (
              <ChildFlow
                familyId={fid}
                source={source}
                onDone={() => nav(`/family/${fid}/tree`)}
              />
            )}
            {kind === "parent" && (
              <ParentFlow
                familyId={fid}
                source={source}
                onDone={() => nav(`/family/${fid}/tree`)}
              />
            )}
          </Shell>
        </div>
      </div>
    </BarePage>
  );
}

// ────────────────────────────────────────────────────────────────
// Shell
// ────────────────────────────────────────────────────────────────
const Shell: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({
  children,
  onClose,
}) => (
  <div
    style={{
      width: 760,
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
        padding: "20px 24px",
        borderBottom: `1px solid ${C.line}`,
        flex: "none",
      }}
    >
      <div>
        <Hand size={11} color={C.shu} style={{ letterSpacing: "0.25em" }}>
          ─── ADD RELATION
        </Hand>
        <Title size={22}>関係を追加</Title>
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
        padding: "22px 24px",
        overflowY: "auto",
        flex: 1,
        minHeight: 0,
      }}
    >
      {children}
    </div>
  </div>
);

const SourceHeader: React.FC<{ source: Person }> = ({ source }) => (
  <div
    style={{
      padding: 14,
      background: "#FBF6E6",
      border: `1px solid ${C.line}`,
      borderRadius: 4,
    }}
  >
    <Hand size={11} color={C.shu} bold>
      起点の人物
    </Hand>
    <Row gap={14} style={{ marginTop: 8 }}>
      <Photo size={60} label="肖" />
      <Col gap={2}>
        <Title size={16}>{formatPerson(source)}</Title>
        <Hand size={11} color={C.sub}>
          {source.role ?? "—"}
        </Hand>
      </Col>
    </Row>
  </div>
);

// ────────────────────────────────────────────────────────────────
// Reusable bits
// ────────────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Hand size={12} color={C.shu} bold style={{ display: "block", marginBottom: 8 }}>
    {children}
  </Hand>
);

function randomId(prefix: string) {
  return prefix + "_" + Math.random().toString(36).slice(2, 8);
}

const GENDERS: { k: Gender; label: string }[] = [
  { k: "m", label: "男" },
  { k: "f", label: "女" },
  { k: "unknown", label: "不明" },
];

interface NewPersonDraft {
  id: string; // local draft id
  surname: string;
  given: string;
  gender: Gender;
}

function newDraft(): NewPersonDraft {
  return { id: randomId("draft"), surname: "", given: "", gender: "unknown" };
}

const NewPersonRow: React.FC<{
  value: NewPersonDraft;
  onChange: (v: NewPersonDraft) => void;
  onRemove?: () => void;
}> = ({ value, onChange, onRemove }) => (
  <Row gap={8} wrap align="center">
    <input
      value={value.surname}
      onChange={(e) => onChange({ ...value, surname: e.target.value })}
      placeholder="姓"
      style={inputStyle(110)}
    />
    <input
      value={value.given}
      onChange={(e) => onChange({ ...value, given: e.target.value })}
      placeholder="名"
      style={inputStyle(110)}
    />
    <Row gap={4} wrap>
      {GENDERS.map((g) => (
        <button
          key={g.k}
          type="button"
          onClick={() => onChange({ ...value, gender: g.k })}
          style={{
            padding: "5px 10px",
            borderRadius: 3,
            fontFamily: F.hand,
            fontSize: 11,
            background: value.gender === g.k ? C.paper : "transparent",
            color: value.gender === g.k ? C.shu : C.sub,
            border: `1px solid ${value.gender === g.k ? C.sumi : C.line}`,
            boxShadow:
              value.gender === g.k ? `1.5px 1.5px 0 ${C.sumi}` : undefined,
            cursor: "pointer",
          }}
        >
          {g.label}
        </button>
      ))}
    </Row>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        title="削除"
        style={{
          background: "none",
          border: "none",
          color: C.pale,
          cursor: "pointer",
          fontSize: 16,
          padding: "0 6px",
        }}
      >
        ×
      </button>
    )}
  </Row>
);

function inputStyle(width: number): React.CSSProperties {
  return {
    width,
    fontFamily: F.mincho,
    fontSize: 13,
    border: `1px solid ${C.sumi}`,
    borderRadius: 3,
    padding: "6px 10px",
    background: C.paper,
    boxShadow: `2px 2px 0 ${C.sumi}`,
    outline: "none",
    boxSizing: "border-box",
  };
}

// Person picker (single).
const PersonPicker: React.FC<{
  people: Person[];
  value: string;
  onChange: (id: string) => void;
  excludeIds?: string[];
  placeholder?: string;
}> = ({ people, value, onChange, excludeIds = [], placeholder }) => {
  const [q, setQ] = useState("");
  const filtered = people
    .filter((p) => !excludeIds.includes(p.id))
    .filter((p) =>
      q
        ? `${p.surname}${p.given}${p.kanaSurname ?? ""}${p.kanaGiven ?? ""}`.includes(
            q,
          )
        : true,
    );
  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder ?? "名前で検索…"}
        style={{ ...inputStyle(220), width: "100%" }}
      />
      <div
        style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 8,
          maxHeight: 220,
          overflowY: "auto",
        }}
      >
        {filtered.map((p) => {
          const active = value === p.id;
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onChange(p.id)}
              style={{
                padding: "7px 10px",
                background: active ? "#FCE9E5" : C.paper,
                border: `${active ? 2 : 1}px solid ${active ? C.shu : C.sumi}`,
                borderRadius: 4,
                boxShadow: active ? `2px 2px 0 ${C.shu}` : `2px 2px 0 ${C.sumi}`,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontFamily: F.mincho, fontSize: 13 }}>
                {formatPerson(p)}
              </div>
              <div style={{ fontFamily: F.hand, fontSize: 11, color: C.pale }}>
                {p.role ?? "—"}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <Hand size={12} color={C.pale}>
            該当する人物がいません。
          </Hand>
        )}
      </div>
    </div>
  );
};

// Person picker (multi).
const PersonPickerMulti: React.FC<{
  people: Person[];
  selected: string[];
  onToggle: (id: string) => void;
  excludeIds?: string[];
}> = ({ people, selected, onToggle, excludeIds = [] }) => {
  const [q, setQ] = useState("");
  const filtered = people
    .filter((p) => !excludeIds.includes(p.id))
    .filter((p) =>
      q ? `${p.surname}${p.given}`.includes(q) : true,
    );
  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="名前で検索…"
        style={{ ...inputStyle(220), width: "100%" }}
      />
      <div
        style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 8,
          maxHeight: 220,
          overflowY: "auto",
        }}
      >
        {filtered.map((p) => {
          const active = selected.includes(p.id);
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onToggle(p.id)}
              style={{
                padding: "7px 10px",
                background: active ? "#FCE9E5" : C.paper,
                border: `${active ? 2 : 1}px solid ${active ? C.shu : C.sumi}`,
                borderRadius: 4,
                boxShadow: active
                  ? `2px 2px 0 ${C.shu}`
                  : `2px 2px 0 ${C.sumi}`,
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  border: `1.5px solid ${active ? C.shu : C.line}`,
                  background: active ? C.shu : "transparent",
                  color: C.paper,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 10,
                  flex: "none",
                }}
              >
                {active ? "✓" : ""}
              </span>
              <div>
                <div style={{ fontFamily: F.mincho, fontSize: 13 }}>
                  {formatPerson(p)}
                </div>
                <div
                  style={{ fontFamily: F.hand, fontSize: 11, color: C.pale }}
                >
                  {p.role ?? "—"}
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <Hand size={12} color={C.pale}>
            該当する人物がいません。
          </Hand>
        )}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// Spouse flow (existing simpler form)
// ────────────────────────────────────────────────────────────────
const SpouseFlow: React.FC<{
  familyId: string;
  source: Person;
  kind: "spouse" | "ex-spouse";
  seededPartner: string;
  onDone: () => void;
}> = ({ familyId, source, kind, seededPartner, onDone }) => {
  const store = useFamilyStore();
  const family = store.families[familyId]!;
  const [picker, setPicker] = useState<"existing" | "new">("existing");
  const [pickedId, setPickedId] = useState(seededPartner);
  const [draft, setDraft] = useState<NewPersonDraft>(newDraft());

  const commit = () => {
    let partner: Person | undefined;
    if (picker === "existing") {
      partner = family.people[pickedId];
      if (!partner) {
        store.showToast("err", "相手を選んでください");
        return;
      }
    } else {
      if (!draft.surname.trim() && !draft.given.trim()) {
        store.showToast("err", "相手の姓か名を入れてください");
        return;
      }
      partner = {
        id: randomId("p"),
        surname: draft.surname.trim(),
        given: draft.given.trim(),
        gender: draft.gender,
      };
      store.addPerson(familyId, partner);
    }
    const unionId = randomId("u");
    store.addUnion(familyId, {
      id: unionId,
      partnerA: source.id,
      partnerB: partner.id,
    });
    store.showToast(
      "ok",
      `${formatPerson(source)} と ${formatPerson(partner)} を${kind === "spouse" ? "配偶者" : "元配偶者"}として登録`,
    );
    onDone();
  };

  return (
    <>
      <div style={{ marginTop: 12 }}>
        <SectionLabel>相手（{kind === "spouse" ? "配偶者" : "元配偶者"}）</SectionLabel>
        <PickerToggle mode={picker} onChange={setPicker} />
        {picker === "existing" ? (
          <PersonPicker
            people={Object.values(family.people)}
            value={pickedId}
            onChange={setPickedId}
            excludeIds={[source.id]}
          />
        ) : (
          <NewPersonRow value={draft} onChange={setDraft} />
        )}
      </div>
      <Footer onConfirm={commit} confirmLabel="関係を追加" />
    </>
  );
};

// ────────────────────────────────────────────────────────────────
// Sibling flow — share source's parents
// ────────────────────────────────────────────────────────────────
const SiblingFlow: React.FC<{
  familyId: string;
  source: Person;
  onDone: () => void;
}> = ({ familyId, source, onDone }) => {
  const store = useFamilyStore();
  const family = store.families[familyId]!;
  const [picker, setPicker] = useState<"existing" | "new">("new");
  const [pickedId, setPickedId] = useState("");
  const [draft, setDraft] = useState<NewPersonDraft>(newDraft());

  const parentLinks = family.links.filter((l) => l.childId === source.id);

  const commit = () => {
    if (parentLinks.length === 0) {
      store.showToast(
        "warn",
        `${formatPerson(source)} の親が登録されていないため、兄弟関係を作れません`,
      );
      return;
    }
    let partner: Person | undefined;
    if (picker === "existing") {
      partner = family.people[pickedId];
      if (!partner) {
        store.showToast("err", "相手を選んでください");
        return;
      }
    } else {
      if (!draft.surname.trim() && !draft.given.trim()) {
        store.showToast("err", "姓か名を入れてください");
        return;
      }
      partner = {
        id: randomId("p"),
        surname: draft.surname.trim(),
        given: draft.given.trim(),
        gender: draft.gender,
      };
      store.addPerson(familyId, partner);
    }
    parentLinks.forEach((l) =>
      store.addParentChildLink(familyId, { ...l, childId: partner!.id }),
    );
    store.showToast(
      "ok",
      `${formatPerson(partner)} を ${formatPerson(source)} の兄弟姉妹として登録`,
    );
    onDone();
  };

  return (
    <>
      <div style={{ marginTop: 12 }}>
        <SectionLabel>兄弟姉妹となる人物</SectionLabel>
        <Hand size={11} color={C.pale} style={{ display: "block", marginBottom: 8 }}>
          {parentLinks.length === 0
            ? "※ 起点の親が未登録のため、先に「親」を登録してください。"
            : "起点と同じ親を共有する人物として扱います。"}
        </Hand>
        <PickerToggle mode={picker} onChange={setPicker} />
        {picker === "existing" ? (
          <PersonPicker
            people={Object.values(family.people)}
            value={pickedId}
            onChange={setPickedId}
            excludeIds={[source.id]}
          />
        ) : (
          <NewPersonRow value={draft} onChange={setDraft} />
        )}
      </div>
      <Footer onConfirm={commit} confirmLabel="関係を追加" />
    </>
  );
};

// ────────────────────────────────────────────────────────────────
// Child flow — pick partner, then multi children
// ────────────────────────────────────────────────────────────────
const ChildFlow: React.FC<{
  familyId: string;
  source: Person;
  onDone: () => void;
}> = ({ familyId, source, onDone }) => {
  const store = useFamilyStore();
  const family = store.families[familyId]!;
  const existingUnions = family.unions.filter(
    (u) => u.partnerA === source.id || u.partnerB === source.id,
  );

  const [unionMode, setUnionMode] = useState<
    "existing-union" | "existing-person" | "new-person" | "alone"
  >(existingUnions.length > 0 ? "existing-union" : "existing-person");
  const [selectedUnionId, setSelectedUnionId] = useState(
    existingUnions[0]?.id ?? "",
  );
  const [partnerId, setPartnerId] = useState("");
  const [partnerDraft, setPartnerDraft] = useState<NewPersonDraft>(newDraft());

  const [existingChildren, setExistingChildren] = useState<string[]>([]);
  const [newChildren, setNewChildren] = useState<NewPersonDraft[]>([]);

  const toggleExistingChild = (id: string) => {
    setExistingChildren((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };
  const updateNewChild = (idx: number, v: NewPersonDraft) => {
    setNewChildren((prev) => prev.map((c, i) => (i === idx ? v : c)));
  };
  const removeNewChild = (idx: number) =>
    setNewChildren((prev) => prev.filter((_, i) => i !== idx));

  const commit = () => {
    // Resolve / create the union (or single parent).
    let unionId: string | undefined;
    let partner: Person | undefined;

    if (unionMode === "existing-union") {
      const u = existingUnions.find((x) => x.id === selectedUnionId);
      if (!u) {
        store.showToast("err", "既存の関係を選んでください");
        return;
      }
      unionId = u.id;
      const pid = u.partnerA === source.id ? u.partnerB : u.partnerA;
      partner = family.people[pid];
    } else if (unionMode === "existing-person") {
      partner = family.people[partnerId];
      if (!partner) {
        store.showToast("err", "配偶者を選んでください");
        return;
      }
      // Re-use existing union between these two if any, else create new.
      const existing = family.unions.find(
        (u) =>
          (u.partnerA === source.id && u.partnerB === partner!.id) ||
          (u.partnerB === source.id && u.partnerA === partner!.id),
      );
      if (existing) {
        unionId = existing.id;
      } else {
        unionId = randomId("u");
        store.addUnion(familyId, {
          id: unionId,
          partnerA: source.id,
          partnerB: partner.id,
        });
      }
    } else if (unionMode === "new-person") {
      if (!partnerDraft.surname.trim() && !partnerDraft.given.trim()) {
        store.showToast("err", "配偶者の姓か名を入れてください");
        return;
      }
      partner = {
        id: randomId("p"),
        surname: partnerDraft.surname.trim(),
        given: partnerDraft.given.trim(),
        gender: partnerDraft.gender,
      };
      store.addPerson(familyId, partner);
      unionId = randomId("u");
      store.addUnion(familyId, {
        id: unionId,
        partnerA: source.id,
        partnerB: partner.id,
      });
    }

    const childIds: string[] = [...existingChildren];
    for (const d of newChildren) {
      if (!d.surname.trim() && !d.given.trim()) continue;
      const np: Person = {
        id: randomId("p"),
        surname: d.surname.trim(),
        given: d.given.trim(),
        gender: d.gender,
      };
      store.addPerson(familyId, np);
      childIds.push(np.id);
    }

    if (childIds.length === 0) {
      store.showToast("err", "子を 1 人以上選んでください");
      return;
    }

    for (const cid of childIds) {
      if (unionId) {
        store.addParentChildLink(familyId, { parentUnion: unionId, childId: cid });
      } else {
        store.addParentChildLink(familyId, { parentId: source.id, childId: cid });
      }
    }
    store.showToast("ok", `${childIds.length} 人を子として登録`);
    onDone();
  };

  const allPeople = Object.values(family.people);
  const excludeForChildren = [
    source.id,
    ...(partner() ? [partner()!.id] : []),
  ];
  function partner(): Person | undefined {
    if (unionMode === "existing-union") {
      const u = existingUnions.find((x) => x.id === selectedUnionId);
      if (!u) return undefined;
      const pid = u.partnerA === source.id ? u.partnerB : u.partnerA;
      return family.people[pid];
    }
    if (unionMode === "existing-person") return family.people[partnerId];
    return undefined;
  }

  return (
    <>
      <div style={{ marginTop: 12 }}>
        <SectionLabel>① 配偶者（もう一方の親）</SectionLabel>
        <Row gap={8} wrap style={{ marginBottom: 10 }}>
          {(
            [
              { k: "existing-union" as const, t: "既にある夫婦関係から" },
              { k: "existing-person" as const, t: "既存の人物から" },
              { k: "new-person" as const, t: "新しい人物として追加" },
              { k: "alone" as const, t: "配偶者なし（一人親）" },
            ] as const
          )
            .filter((o) => o.k !== "existing-union" || existingUnions.length > 0)
            .map((o) => (
              <button
                type="button"
                key={o.k}
                onClick={() => setUnionMode(o.k)}
                style={modeChipStyle(unionMode === o.k)}
              >
                {o.t}
              </button>
            ))}
        </Row>

        {unionMode === "existing-union" && (
          <Col gap={6}>
            {existingUnions.map((u) => {
              const pid = u.partnerA === source.id ? u.partnerB : u.partnerA;
              const p = family.people[pid];
              const active = selectedUnionId === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUnionId(u.id)}
                  style={{
                    padding: "8px 12px",
                    border: `${active ? 2 : 1}px solid ${
                      active ? C.shu : C.line
                    }`,
                    borderRadius: 3,
                    background: active ? "#FCE9E5" : C.paper,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: F.mincho,
                    fontSize: 13,
                  }}
                >
                  配偶者：{formatPerson(p)}
                </button>
              );
            })}
          </Col>
        )}
        {unionMode === "existing-person" && (
          <PersonPicker
            people={allPeople}
            value={partnerId}
            onChange={setPartnerId}
            excludeIds={[source.id]}
          />
        )}
        {unionMode === "new-person" && (
          <NewPersonRow value={partnerDraft} onChange={setPartnerDraft} />
        )}
        {unionMode === "alone" && (
          <Hand size={11} color={C.pale}>
            配偶者を設定せず、{formatPerson(source)} 単独の子として登録します。
          </Hand>
        )}
      </div>

      <Brush width="100%" color={C.shuSoft} />

      <div style={{ marginTop: 12 }}>
        <SectionLabel>
          ② 子（複数選択可 — 既存から {existingChildren.length} 人 ・ 新規{" "}
          {newChildren.length} 人）
        </SectionLabel>
        <Col gap={14}>
          <div>
            <Hand size={11} color={C.sub} bold>
              既存から選ぶ
            </Hand>
            <div style={{ marginTop: 6 }}>
              <PersonPickerMulti
                people={allPeople}
                selected={existingChildren}
                onToggle={toggleExistingChild}
                excludeIds={excludeForChildren}
              />
            </div>
          </div>
          <div>
            <Hand size={11} color={C.sub} bold>
              新しく追加する
            </Hand>
            <Col gap={8} style={{ marginTop: 6 }}>
              {newChildren.map((d, i) => (
                <NewPersonRow
                  key={d.id}
                  value={d}
                  onChange={(v) => updateNewChild(i, v)}
                  onRemove={() => removeNewChild(i)}
                />
              ))}
              <div>
                <SketchBtn
                  size="sm"
                  icon="＋"
                  onClick={() => setNewChildren((prev) => [...prev, newDraft()])}
                >
                  子をもう 1 人追加
                </SketchBtn>
              </div>
            </Col>
          </div>
          <Chip tone="mute">
            登録後、子は夫婦（または起点）の真下に中央揃えで配置されます
          </Chip>
        </Col>
      </div>

      <Footer onConfirm={commit} confirmLabel="関係を追加" />
    </>
  );
};

// ────────────────────────────────────────────────────────────────
// Parent flow — pick 2 parents, union them, link to source
// ────────────────────────────────────────────────────────────────
const ParentFlow: React.FC<{
  familyId: string;
  source: Person;
  onDone: () => void;
}> = ({ familyId, source, onDone }) => {
  const store = useFamilyStore();
  const family = store.families[familyId]!;
  const allPeople = Object.values(family.people);

  const [parent1Mode, setParent1Mode] = useState<"existing" | "new">("new");
  const [parent1Id, setParent1Id] = useState("");
  const [parent1Draft, setParent1Draft] = useState<NewPersonDraft>(newDraft());

  const [parent2Mode, setParent2Mode] = useState<"existing" | "new">("new");
  const [parent2Id, setParent2Id] = useState("");
  const [parent2Draft, setParent2Draft] = useState<NewPersonDraft>({
    ...newDraft(),
    gender: "f",
  });
  React.useEffect(() => {
    // Default parent 1 to male for convenience.
    setParent1Draft((d) => ({ ...d, gender: d.gender === "unknown" ? "m" : d.gender }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveParent = (
    mode: "existing" | "new",
    id: string,
    draft: NewPersonDraft,
    label: string,
  ): Person | undefined => {
    if (mode === "existing") {
      const p = family.people[id];
      if (!p) {
        store.showToast("err", `${label}を選んでください`);
        return;
      }
      return p;
    }
    if (!draft.surname.trim() && !draft.given.trim()) {
      store.showToast("err", `${label}の姓か名を入れてください`);
      return;
    }
    const p: Person = {
      id: randomId("p"),
      surname: draft.surname.trim(),
      given: draft.given.trim(),
      gender: draft.gender,
    };
    store.addPerson(familyId, p);
    return p;
  };

  const commit = () => {
    // Don't let the source already have parents linked.
    const existingParentLinks = family.links.filter(
      (l) => l.childId === source.id,
    );
    if (existingParentLinks.length > 0) {
      store.showToast(
        "warn",
        `${formatPerson(source)} には既に親リンクがあります。先に外してください。`,
      );
      return;
    }
    const p1 = resolveParent(parent1Mode, parent1Id, parent1Draft, "親 1");
    if (!p1) return;
    const p2 = resolveParent(parent2Mode, parent2Id, parent2Draft, "親 2");
    if (!p2) return;
    if (p1.id === p2.id) {
      store.showToast("err", "親 1 と親 2 には別の人を指定してください");
      return;
    }
    // Create or re-use union between them.
    const existingUnion = family.unions.find(
      (u) =>
        (u.partnerA === p1.id && u.partnerB === p2.id) ||
        (u.partnerB === p1.id && u.partnerA === p2.id),
    );
    const unionId = existingUnion?.id ?? randomId("u");
    if (!existingUnion) {
      store.addUnion(familyId, {
        id: unionId,
        partnerA: p1.id,
        partnerB: p2.id,
      });
    }
    store.addParentChildLink(familyId, { parentUnion: unionId, childId: source.id });
    store.showToast(
      "ok",
      `${formatPerson(p1)} と ${formatPerson(p2)} を ${formatPerson(source)} の親として登録`,
    );
    onDone();
  };

  return (
    <>
      <div style={{ marginTop: 12 }}>
        <SectionLabel>親 1</SectionLabel>
        <PickerToggle mode={parent1Mode} onChange={setParent1Mode} />
        {parent1Mode === "existing" ? (
          <PersonPicker
            people={allPeople}
            value={parent1Id}
            onChange={setParent1Id}
            excludeIds={[source.id, parent2Id]}
          />
        ) : (
          <NewPersonRow value={parent1Draft} onChange={setParent1Draft} />
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <SectionLabel>親 2</SectionLabel>
        <PickerToggle mode={parent2Mode} onChange={setParent2Mode} />
        {parent2Mode === "existing" ? (
          <PersonPicker
            people={allPeople}
            value={parent2Id}
            onChange={setParent2Id}
            excludeIds={[source.id, parent1Id]}
          />
        ) : (
          <NewPersonRow value={parent2Draft} onChange={setParent2Draft} />
        )}
      </div>

      <Chip tone="mute">
        親 2 人の中央から線を下ろし、{formatPerson(source)} の上に接続します
      </Chip>

      <Footer onConfirm={commit} confirmLabel="親を登録" />
    </>
  );
};

// ────────────────────────────────────────────────────────────────
// Small bits
// ────────────────────────────────────────────────────────────────
function modeChipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    border: `1px solid ${active ? C.sumi : C.line}`,
    borderRadius: 3,
    background: active ? C.paper : "transparent",
    boxShadow: active ? `1.5px 1.5px 0 ${C.sumi}` : undefined,
    fontFamily: F.hand,
    fontSize: 12,
    color: active ? C.sumi : C.sub,
    cursor: "pointer",
  };
}

const PickerToggle: React.FC<{
  mode: "existing" | "new";
  onChange: (m: "existing" | "new") => void;
}> = ({ mode, onChange }) => (
  <Row gap={8} wrap style={{ marginBottom: 10 }}>
    <button
      type="button"
      onClick={() => onChange("existing")}
      style={modeChipStyle(mode === "existing")}
    >
      既存から選ぶ
    </button>
    <button
      type="button"
      onClick={() => onChange("new")}
      style={modeChipStyle(mode === "new")}
    >
      新しい人物として追加
    </button>
  </Row>
);

const Footer: React.FC<{ onConfirm: () => void; confirmLabel: string }> = ({
  onConfirm,
  confirmLabel,
}) => {
  const nav = useNavigate();
  return (
    <Row
      justify="flex-end"
      gap={10}
      style={{
        marginTop: 20,
        paddingTop: 14,
        borderTop: `1px solid ${C.line}`,
      }}
    >
      <SketchBtn onClick={() => nav(-1)}>キャンセル</SketchBtn>
      <SketchBtn primary icon="✓" onClick={onConfirm}>
        {confirmLabel}
      </SketchBtn>
    </Row>
  );
};

// Silence lint for unused chip — Field is exported but only sometimes used.
void Field;
