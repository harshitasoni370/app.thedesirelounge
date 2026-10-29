import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const environment = env.VITE_APP_ENV || (mode === "production" ? "production" : "uat");
  const defaultApiBaseUrl =
    environment === "production"
      ? "https://restaurents-api.cylsys.com/api"
      : "https://fumesandflavoursapi.cylsysuat.com/api";
  const waiterApiBaseUrl =
    env.VITE_WAITER_API_BASE_URL || env.VITE_API_BASE_URL || defaultApiBaseUrl;
  const waiterApiTarget = new URL(waiterApiBaseUrl, defaultApiBaseUrl).origin;

  return {
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
        "/waiter-api": {
          target: waiterApiTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/waiter-api/, "/api"),
        },
      },
    },
  };
});
