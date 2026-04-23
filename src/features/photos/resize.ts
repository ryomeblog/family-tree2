// Load a File/Blob into an image and resize to a max edge while
// preserving aspect. Returns a JPEG Blob at the requested quality.
export async function resizeToJpeg(
  input: Blob,
  maxEdge: number,
  quality = 0.82,
): Promise<Blob> {
  const bitmap = await blobToBitmap(input);
  const { width, height } = fitInside(bitmap.width, bitmap.height, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality,
    ),
  );
}

export async function cropSquareJpeg(
  input: Blob,
  size: number,
  quality = 0.82,
): Promise<Blob> {
  const bitmap = await blobToBitmap(input);
  const s = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - s) / 2;
  const sy = (bitmap.height - s) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, sx, sy, s, s, 0, 0, size, size);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality,
    ),
  );
}

async function blobToBitmap(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob);
    } catch {
      /* fall through to HTMLImageElement path */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

function fitInside(w: number, h: number, maxEdge: number) {
  if (Math.max(w, h) <= maxEdge) return { width: w, height: h };
  if (w >= h) return { width: maxEdge, height: Math.round((h / w) * maxEdge) };
  return { width: Math.round((w / h) * maxEdge), height: maxEdge };
}
