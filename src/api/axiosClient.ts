import axios, { type AxiosRequestConfig } from "axios";
import { TABLE_SESSION_STORAGE_KEY, URLS } from "@/config/urls";

// Must match SESSION_KEY in SessionContext.tsx
const SESSION_STORAGE_KEY = "ff_session_v1";

const SESSION_REQUIRED_PATHS = [
  /\/Cart\/addcart/i,
  /\/Cart\/getcartitems\//i,
  /\/Cart\/updatequantity/i,
  /\/Cart\/removeitem/i,
  /\/Order\/order/i,
  /\/Reservation\/CraeteReservation/i,
];

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

/**
 * QR flow detect karne ka order:
 *  1. URL me QR params hain (type=... ya company+branch+table/session)  => QR
 *  2. URL me sirf company+branch hai (website se direct entry)          => DIRECT
 *  3. URL me kuch nahi (e.g. /cart, /checkout, refresh) => saved session
 *     ka `source` dekho. QR scan ke baad internal navigation me URL params
 *     hat jaate hain, isliye sirf URL pe depend karne se header chhoot raha tha.
 */
function hasQrFlowContext(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    const hasType = Boolean(params.get("type"));
    const hasCompany = Boolean(
      params.get("companyId") || params.get("companyID") || params.get("uidCompanyId") || params.get("cid")
    );
    const hasBranch = Boolean(
      params.get("branchId") || params.get("branchID") || params.get("uidBranchId") || params.get("bid")
    );
    const hasTableOrSession = Boolean(
      params.get("tableId") ||
        params.get("tableID") ||
        params.get("uidTableId") ||
        params.get("tid") ||
        params.get("sessionId") ||
        params.get("tableSessionId") ||
        params.get("Table-Session-Id") ||
        params.get("sid")
    );

    if (hasType || (hasCompany && hasBranch && hasTableOrSession)) return true;
    // Website se direct aaya (company + branch, par QR/table nahi) => direct flow.
    if (hasCompany && hasBranch) return false;
  } catch {
    return false;
  }

  // URL me koi context nahi -> saved session se decide karo.
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw) as { source?: string; sessionId?: string | null } | null;
    if (!saved) return false;
    if (saved.source === "qr") return true;
    // Purani saved session (source field aane se pehle ki) jisme sessionId ho => QR hi thi.
    if (!saved.source && saved.sessionId) return true;
  } catch {}
  return false;
}

export function getTableSessionId(): string | null {
  if (!hasQrFlowContext()) return null;

  try {
    const localValue = localStorage.getItem(TABLE_SESSION_STORAGE_KEY);
    if (localValue) {
      const parsed = JSON.parse(localValue);
      return typeof parsed === "string" ? parsed : String(parsed);
    }
  } catch {}

  try {
    const sessionValue = sessionStorage.getItem(TABLE_SESSION_STORAGE_KEY);
    if (sessionValue) {
      const parsed = JSON.parse(sessionValue);
      return typeof parsed === "string" ? parsed : String(parsed);
    }
  } catch {}

  return null;
}

export function setTableSessionId(value: string | null): void {
  try {
    if (value) {
      localStorage.setItem(TABLE_SESSION_STORAGE_KEY, JSON.stringify(value));
      sessionStorage.setItem(TABLE_SESSION_STORAGE_KEY, JSON.stringify(value));
      return;
    }
    localStorage.removeItem(TABLE_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(TABLE_SESSION_STORAGE_KEY);
  } catch {}
}

export function api<T = unknown>(config: AxiosRequestConfig) {
  const url = config.url || "";
  const rawHeaders = (config.headers && typeof config.headers === "object" ? config.headers : {}) as Record<string, unknown>;
  const explicitTableSessionId =
    (rawHeaders["Table-Session-Id"] as string | undefined) ||
    (rawHeaders["tableSessionId"] as string | undefined) ||
    (rawHeaders["table-session-id"] as string | undefined) ||
    null;
  const qrFlow = hasQrFlowContext();
  const tableSessionId = explicitTableSessionId || getTableSessionId();

  if (qrFlow && SESSION_REQUIRED_PATHS.some((pattern) => pattern.test(url)) && !tableSessionId) {
    return Promise.reject(new Error("Please scan the QR again"));
  }

  const mergedHeaders = {
    ...rawHeaders,
    ...(qrFlow && tableSessionId ? { "Table-Session-Id": tableSessionId } : {}),
  };

  return apiClient.request<T>({ ...config, headers: mergedHeaders });
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
    console.error("[API ERROR]", error?.config?.url, error?.message, {
      status: error?.response?.status,
      response: error?.response?.data,
      sentHeaders: error?.config?.headers,
      sentBody: error?.config?.data,
    });
    return Promise.reject(error);
  }
);