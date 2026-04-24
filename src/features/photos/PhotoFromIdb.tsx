import React, { useEffect, useState } from "react";
import { Photo } from "../../components/ui";
import { getPhotoUrl } from "../../storage/idb";

export const PhotoFromIdb: React.FC<{
  id?: string;
  size?: number | string;
  aspect?: string;
  rounded?: number;
  label?: string;
  style?: React.CSSProperties;
}> = ({ id, size = 120, aspect, rounded = 4, label, style }) => {
  const [url, setUrl] = useState<string | undefined>();
  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setUrl(undefined);
      return;
    }
    getPhotoUrl(id).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!url) {
    return (
      <Photo
        size={size}
        aspect={aspect}
        rounded={rounded}
        label={label ?? (id ? "読み込み中" : "—")}
        style={style}
      />
    );
  }
  return (
    <img
      src={url}
      alt={label ?? "写真"}
      style={{
        width: size,
        height: aspect ? undefined : size,
        aspectRatio: aspect,
        borderRadius: rounded,
        objectFit: "contain",
        background: "#000",
        display: "block",
        ...style,
      }}
    />
  );
};
