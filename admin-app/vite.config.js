import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// ადმინ-პანელის ბილდი → public/admin (Express ემსახურება /admin-ზე)
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "/admin/",
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("../public/admin", import.meta.url)),
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
  },
  server: {
    port: 5173,
    proxy: { "/admin/api": "http://localhost:3000", "/assets": "http://localhost:3000", "/uploads": "http://localhost:3000" },
  },
});
