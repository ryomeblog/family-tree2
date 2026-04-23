import { useFamilyStore } from "../stores/familyStore";

export async function requestPersistence(): Promise<boolean> {
  if (!("storage" in navigator) || !navigator.storage.persist) return false;
  const granted = await navigator.storage.persist();
  useFamilyStore.getState().setPersistGranted(granted);
  return granted;
}

export async function refreshStorageEstimate(): Promise<void> {
  if (!("storage" in navigator) || !navigator.storage.estimate) return;
  try {
    const e = await navigator.storage.estimate();
    const used = Math.round((e.usage ?? 0) / (1024 * 1024));
    const total = Math.round((e.quota ?? 0) / (1024 * 1024));
    useFamilyStore
      .getState()
      .setStorageEstimate({ used, total: total > 0 ? total : 500 });
  } catch {
    /* ignore */
  }
}
