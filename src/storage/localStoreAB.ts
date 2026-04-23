// Two-slot alternating writer. Each `setItem` picks the staler of the
// two slots, writes there with an incremented `seq`, so a half-written
// write never corrupts the previous known-good slot.
interface Slot<T> {
  seq: number;
  payload: T;
}

const keyA = (base: string) => `${base}.a`;
const keyB = (base: string) => `${base}.b`;

function readSlot<T>(base: string, suffix: "a" | "b"): Slot<T> | null {
  try {
    const raw = localStorage.getItem(
      suffix === "a" ? keyA(base) : keyB(base),
    );
    if (!raw) return null;
    return JSON.parse(raw) as Slot<T>;
  } catch {
    return null;
  }
}

export function loadLatest<T>(base: string): T | null {
  const a = readSlot<T>(base, "a");
  const b = readSlot<T>(base, "b");
  if (!a && !b) return null;
  if (!a) return b!.payload;
  if (!b) return a.payload;
  return (a.seq >= b.seq ? a : b).payload;
}

export function saveAB<T>(base: string, payload: T): void {
  const a = readSlot<T>(base, "a");
  const b = readSlot<T>(base, "b");
  const currentSeq = Math.max(a?.seq ?? 0, b?.seq ?? 0);
  // Pick the stale slot so a crash never corrupts the newest.
  const writeKey =
    (a?.seq ?? -1) <= (b?.seq ?? -1) ? keyA(base) : keyB(base);
  const slot: Slot<T> = { seq: currentSeq + 1, payload };
  try {
    localStorage.setItem(writeKey, JSON.stringify(slot));
  } catch (e) {
    // QuotaExceededError — surface to caller.
    throw e;
  }
}

export function clearAB(base: string): void {
  localStorage.removeItem(keyA(base));
  localStorage.removeItem(keyB(base));
}
