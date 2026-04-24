import React, { useEffect, useState } from "react";
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
  F,
} from "../components/ui";
import { useFamilyStore } from "../stores/familyStore";
import { useNavigate } from "react-router-dom";
import { writeFtree2 } from "../features/importExport/writeFtree2";
import {
  requestPersistence,
  refreshStorageEstimate,
} from "../pwa/persist";
import {
  isInstallAvailable,
  onInstallAvailableChanged,
  triggerInstall,
  isStandalone,
  isIOS,
} from "../pwa/install";

const Section: React.FC<{ no: string; title: string; children: React.ReactNode }> = ({
  no,
  title,
  children,
}) => (
  <div style={{ marginBottom: 28 }}>
    <Row gap={10} align="baseline">
      <Title size={14} color={C.shu}>
        {no}
      </Title>
      <Title size={18}>{title}</Title>
    </Row>
    <div
      style={{
        marginTop: 10,
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 4,
        padding: "14px 18px",
      }}
    >
      {children}
    </div>
  </div>
);

const Item: React.FC<{
  label: string;
  hint?: string;
  right?: React.ReactNode;
}> = ({ label, hint, right }) => (
  <Row
    justify="space-between"
    align="flex-start"
    wrap
    style={{ padding: "10px 0", borderTop: `1px dashed ${C.line}`, gap: 12 }}
  >
    <Col gap={2} style={{ flex: "1 1 200px", minWidth: 0 }}>
      <Hand size={13} color={C.sumi} bold>
        {label}
      </Hand>
      {hint && (
        <Hand size={11} color={C.pale}>
          {hint}
        </Hand>
      )}
    </Col>
    <div style={{ flex: "0 1 auto", maxWidth: "100%" }}>{right}</div>
  </Row>
);

const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void }> = ({
  on,
  onChange,
}) => (
  <button
    type="button"
    onClick={() => onChange(!on)}
    style={{
      width: 44,
      height: 24,
      borderRadius: 999,
      background: on ? C.shu : C.line,
      position: "relative",
      border: `1px solid ${C.sumi}`,
      cursor: "pointer",
      padding: 0,
      transition: "background 160ms",
    }}
    title={on ? "有効" : "無効"}
  >
    <span
      style={{
        position: "absolute",
        top: 1,
        left: on ? 21 : 1,
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: C.paper,
        border: `1px solid ${C.sumi}`,
        transition: "left 180ms",
      }}
    />
  </button>
);

export default function SettingsPage() {
  const nav = useNavigate();
  const store = useFamilyStore();
  const activeFamily = store.getFamily();
  const estimate = store.storageEstimate ?? { used: 0, total: 500 };
  const pct = Math.min(
    100,
    Math.round((estimate.used / Math.max(1, estimate.total)) * 100),
  );
  const [viewerId, setViewerId] = useState(store.currentViewerPersonId);
  // 書き出し対象の家系。既定は現在アクティブな家系。
  const [exportFamilyId, setExportFamilyId] = useState(
    activeFamily?.id ?? Object.keys(store.families)[0] ?? "",
  );

  useEffect(() => {
    refreshStorageEstimate();
  }, []);

  const [installAvailable, setInstallAvailable] = useState(isInstallAvailable());
  useEffect(() => onInstallAvailableChanged(setInstallAvailable), []);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  // 表示時点でスタンドアロン起動か・iOS かを判定（静的でよい）。
  const standalone = isStandalone();
  const ios = isIOS();

  const people = activeFamily ? Object.values(activeFamily.people) : [];

  return (
    <BarePage>
      <AppHeader back backTo="/home" />
      <div
        style={{
          padding: "clamp(16px, 4vw, 28px) clamp(14px, 4vw, 48px)",
          height: "calc(var(--app-h) - 56px)",
          overflowY: "auto",
        }}
      >
        <Hand size={11} color={C.shu} style={{ letterSpacing: "0.2em" }}>
          ─── SETTINGS
        </Hand>
        <Title size={28}>設定・データ管理</Title>
        <Brush width={180} color={C.shuSoft} />

        <Row gap={32} style={{ marginTop: 20 }} align="flex-start" wrap>
          <div style={{ flex: "1 1 320px", minWidth: 0, maxWidth: "100%" }}>
            <Section no="A." title="書き出し・取り込み">
              <Item
                label="家系を書き出す（.ftree2）"
                hint="書き出す家系を選んでから実行。家系＋画像を一つの ZIP にまとめます。"
                right={
                  <Row gap={8} wrap justify="flex-end">
                    <select
                      value={exportFamilyId}
                      onChange={(e) => setExportFamilyId(e.target.value)}
                      style={{
                        fontFamily: F.mincho,
                        fontSize: 13,
                        padding: "6px 10px",
                        minHeight: 30,
                        maxWidth: "100%",
                        border: `1px solid ${C.sumi}`,
                        borderRadius: 3,
                        boxShadow: `2px 2px 0 ${C.sumi}`,
                        background: C.paper,
                        cursor: "pointer",
                      }}
                    >
                      {Object.values(store.families).map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                          {f.id === activeFamily?.id ? "（表示中）" : ""}
                        </option>
                      ))}
                    </select>
                    <SketchBtn
                      size="sm"
                      icon="↓"
                      disabled={!exportFamilyId || !store.families[exportFamilyId]}
                      onClick={async () => {
                        const fam = store.families[exportFamilyId];
                        if (!fam) {
                          store.showToast("err", "家系が選択されていません");
                          return;
                        }
                        try {
                          await writeFtree2(fam.id);
                          store.setLastExport();
                          store.showToast("ok", `${fam.name} を書き出しました`);
                        } catch {
                          store.showToast("err", "書き出しに失敗しました");
                        }
                      }}
                    >
                      書き出す
                    </SketchBtn>
                  </Row>
                }
              />
              <Item
                label="ファイルから取り込む"
                hint=".ftree2 を選択して家系を復元。"
                right={<SketchBtn size="sm" icon="↥" to="/import">取り込む</SketchBtn>}
              />
              <Item
                label="月 1 回の書き出しリマインド"
                hint="バックアップ忘れを防ぐため、月に一度案内します。"
                right={
                  <Toggle on={store.reminderEnabled} onChange={store.setReminder} />
                }
              />
            </Section>

            <Section no="B." title="ストレージ">
              <div style={{ marginTop: 4 }}>
                <Row justify="space-between">
                  <Hand size={11} color={C.sub}>
                    ストレージ {pct}% 使用中 — {estimate.used} MB /{" "}
                    {estimate.total} MB
                  </Hand>
                  <Hand size={11} color={C.pale}>
                    navigator.storage.estimate() 実測値
                  </Hand>
                </Row>
                <div
                  style={{
                    marginTop: 6,
                    height: 10,
                    background: C.line,
                    borderRadius: 999,
                    overflow: "hidden",
                    border: `1px solid ${C.sumi}`,
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${C.shu}, ${C.shuSoft})`,
                    }}
                  />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <Item
                  label="永続化を要求（navigator.storage.persist）"
                  hint="ブラウザが容量不足時に勝手に消さないようにします。"
                  right={
                    <SketchBtn
                      size="sm"
                      onClick={async () => {
                        const granted = await requestPersistence();
                        store.showToast(
                          granted ? "ok" : "warn",
                          granted
                            ? "永続化が許可されました"
                            : "ブラウザが永続化を許可しませんでした",
                        );
                        await refreshStorageEstimate();
                      }}
                    >
                      {store.persistGranted ? "許可済み" : "許可を要求"}
                    </SketchBtn>
                  }
                />
                <Item
                  label="ストレージ使用量を再取得"
                  hint="最新の `navigator.storage.estimate()` を反映します。"
                  right={
                    <SketchBtn
                      size="sm"
                      onClick={async () => {
                        await refreshStorageEstimate();
                        store.showToast("ok", "使用量を更新しました");
                      }}
                    >
                      更新
                    </SketchBtn>
                  }
                />
              </div>
            </Section>

            <Section no="C." title="アプリ">
              <Item
                label="ホーム画面に追加（PWA）"
                hint={
                  standalone
                    ? "すでにホーム画面から起動しています。"
                    : installAvailable
                      ? "ブラウザのインストールプロンプトを開きます。"
                      : ios
                        ? "iOS Safari では共有メニュー →「ホーム画面に追加」で登録します。"
                        : "アドレスバー右のインストールアイコン、またはブラウザメニュー「アプリをインストール」から追加してください。"
                }
                right={
                  standalone ? (
                    <Chip tone="shu">✓ インストール済み</Chip>
                  ) : installAvailable ? (
                    <SketchBtn
                      size="sm"
                      icon="↴"
                      onClick={async () => {
                        const outcome = await triggerInstall();
                        if (outcome === "accepted")
                          store.showToast("ok", "インストールしました");
                        else if (outcome === "dismissed")
                          store.showToast("warn", "インストールを中止しました");
                        else
                          store.showToast(
                            "warn",
                            "このブラウザではプロンプトがまだ使えません",
                          );
                      }}
                    >
                      インストール
                    </SketchBtn>
                  ) : ios ? (
                    <SketchBtn
                      size="sm"
                      icon="?"
                      onClick={() => setShowIOSHelp((v) => !v)}
                    >
                      {showIOSHelp ? "閉じる" : "手順を見る"}
                    </SketchBtn>
                  ) : (
                    <Chip tone="mute">プロンプト待機中</Chip>
                  )
                }
              />
              {ios && !standalone && showIOSHelp && (
                <div
                  style={{
                    margin: "6px 0 14px",
                    padding: "14px 16px",
                    background: "#FBF6E6",
                    border: `1px solid ${C.line}`,
                    borderRadius: 4,
                  }}
                >
                  <Hand size={12} color={C.shu} bold style={{ display: "block", marginBottom: 8 }}>
                    iOS で「ホーム画面に追加」
                  </Hand>
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: 22,
                      fontFamily: F.hand,
                      fontSize: 12.5,
                      color: C.sumi,
                      lineHeight: 1.9,
                    }}
                  >
                    <li>画面下の <strong>共有ボタン</strong>（□ に ↑ のアイコン）をタップ</li>
                    <li>メニューをスクロールして <strong>「ホーム画面に追加」</strong> を選択</li>
                    <li>名前（既定：家系図）を確認して <strong>「追加」</strong> をタップ</li>
                  </ol>
                  <Hand size={10.5} color={C.pale} style={{ display: "block", marginTop: 8 }}>
                    ※ Safari でのみ利用できます。Chrome / Firefox on iOS では「共有」メニューに項目が出ません。
                  </Hand>
                </div>
              )}
              <Item
                label="バージョン"
                right={<Hand size={12}>v0.1.0（2026-04-23）</Hand>}
              />
              <Item
                label="新バージョンを確認"
                right={
                  <SketchBtn
                    size="sm"
                    onClick={() => store.showToast("ok", "最新です（v0.1.0）")}
                  >
                    確認
                  </SketchBtn>
                }
              />
            </Section>
          </div>

          <div style={{ flex: "0 1 300px", minWidth: 0, width: "100%", maxWidth: 340 }}>
            <Section no="D." title="自分として見ている人物">
              <Hand size={11} color={C.pale}>
                思い出の「閲覧者」フィルタに使用します。
              </Hand>
              <select
                value={viewerId}
                onChange={(e) => {
                  setViewerId(e.target.value);
                  useFamilyStore.setState({ currentViewerPersonId: e.target.value });
                  store.showToast("ok", "閲覧者を切り替えました");
                }}
                style={{
                  width: "100%",
                  marginTop: 10,
                  border: `1px solid ${C.sumi}`,
                  borderRadius: 3,
                  padding: "8px 12px",
                  background: C.paper,
                  fontFamily: F.mincho,
                  fontSize: 14,
                  boxShadow: `2px 2px 0 ${C.sumi}`,
                  boxSizing: "border-box",
                }}
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.surname} {p.given}
                  </option>
                ))}
              </select>
              <Hand size={11} color={C.sub} style={{ display: "block", marginTop: 8 }}>
                書き手・閲覧者に含まれる思い出だけが一覧に出ます。
              </Hand>
            </Section>

            <Section no="E." title="危険な操作">
              <Col gap={10}>
                <SketchBtn
                  danger
                  icon="⚠"
                  to={`/family/${activeFamily?.id ?? "yamada"}/delete`}
                >
                  この家系を削除…
                </SketchBtn>
                <SketchBtn danger icon="⚠" to="/settings/delete-all">
                  全データを初期化…
                </SketchBtn>
                <Hand size={11} color={C.pale}>
                  削除は復元できません。実行前に家系を書き出して保管してください。
                </Hand>
              </Col>
            </Section>
          </div>
        </Row>
      </div>
    </BarePage>
  );
}
