import { useFamilyStore } from "../stores/familyStore";

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export function checkMonthlyReminder(): void {
  const s = useFamilyStore.getState();
  if (!s.reminderEnabled) return;
  const last = s.reminderShownAt ?? 0;
  const elapsed = Date.now() - last;
  if (elapsed < MONTH_MS) return;
  // Only show if we actually have data to lose.
  const hasData =
    Object.values(s.families).some((f) => Object.keys(f.people).length > 0) &&
    (!s.lastExportAt || Date.now() - s.lastExportAt >= MONTH_MS);
  if (!hasData) return;
  setTimeout(() => {
    useFamilyStore
      .getState()
      .showToast("warn", "書き出し（.ftree2）で月 1 回のバックアップを。");
    useFamilyStore.getState().touchReminder();
  }, 1500);
}
