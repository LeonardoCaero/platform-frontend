import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: env.VITE_PROXY_TARGET ? {
      '/api': {
        target: env.VITE_PROXY_TARGET,
        changeOrigin: true,
      },
    } : undefined,
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: "autoUpdate",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,svg,png,woff2}"],
      },
      includeAssets: ["favicon.ico", "caeroDev_logo.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "Platform",
        short_name: "Platform",
        description: "Platform — gestión de empresas y equipos",
        theme_color: "#4F46E5",
        background_color: "#0a0f1e",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("react-router")) return "vendor-react";
            if (id.includes("@radix-ui")) return "vendor-radix";
            if (id.includes("@tanstack")) return "vendor-query";
            if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("/zod/")) return "vendor-forms";
            if (id.includes("date-fns")) return "vendor-dates";
            if (id.includes("lucide-react")) return "vendor-icons";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
});
