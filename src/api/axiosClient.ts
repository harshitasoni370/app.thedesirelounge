import axios, { type AxiosRequestConfig } from "axios";
import { TABLE_SESSION_STORAGE_KEY, URLS } from "@/config/urls";

// Must match SESSION_KEY in SessionContext.tsx
const SESSION_STORAGE_KEY = "ff_session_v1";
const ZERO_SESSION_ID = "00000000-0000-0000-0000-000000000000";

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
function readSavedSession(): { source?: string; sessionId?: string | null; companyId?: string | null; branchId?: string | null } | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY) || sessionStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) as ReturnType<typeof readSavedSession> : null;
  } catch {
    return null;
  }
}

function hasQrFlowContext(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    const getParam = (...keys: string[]) => {
      const wanted = new Set(keys.map((key) => key.toLowerCase()));
      for (const [key, value] of params.entries()) {
        if (wanted.has(key.toLowerCase()) && value.trim()) return value.trim();
      }
      return "";
    };
    const hasType = Boolean(getParam("type"));
    const companyId = getParam("companyId", "companyID", "uidCompanyId", "cid");
    const branchId = getParam("branchId", "branchID", "uidBranchId", "bid");
    const hasTableOrSession = Boolean(
      getParam("tableId", "tableID", "uidTableId", "tid", "sessionId", "tableSessionId", "Table-Session-Id", "sid")
    );

    if (hasType || (companyId && branchId && hasTableOrSession)) return true;
    if (companyId && branchId) {
      const saved = readSavedSession();
      return Boolean(
        saved?.source === "qr" &&
        saved.companyId?.toLowerCase() === companyId.toLowerCase() &&
        saved.branchId?.toLowerCase() === branchId.toLowerCase()
      );
    }
  } catch {
    return false;
  }

  const saved = readSavedSession();
  if (saved?.source === "qr") return true;
  // Older saved QR sessions predate the source field.
  if (!saved?.source && saved?.sessionId) return true;
  return false;
}

function isUsableTableSessionId(value: unknown): value is string {
  return typeof value === "string" &&
    Boolean(value.trim()) &&
    value.trim().toLowerCase() !== ZERO_SESSION_ID;
}

export function getTableSessionId(): string | null {
  if (!hasQrFlowContext()) return null;

  try {
    const localValue = localStorage.getItem(TABLE_SESSION_STORAGE_KEY);
    if (localValue) {
      const parsed = JSON.parse(localValue);
      const value = typeof parsed === "string" ? parsed : String(parsed);
      if (isUsableTableSessionId(value)) return value.trim();
    }
  } catch {}

  try {
    const sessionValue = sessionStorage.getItem(TABLE_SESSION_STORAGE_KEY);
    if (sessionValue) {
      const parsed = JSON.parse(sessionValue);
      const value = typeof parsed === "string" ? parsed : String(parsed);
      if (isUsableTableSessionId(value)) return value.trim();
    }
  } catch {}

  const saved = readSavedSession();
  return isUsableTableSessionId(saved?.sessionId) ? saved.sessionId.trim() : null;
}

export function setTableSessionId(value: string | null): void {
  try {
    if (isUsableTableSessionId(value)) {
      localStorage.setItem(TABLE_SESSION_STORAGE_KEY, JSON.stringify(value.trim()));
      sessionStorage.setItem(TABLE_SESSION_STORAGE_KEY, JSON.stringify(value.trim()));
      return;
    }
    localStorage.removeItem(TABLE_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(TABLE_SESSION_STORAGE_KEY);
  } catch {}
}

export function api<T = unknown>(config: AxiosRequestConfig) {
  const url = config.url || "";
  const rawHeaders = (config.headers && typeof config.headers === "object" ? config.headers : {}) as Record<string, unknown>;
  const explicitTableSessionId = [
    (rawHeaders["Table-Session-Id"] as string | undefined) ||
    (rawHeaders["tableSessionId"] as string | undefined) ||
    (rawHeaders["table-session-id"] as string | undefined) ||
    null,
  ].find(isUsableTableSessionId) || null;
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