import JSZip from "jszip";
import { putPhoto } from "../../storage/idb";
import { Family } from "../../domain/types";

export type ImportErrorKind = "corrupt" | "version" | "quota";
export class ImportError extends Error {
  constructor(public kind: ImportErrorKind, message: string) {
    super(message);
  }
}

export interface ImportPreview {
  family: Family;
  manifest: { version: string; exportedAt: string; family: { id: string; name: string } };
  photoCount: number;
  rawZip: JSZip;
}

export async function previewFtree2(file: Blob): Promise<ImportPreview> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new ImportError("corrupt", "ZIP を展開できません");
  }
  const manifestEntry = zip.file("manifest.json");
  if (!manifestEntry)
    throw new ImportError("corrupt", "manifest.json がありません");
  let manifest: ImportPreview["manifest"];
  try {
    manifest = JSON.parse(await manifestEntry.async("string"));
  } catch {
    throw new ImportError("corrupt", "manifest.json を読めません");
  }
  if (manifest.version !== "1") {
    throw new ImportError(
      "version",
      `非互換バージョン: ${manifest.version}`,
    );
  }
  const familyEntry = zip.file("family.json");
  if (!familyEntry)
    throw new ImportError("corrupt", "family.json がありません");
  let family: Family;
  try {
    family = JSON.parse(await familyEntry.async("string"));
  } catch {
    throw new ImportError("corrupt", "family.json を読めません");
  }

  const photoFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith("photos/") && !zip.files[name].dir,
  );
  return {
    family,
    manifest,
    photoCount: photoFiles.filter((n) => !n.endsWith(".thumb.jpg")).length,
    rawZip: zip,
  };
}

export async function commitImport(preview: ImportPreview): Promise<void> {
  const zip = preview.rawZip;
  const photoFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith("photos/") && !zip.files[name].dir,
  );
  try {
    for (const name of photoFiles) {
      const blob = await zip.file(name)!.async("blob");
      const key = name.replace(/^photos\//, "").replace(/\.jpg$/, "");
      await putPhoto(key, blob);
    }
  } catch (e) {
    throw new ImportError("quota", "容量不足のため取り込めません");
  }
}
