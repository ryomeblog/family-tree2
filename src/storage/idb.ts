// IndexedDB wrapper for photo Blobs. Two record kinds per PhotoId:
//   `<id>`            — full-size JPEG (<=1600px longer edge)
//   `<id>.thumb`      — 320px thumbnail
import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "ft2";
const STORE = "photos";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

export async function putPhoto(key: string, blob: Blob): Promise<void> {
  const db = await getDb();
  await db.put(STORE, blob, key);
}

export async function getPhoto(key: string): Promise<Blob | undefined> {
  const db = await getDb();
  return (await db.get(STORE, key)) as Blob | undefined;
}

export async function deletePhoto(key: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, key);
}

export async function listPhotoKeys(): Promise<string[]> {
  const db = await getDb();
  return (await db.getAllKeys(STORE)) as string[];
}

export async function clearPhotos(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE);
}

// ── Lightweight async cache of blob URLs. Callers are expected to
// `revoke` when unmounting the image.
const urlCache = new Map<string, string>();

export async function getPhotoUrl(key: string): Promise<string | undefined> {
  const cached = urlCache.get(key);
  if (cached) return cached;
  const blob = await getPhoto(key);
  if (!blob) return undefined;
  const url = URL.createObjectURL(blob);
  urlCache.set(key, url);
  return url;
}

export function revokePhotoUrl(key: string): void {
  const url = urlCache.get(key);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(key);
  }
}
