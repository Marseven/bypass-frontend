import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa'


const manifestIcons = [
  {
    src: 'logo-192x192.png',
    sizes: '192x192',
    type: 'image/png',
  },
  {
    src: 'logo-512x512.png',
    sizes: '512x512',
    type: 'image/png',
  }
]

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ByPass',
        short_name: 'ByPass Application',
        icons: manifestIcons,
      }
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

