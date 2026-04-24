import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarePage,
  Hanko,
  Hand,
  Title,
  SketchBtn,
  Row,
  Col,
  Field,
  Brush,
  Grid,
  C,
  F,
} from "../components/ui";
import { useFamilyStore, Family, Person } from "../stores/familyStore";
import {
  FuzzyDateInput,
  fuzzyToParts,
  partsToFuzzy,
} from "../components/FuzzyDateInput";
import { useIsMobile } from "../hooks/useMediaQuery";

type Gender = "m" | "f" | "other" | "unknown";
const GENDERS: { k: Gender; label: string }[] = [
  { k: "m", label: "男性" },
  { k: "f", label: "女性" },
  { k: "other", label: "その他" },
  { k: "unknown", label: "不明" },
];

export default function NewFamilyModal() {
  const nav = useNavigate();
  const addFamily = useFamilyStore((s) => s.addFamily);
  const showToast = useFamilyStore((s) => s.showToast);
  const isMobile = useIsMobile();

  const [familyName, setFamilyName] = useState("");
  const [surname, setSurname] = useState("");
  const [given, setGiven] = useState("");
  const [relation, setRelation] = useState("");
  const [gender, setGender] = useState<Gender>("m");
  const [birth, setBirth] = useState(fuzzyToParts(undefined));
  const [birthPlace, setBirthPlace] = useState("");

  const slug = (v: string) =>
    v
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 24) || `f_${Date.now()}`;

  const onSubmit = () => {
    if (!familyName.trim()) {
      showToast("err", "家系の名前を入れてください");
      return;
    }
    const fid = slug(familyName) + "_" + Math.random().toString(36).slice(2, 6);
    const pid = "p_root_" + Math.random().toString(36).slice(2, 6);
    const person: Person = {
      id: pid,
      surname: surname.trim() || "—",
      given: given.trim() || "—",
      gender,
      birth: partsToFuzzy(birth),
      birthPlace: birthPlace || undefined,
      role: relation || undefined,
    };
    const fam: Family = {
      id: fid,
      name: familyName,
      rootPersonId: pid,
      generations: 1,
      lastUpdated: "たった今",
      people: { [pid]: person },
      unions: [],
      links: [],
      memories: {},
    };
    addFamily(fam);
    showToast("ok", `家系「${familyName}」を作成しました`);
    nav(`/family/${fid}/tree`);
  };

  return (
    <BarePage>
      <div
        style={{
          height: "100vh",
          background: C.tatami,
          position: "relative",
          // モバイルでは grid-auto 配置だとセル幅が子の width に合ってしまい
          // width: 640 がそのまま適用されて溢れる。flex col で子を引き延ばす。
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: isMobile ? "stretch" : "center",
          padding: isMobile ? 0 : 16,
        }}
      >
        <Grid opacity={0.08} />
        <div
          style={{
            width: isMobile ? "100%" : 640,
            maxWidth: "100%",
            flex: isMobile ? 1 : "none",
            maxHeight: isMobile ? "100vh" : "calc(100vh - 32px)",
            background: C.paper,
            border: isMobile ? "none" : `2px solid ${C.sumi}`,
            borderRadius: isMobile ? 0 : 6,
            boxShadow: isMobile ? "none" : "0 40px 80px -24px rgba(0,0,0,0.45)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Row
            justify="space-between"
            style={{
              padding: isMobile ? "18px 18px 0 18px" : "24px 32px 0 32px",
              flex: "none",
            }}
          >
            <div>
              <Hand size={11} color={C.shu} style={{ letterSpacing: "0.25em" }}>
                ─── NEW FAMILY
              </Hand>
              <Title size={24}>新しい家系を始める</Title>
              <Hand size={12} color={C.sub}>
                ルートとなる人物（あなた）の基本情報から始めます。
              </Hand>
            </div>
            <Hanko size={48} />
          </Row>
          <div style={{ padding: isMobile ? "0 18px" : "0 32px" }}>
            <Brush width="100%" color={C.shuSoft} />
          </div>

          <div
            style={{
              padding: isMobile ? "16px 18px" : "18px 32px",
              overflowY: "auto",
              flex: 1,
              minHeight: 0,
            }}
          >
            <Col gap={16}>
              <Field
                label="家系の名前"
                value={familyName}
                onChange={setFamilyName}
                required
                placeholder="山田家、鈴木家・母方"
              />

              <div
                style={{
                  border: `1px dashed ${C.pale}`,
                  background: "#FBF6E6",
                  padding: 18,
                  borderRadius: 4,
                }}
              >
                <Hand size={12} color={C.shu} bold>
                  ルート人物（あなた）
                </Hand>
                <Hand size={11} color={C.sub} style={{ display: "block", marginBottom: 12 }}>
                  起点となるひとり。あとから編集できます。
                </Hand>

                <Row gap={12} wrap align="flex-start">
                  <Field
                    label="姓"
                    value={surname}
                    onChange={setSurname}
                    required
                    placeholder="山田"
                    width={140}
                  />
                  <Field
                    label="名"
                    value={given}
                    onChange={setGiven}
                    required
                    placeholder="翔"
                    width={140}
                  />
                  <Field
                    label="続柄"
                    value={relation}
                    onChange={setRelation}
                    placeholder="私"
                    width={140}
                  />
                </Row>
                <Row gap={12} wrap align="flex-start" style={{ marginTop: 12 }}>
                  <div style={{ width: 240 }}>
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
                            boxShadow:
                              gender === g.k ? `1.5px 1.5px 0 ${C.sumi}` : undefined,
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
                    value={birthPlace}
                    onChange={setBirthPlace}
                    placeholder="東京都"
                    width={200}
                  />
                </Row>
                <Row gap={12} wrap align="flex-start" style={{ marginTop: 12 }}>
                  <div style={{ minWidth: 360, flex: 1 }}>
                    <FuzzyDateInput
                      label="生年月日"
                      value={birth}
                      onChange={setBirth}
                    />
                  </div>
                </Row>
              </div>

            </Col>
          </div>

          <Row
            justify="flex-end"
            gap={10}
            wrap
            style={{
              padding: isMobile ? "12px 16px" : "14px 32px",
              borderTop: `1px solid ${C.line}`,
              background: "#FBF6E6",
              flex: "none",
            }}
          >
            <SketchBtn to="/home">キャンセル</SketchBtn>
            <SketchBtn primary icon="✓" onClick={onSubmit}>
              家系を作成
            </SketchBtn>
          </Row>
        </div>
      </div>
    </BarePage>
  );
}
