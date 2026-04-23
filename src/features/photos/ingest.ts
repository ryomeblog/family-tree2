// Ingest a File from <input type=file> → store full + thumb in IDB.
import { putPhoto } from "../../storage/idb";
import { resizeToJpeg, cropSquareJpeg } from "./resize";

export async function ingestFile(file: File): Promise<string> {
  const id = "img_" + Math.random().toString(36).slice(2, 10);
  const full = await resizeToJpeg(file, 1600, 0.82);
  const thumb = await cropSquareJpeg(file, 320, 0.82);
  await putPhoto(id, full);
  await putPhoto(`${id}.thumb`, thumb);
  return id;
}

export function pickFile(
  accept = "image/*",
  multiple = false,
): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", () => {
      const files = Array.from(input.files ?? []);
      input.remove();
      resolve(files);
    });
    input.addEventListener("cancel", () => {
      input.remove();
      resolve([]);
    });
    input.click();
  });
}
