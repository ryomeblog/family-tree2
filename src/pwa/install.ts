// Captures the browser's `beforeinstallprompt` event so that Settings
// can trigger the PWA install UI on demand. Browsers only expose this
// event once, and only when the user hasn't yet installed the app, so
// we cache it globally and expose a trivial imperative API.
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let cached: InstallPromptEvent | null = null;
const listeners = new Set<(available: boolean) => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    cached = e as InstallPromptEvent;
    listeners.forEach((l) => l(true));
  });
  window.addEventListener("appinstalled", () => {
    cached = null;
    listeners.forEach((l) => l(false));
  });
}

export function isInstallAvailable(): boolean {
  return cached !== null;
}

export function onInstallAvailableChanged(
  cb: (available: boolean) => void,
): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function triggerInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!cached) return "unavailable";
  try {
    await cached.prompt();
    const { outcome } = await cached.userChoice;
    cached = null;
    listeners.forEach((l) => l(false));
    return outcome;
  } catch {
    return "dismissed";
  }
}

// ホーム画面から起動されているか。PWA としてインストール済みと判定する強い根拠。
// Android/Desktop Chromium は display-mode、iOS Safari は navigator.standalone を使う。
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mm = window.matchMedia;
  if (mm) {
    if (mm("(display-mode: standalone)").matches) return true;
    if (mm("(display-mode: fullscreen)").matches) return true;
    if (mm("(display-mode: minimal-ui)").matches) return true;
  }
  return (
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

// iOS の Safari / ホーム画面追加フローに乗る必要がある端末か。
// Chrome on iOS (CriOS) / Firefox on iOS (FxiOS) も WebKit だが、beforeinstallprompt は出ない。
// 共有メニュー経由の手順を案内する。
export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  // iPad は iOS 13+ で userAgent に iPad が消えるケースあり → platform + maxTouchPoints で補完
  const nav = window.navigator as { platform?: string; maxTouchPoints?: number };
  const iPadOS = nav.platform === "MacIntel" && (nav.maxTouchPoints ?? 0) > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS;
}
