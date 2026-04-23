import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BarePage, Hand, Title, SketchBtn, Row, C, F } from "../components/ui";
import { deletePhoto, getPhotoUrl } from "../storage/idb";
import { useFamilyStore } from "../stores/familyStore";

// Pulls photo ids from query-string `ids=a,b,c&i=1`. If none, falls
// back to the ids referenced by the specified memory.
export default function PhotoLightbox() {
  const { fid = "yamada", pid } = useParams();
  const [search] = useSearchParams();
  const nav = useNavigate();
  const store = useFamilyStore();
  const fam = store.families[fid];

  const ids = useMemo(() => {
    const raw = search.get("ids");
    if (raw) return raw.split(",").filter(Boolean);
    if (pid && fam) {
      const mem = Object.values(fam.memories).find(
        (m) => m.photoIds?.includes(pid),
      );
      if (mem?.photoIds) return mem.photoIds;
      return [pid];
    }
    return [];
  }, [search, pid, fam]);

  const initialIndex = parseInt(search.get("i") ?? "0", 10) || 0;
  const [idx, setIdx] = useState(Math.min(initialIndex, Math.max(0, ids.length - 1)));
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    const id = ids[idx];
    if (!id) {
      setUrl(undefined);
      return;
    }
    getPhotoUrl(id).then(setUrl);
  }, [ids, idx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") nav(-1);
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(ids.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ids.length, nav]);

  return (
    <BarePage>
      <div
        style={{
          height: "100vh",
          background: "#0F0E0B",
          color: "#F3EEDF",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(26,25,21,0.6)",
            borderBottom: `1px solid rgba(255,254,248,0.1)`,
          }}
        >
          <Row gap={12}>
            <button
              type="button"
              onClick={() => nav(-1)}
              style={{
                background: "none",
                border: "none",
                color: "#F3EEDF",
                fontFamily: F.hand,
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ←
            </button>
            <Title size={16} color="#F3EEDF">
              写真 {ids.length > 0 ? `${idx + 1} / ${ids.length}` : "—"}
            </Title>
          </Row>
          <Row gap={10}>
            <SketchBtn
              size="sm"
              onClick={() => {
                if (!url) return;
                const a = document.createElement("a");
                a.href = url;
                a.download = (ids[idx] ?? "photo") + ".jpg";
                a.click();
              }}
            >
              ↓ 保存
            </SketchBtn>
            <SketchBtn
              size="sm"
              danger
              onClick={async () => {
                const id = ids[idx];
                if (!id || !fam) return;
                // Remove from any memory that references this photo.
                Object.values(fam.memories).forEach((m) => {
                  if (m.photoIds?.includes(id)) {
                    store.patchMemory(fam.id, m.id, {
                      photoIds: m.photoIds.filter((x) => x !== id),
                      photos: Math.max(0, (m.photos || 0) - 1),
                    });
                  }
                });
                // Remove from any person's portrait.
                Object.values(fam.people).forEach((p) => {
                  if (p.portrait === id) {
                    store.patchPerson(fam.id, p.id, { portrait: undefined });
                  }
                });
                await deletePhoto(id).catch(() => undefined);
                await deletePhoto(id + ".thumb").catch(() => undefined);
                store.showToast("ok", "写真を削除しました");
                if (ids.length <= 1) {
                  nav(-1);
                } else {
                  setIdx((i) => Math.max(0, i - 1));
                }
              }}
            >
              ✕ 削除
            </SketchBtn>
          </Row>
        </div>

        <div
          style={{
            position: "absolute",
            top: 80,
            bottom: 110,
            left: 24,
            right: 24,
            display: "grid",
            placeItems: "center",
          }}
        >
          {idx > 0 && (
            <button
              type="button"
              onClick={() => setIdx(idx - 1)}
              style={{
                position: "absolute",
                left: 16,
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(255,254,248,0.1)",
                border: `1px solid rgba(255,254,248,0.3)`,
                color: "#F3EEDF",
                fontFamily: F.mincho,
                fontSize: 22,
                cursor: "pointer",
              }}
            >
              ‹
            </button>
          )}
          {url ? (
            <img
              src={url}
              alt=""
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                objectFit: "contain",
                border: `1px solid rgba(255,254,248,0.3)`,
              }}
            />
          ) : (
            <Hand color="#8B8574">
              写真が見つかりません。思い出から写真を追加してください。
            </Hand>
          )}
          {idx < ids.length - 1 && (
            <button
              type="button"
              onClick={() => setIdx(idx + 1)}
              style={{
                position: "absolute",
                right: 16,
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(255,254,248,0.1)",
                border: `1px solid rgba(255,254,248,0.3)`,
                color: "#F3EEDF",
                fontFamily: F.mincho,
                fontSize: 22,
                cursor: "pointer",
              }}
            >
              ›
            </button>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "14px 24px",
            background: "rgba(26,25,21,0.7)",
            borderTop: `1px solid rgba(255,254,248,0.1)`,
            display: "flex",
            gap: 10,
            alignItems: "center",
            overflowX: "auto",
          }}
        >
          <Hand size={10} color="#8B8574" style={{ whiteSpace: "nowrap", marginRight: 8 }}>
            {ids.length} 枚
          </Hand>
          {ids.map((id, i) => (
            <button
              key={id + i}
              type="button"
              onClick={() => setIdx(i)}
              style={{
                width: 68,
                height: 68,
                flex: "none",
                border: `${i === idx ? 2 : 1}px solid ${
                  i === idx ? C.shu : "rgba(255,254,248,0.3)"
                }`,
                borderRadius: 2,
                padding: 0,
                background: "#2E2A22",
                cursor: "pointer",
                overflow: "hidden",
              }}
              title={id}
            >
              <Thumb id={id} />
            </button>
          ))}
        </div>
      </div>
    </BarePage>
  );
}

const Thumb: React.FC<{ id: string }> = ({ id }) => {
  const [url, setUrl] = useState<string | undefined>();
  useEffect(() => {
    getPhotoUrl(id + ".thumb").then((u) => {
      if (u) setUrl(u);
      else getPhotoUrl(id).then(setUrl);
    });
  }, [id]);
  if (!url)
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          placeItems: "center",
          color: "rgba(255,254,248,0.35)",
          fontFamily: "'Klee One', cursive",
          fontSize: 10,
        }}
      >
        —
      </div>
    );
  return (
    <img
      src={url}
      alt=""
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
};
