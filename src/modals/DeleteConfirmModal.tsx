import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  BarePage,
  DialogCard,
  Hand,
  Title,
  SketchBtn,
  Row,
  Col,
  Grid,
  C,
  F,
} from "../components/ui";
import { useFamilyStore, formatPerson } from "../stores/familyStore";
import { writeFtree2 } from "../features/importExport/writeFtree2";
import { clearPhotos } from "../storage/idb";

type Kind = "person" | "memory" | "family" | "all";

const SealMark: React.FC<{ mark: string }> = ({ mark }) => (
  <div
    style={{
      width: 48,
      height: 48,
      borderRadius: "50%",
      background: "#FCE9E5",
      border: `2px solid ${C.shu}`,
      color: C.shu,
      display: "grid",
      placeItems: "center",
      fontFamily: F.mincho,
      fontSize: 22,
      fontWeight: 700,
      flex: "none",
    }}
  >
    {mark}
  </div>
);

const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Row gap={8} align="flex-start">
    <span style={{ color: C.shu, marginTop: 2 }}>・</span>
    <Hand size={12} color={C.sumi}>
      {children}
    </Hand>
  </Row>
);

export default function DeleteConfirmModal() {
  const loc = useLocation();
  const nav = useNavigate();
  const params = useParams();
  const store = useFamilyStore();

  const kind: Kind = loc.pathname.startsWith("/settings/delete-all")
    ? "all"
    : loc.pathname.includes("/memory/")
      ? "memory"
      : loc.pathname.includes("/person/")
        ? "person"
        : "family";

  const fid = params.fid ?? store.activeFamilyId;
  const family = store.families[fid];

  const close = () => nav(-1);

  if (kind === "person") {
    const pid = params.pid ?? "";
    const person = family?.people[pid];
    return (
      <Shell>
        <DialogCard title="この人物を削除しますか？" danger>
          <Row gap={14} align="flex-start">
            <SealMark mark="人" />
            <Col gap={8}>
              <Hand size={12} color={C.sumi}>
                <b>{formatPerson(person)}</b> を家系から削除します。
              </Hand>
              <Col gap={3}>
                <ListItem>
                  関連する関係（配偶者・子）はリンクのみ切れます
                </ListItem>
                <ListItem>
                  この人物が書いた思い出は削除されません
                </ListItem>
                <ListItem>
                  写真は再利用がなければ自動的に解放されます
                </ListItem>
              </Col>
            </Col>
          </Row>
          <Row justify="flex-end" gap={10} style={{ marginTop: 16 }}>
            <SketchBtn onClick={close}>キャンセル</SketchBtn>
            <SketchBtn
              primary
              danger
              icon="✕"
              onClick={() => {
                store.removePerson(fid, pid);
                store.showToast("ok", "人物を削除しました");
                nav(`/family/${fid}/tree`);
              }}
            >
              削除
            </SketchBtn>
          </Row>
        </DialogCard>
      </Shell>
    );
  }

  if (kind === "memory") {
    const mid = params.mid ?? "";
    const memory = family?.memories[mid];
    return (
      <Shell>
        <DialogCard title="この思い出を削除しますか？" danger>
          <Row gap={14} align="flex-start">
            <SealMark mark="帖" />
            <Col gap={8}>
              <Hand size={12} color={C.sumi}>
                「<b>{memory?.title ?? "—"}</b>」を削除します。
              </Hand>
              <Col gap={3}>
                <ListItem>本文・写真は復元できません</ListItem>
                <ListItem>書き出しファイルがあればそこから復元できます</ListItem>
              </Col>
            </Col>
          </Row>
          <Row justify="flex-end" gap={10} style={{ marginTop: 16 }}>
            <SketchBtn onClick={close}>キャンセル</SketchBtn>
            <SketchBtn
              primary
              danger
              icon="✕"
              onClick={() => {
                store.removeMemory(fid, mid);
                store.showToast("ok", "思い出を削除しました");
                nav(`/family/${fid}/memories`);
              }}
            >
              削除
            </SketchBtn>
          </Row>
        </DialogCard>
      </Shell>
    );
  }

  if (kind === "family") {
    return <FamilyDeleteDialog fid={fid} onClose={close} />;
  }

  // kind === "all"
  return <AllDeleteDialog onClose={close} />;
}

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BarePage>
    <div
      style={{
        height: "var(--app-h)",
        background: C.tatami,
        position: "relative",
        // grid+auto 列だと子の width がそのままセル幅になり、モバイルで溢れる。
        // flex 列で中央寄せしつつ子は container 幅に収まるように。
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        overflow: "auto",
      }}
    >
      <Grid opacity={0.08} />
      {children}
    </div>
  </BarePage>
);

const FamilyDeleteDialog: React.FC<{ fid: string; onClose: () => void }> = ({
  fid,
  onClose,
}) => {
  const nav = useNavigate();
  const store = useFamilyStore();
  const fam = store.families[fid];
  const [typed, setTyped] = useState("");
  if (!fam) {
    return (
      <Shell>
        <DialogCard title="家系が見つかりません" danger>
          <Hand>対象の家系はすでに削除されています。</Hand>
          <Row justify="flex-end" style={{ marginTop: 16 }}>
            <SketchBtn primary to="/home">
              ホームに戻る
            </SketchBtn>
          </Row>
        </DialogCard>
      </Shell>
    );
  }
  const nameMatches = typed.trim() === fam.name;
  return (
    <Shell>
      <DialogCard title="家系を削除（慎重に）" danger width={460}>
        <Row gap={14} align="flex-start">
          <SealMark mark="家" />
          <Col gap={8} style={{ flex: 1 }}>
            <Hand size={12} color={C.sumi}>
              <b>{fam.name}</b> をこの端末から削除します。
              {Object.keys(fam.people).length} 人物・
              {Object.keys(fam.memories).length} 思い出が失われます。
            </Hand>
            <Hand size={11} color={C.shu}>
              ※ 事前に書き出しておくことを強く推奨します。
            </Hand>
            <div style={{ marginTop: 6 }}>
              <Hand size={11} color={C.sub} bold>
                確認のため、家系名「{fam.name}」を入力してください
              </Hand>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={fam.name}
                style={{
                  marginTop: 6,
                  width: "100%",
                  background: C.paper,
                  border: `1.5px solid ${C.shu}`,
                  borderRadius: 3,
                  padding: "8px 12px",
                  fontFamily: F.mincho,
                  fontSize: 14,
                  color: C.sumi,
                  boxShadow: `2px 2px 0 ${C.shu}`,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </Col>
        </Row>
        <Row justify="space-between" style={{ marginTop: 16 }} wrap gap={10}>
          <SketchBtn
            size="sm"
            icon="↓"
            onClick={async () => {
              try {
                await writeFtree2(fid);
              } catch {
                store.showToast("err", "書き出しに失敗しました");
              }
            }}
          >
            先に書き出す
          </SketchBtn>
          <Row gap={10}>
            <SketchBtn onClick={onClose}>キャンセル</SketchBtn>
            <SketchBtn
              primary
              danger
              icon="⚠"
              disabled={!nameMatches}
              onClick={() => {
                store.deleteFamily(fid);
                store.showToast("ok", "家系を削除しました");
                nav("/home");
              }}
            >
              削除を実行
            </SketchBtn>
          </Row>
        </Row>
      </DialogCard>
    </Shell>
  );
};

const AllDeleteDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const nav = useNavigate();
  const store = useFamilyStore();
  const [checked, setChecked] = useState(false);
  return (
    <Shell>
      <DialogCard title="全データを初期化" danger width={460}>
        <Row gap={14} align="flex-start">
          <SealMark mark="全" />
          <Col gap={8} style={{ flex: 1 }}>
            <Hand size={12} color={C.sumi}>
              この端末のアプリデータをすべて削除します。家系・人物・
              思い出・写真・設定 が失われます。
            </Hand>
            <Hand size={11} color={C.shu}>
              復元には <b>書き出しファイル（.ftree2）</b> が必要です。
            </Hand>
            <label
              style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <Hand size={12}>
                上記を理解しました。復元ファイルを保持しています。
              </Hand>
            </label>
          </Col>
        </Row>
        <Row justify="flex-end" gap={10} style={{ marginTop: 16 }}>
          <SketchBtn onClick={onClose}>キャンセル</SketchBtn>
          <SketchBtn
            primary
            danger
            icon="⚠"
            disabled={!checked}
            onClick={async () => {
              store.wipe();
              await clearPhotos().catch(() => undefined);
              store.showToast("ok", "全データを初期化しました");
              nav("/home");
            }}
          >
            初期化する
          </SketchBtn>
        </Row>
      </DialogCard>
    </Shell>
  );
};
