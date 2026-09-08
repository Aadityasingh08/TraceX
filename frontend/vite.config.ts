import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: ["**/dist/**", "**/*.pdf"],
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname || process.cwd(), "./src"),
    },
  },
  envPrefix: ["VITE_", "EXPO_PUBLIC_"],
}));
