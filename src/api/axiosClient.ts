import axios from "axios";
import { URLS } from "@/config/urls";

/**
 * Base URL comes from the environment so it's trivial to point at
 * UAT / staging / production without touching code.
 * Set VITE_API_BASE_URL in a .env(.local) file — see .env.example.
 */
const baseURL = URLS.api.base;

if (!import.meta.env.VITE_API_BASE_URL && !import.meta.env.DEV) {
  // Without this, axios silently falls back to relative URLs (i.e. hits
  // the dev server itself instead of the real API), which just looks
  // like "nothing works" with no clear error pointing at the cause.
  // eslint-disable-next-line no-console
  console.error(
    "[API CONFIG] VITE_API_BASE_URL is not set. Requests will be sent to relative paths instead of the API. " +
      "Check that .env.local exists in the project root, defines VITE_API_BASE_URL, and that the dev server was restarted after adding/editing it."
  );
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Centralized place to log/report API failures.
    console.error("[API ERROR]", error?.config?.url, error?.message);
    return Promise.reject(error);
  }
);