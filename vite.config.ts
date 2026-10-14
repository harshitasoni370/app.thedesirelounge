import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/domain-api": {
        target: "https://fumesandflavoursapi.cylsysuat.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/domain-api/, "/api"),
      },
      "/api": {
        target: "https://fumesandflavoursapi.cylsysuat.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
