import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Deployed to GitHub Pages at https://<user>.github.io/family-tree2/.
// HashRouter keeps all app routes behind `#`, so no extra rewrite is needed.
export default defineConfig({
  base: "/family-tree2/",
  // 既定だと 127.0.0.1 のみにバインドされ LAN からアクセスできないので、
  // dev server を全 IF（0.0.0.0）で listen させる。
  // npm run dev 時に "Network: http://<LAN-IP>:5173/family-tree2/" が表示される。
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      strategies: "generateSW",
      manifest: {
        name: "ファミリーツリー２",
        short_name: "家系図",
        description: "絵本のような家系図アプリ（端末内完結）",
        display: "standalone",
        start_url: "./",
        scope: "./",
        background_color: "#FFFEF8",
        theme_color: "#C0392B",
        lang: "ja",
        icons: [
          {
            src: "./icons/icon-512.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "./icons/icon-512.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2,png,svg,ico}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
