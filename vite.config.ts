// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      // Offline support. Registration happens only in src/lib/offline/register-sw.ts (guarded:
      // never in dev, iframes or Lovable preview hosts). The manifest is public/manifest.webmanifest.
      ...VitePWA({
        strategies: "generateSW",
        filename: "sw.js",
        registerType: "autoUpdate",
        injectRegister: null,
        manifest: false,
        devOptions: { enabled: false },
        // TanStack Start serves static files from dist/client.
        outDir: "dist/client",
        workbox: {
          globDirectory: "dist/client",
          globPatterns: ["**/*.{js,css,woff2,png,svg,webmanifest}"],
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              // HTML pages: always network first, cached copy only when offline.
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" &&
                !url.pathname.startsWith("/~oauth") &&
                !url.pathname.startsWith("/api/") &&
                !url.pathname.startsWith("/auth") &&
                !url.pathname.startsWith("/reset-password"),
              handler: "NetworkFirst",
              options: {
                cacheName: "cultura-pages",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 14 },
              },
            },
            {
              urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/images/"),
              handler: "CacheFirst",
              options: {
                cacheName: "cultura-images",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 },
              },
            },
            {
              // Public files copied after the browser build (icons, manifest).
              urlPattern: ({ url, sameOrigin }) =>
                sameOrigin &&
                (url.pathname.startsWith("/icons/") ||
                  url.pathname === "/favicon.png" ||
                  url.pathname === "/manifest.webmanifest"),
              handler: "StaleWhileRevalidate",
              options: { cacheName: "cultura-static", expiration: { maxEntries: 20 } },
            },
          ],
        },
      }).map((plugin) => ({
        ...plugin,
        // Generate the service worker once, from the browser build only.
        applyToEnvironment: (env: { name: string }) => env.name === "client",
      })),
    ],
  },
});
