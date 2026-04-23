// Service worker registration. vite-plugin-pwa exposes
// "virtual:pwa-register" at build time. In dev it's a no-op, so we
// guard for it and ignore resolution failures.
import { useFamilyStore } from "../stores/familyStore";

let updatePrompted = false;

export async function registerSW(): Promise<void> {
  try {
    const mod = await import("virtual:pwa-register").catch(() => null);
    if (!mod?.registerSW) return;
    const update = mod.registerSW({
      onNeedRefresh: () => {
        if (updatePrompted) return;
        updatePrompted = true;
        useFamilyStore
          .getState()
          .showToast("warn", "新しいバージョンが利用できます。再読み込みで適用。");
        setTimeout(() => update(true).catch(() => undefined), 10_000);
      },
      onOfflineReady: () => {
        useFamilyStore.getState().showToast("ok", "オフラインで使えます");
      },
    });
  } catch {
    // dev server or unsupported — silent.
  }
}
