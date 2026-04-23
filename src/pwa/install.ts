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
