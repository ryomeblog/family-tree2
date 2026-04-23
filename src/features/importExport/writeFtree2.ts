import JSZip from "jszip";
import { getPhoto } from "../../storage/idb";
import { useFamilyStore } from "../../stores/familyStore";

export async function writeFtree2(familyId: string): Promise<void> {
  const store = useFamilyStore.getState();
  const fam = store.families[familyId];
  if (!fam) throw new Error("family not found: " + familyId);

  const zip = new JSZip();
  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        version: "1",
        exportedAt: new Date().toISOString(),
        family: { id: fam.id, name: fam.name },
      },
      null,
      2,
    ),
  );
  zip.file("family.json", JSON.stringify(fam, null, 2));

  // Collect all photo ids referenced from people portraits + memories.
  const photoIds = new Set<string>();
  Object.values(fam.people).forEach((p) => p.portrait && photoIds.add(p.portrait));
  Object.values(fam.memories).forEach(
    (m) => m.photoIds?.forEach((pid) => photoIds.add(pid)),
  );

  for (const pid of photoIds) {
    const full = await getPhoto(pid);
    if (full) zip.file(`photos/${pid}.jpg`, full);
    const thumb = await getPhoto(pid + ".thumb");
    if (thumb) zip.file(`photos/${pid}.thumb.jpg`, thumb);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const name = `${fam.name.replace(/[\\/:*?"<>|]/g, "_")}_${
    new Date().toISOString().slice(0, 10)
  }.ftree2`;

  // Prefer File System Access API when available.
  const anyWin = window as unknown as {
    showSaveFilePicker?: (opts: {
      suggestedName: string;
      types: { description: string; accept: Record<string, string[]> }[];
    }) => Promise<{ createWritable: () => Promise<WritableStream & { write: (b: Blob) => Promise<void>; close: () => Promise<void> }> }>;
  };
  try {
    if (anyWin.showSaveFilePicker) {
      const handle = await anyWin.showSaveFilePicker({
        suggestedName: name,
        types: [
          {
            description: "Family Tree 2 archive",
            accept: { "application/zip": [".ftree2"] },
          },
        ],
      });
      const w = await handle.createWritable();
      await w.write(blob);
      await w.close();
    } else {
      downloadBlob(blob, name);
    }
  } catch {
    downloadBlob(blob, name);
  }

  useFamilyStore.getState().setLastExport();
  useFamilyStore.getState().markClean();
  useFamilyStore.getState().showToast("ok", `${fam.name} を書き出しました`);
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
