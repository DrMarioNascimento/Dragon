import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
// @ts-expect-error JS plugin alongside the TS vite config
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";

// `0.0.0.0:8080` is the live-preview contract — don't change host/port.
// The dev server starts once `src/router.tsx` and `src/routes/` exist — see
// AGENTS.md § "First scaffold".
const pages = process.env.MOSAICO_PAGES === "1";

export default defineConfig(({ command, isPreview }) => ({
  base: pages ? "/Dragon/v2/" : "/",
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    // PWA head + ?install=1 tutorial page; runs before Start/Nitro.
    grokPwaPlugin(),
    tailwindcss(),
    tanstackStart(
      pages
        ? { spa: { enabled: true } }
        : undefined,
    ),
    ...(command === "build" || isPreview
      ? pages
        ? []
        : [
            nitro({
              preset: "vercel",
              serverDir: "./server",
            }),
          ]
      : []),
    viteReact(),
  ],
}));
