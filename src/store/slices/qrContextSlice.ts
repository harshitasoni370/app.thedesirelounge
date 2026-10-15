import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { QR_CONTEXT_PARAMS, QR_CONTEXT_STORAGE_KEY, SHORT_PARAM_ALIASES, TABLE_SESSION_STORAGE_KEY, URLS } from "@/config/urls";

export interface CheckDevicePayload {
  deviceId: string;
  companyId: string;
}

export interface CheckDeviceResponse {
  isReturning: boolean;
  customerId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  countryCode?: string | null;
  mobile?: string | null;
  dob?: string | null;
}

export interface QrContextState {
  params: Record<string, string>;
  data: unknown;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  fetchedAt: string | null;
  deviceId: string | null;
  device: {
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
    data: CheckDeviceResponse | null;
  };
}

export function resolveParam(searchOrParams: string | URLSearchParams | Record<string, string>, key: string): string | null {
  let params: URLSearchParams;
  if (typeof searchOrParams === "string") {
    params = new URLSearchParams(searchOrParams);
  } else if (searchOrParams instanceof URLSearchParams) {
    params = searchOrParams;
  } else {
    params = new URLSearchParams();
    Object.entries(searchOrParams).forEach(([k, v]) => params.set(k, v));
  }
  const long = params.get(key);
  if (long !== null && long !== undefined && long !== "") return long;
  const shortKey = Object.entries(SHORT_PARAM_ALIASES).find(([, v]) => v === key)?.[0];
  if (shortKey) {
    const sv = params.get(shortKey);
    if (sv !== null && sv !== undefined && sv !== "") return sv;
  }
  if (SHORT_PARAM_ALIASES[key]) {
    const v = params.get(SHORT_PARAM_ALIASES[key]);
    if (v !== null && v !== undefined && v !== "") return v;
  }
  return null;
}

const DEVICE_ID_STORAGE_KEY = "desire_device_id";

// Same-device recognition (checkDevice / "Returning Guest") needs a deviceId
// that survives a *fresh* browser/tab context — which is exactly what a
// mobile QR scan creates every time (camera app / WhatsApp in-app browser
// each open a new context with its own sessionStorage). sessionStorage
// alone only worked while testing in one long-lived tab (e.g. on laptop).
// localStorage persists per-browser-on-that-device across those fresh
// contexts, so it's the source of truth; sessionStorage is kept in sync
// only as a fast-path cache.
function generateDeviceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const rand = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return `${rand(8)}-${rand(4)}-4${rand(3)}-${(8 + Math.floor(Math.random() * 4))
    .toString(16)}${rand(3)}-${rand(12)}`;
}

function readStoredDeviceId(): string | null {
  try {
    const fromLocal = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (fromLocal) return fromLocal;
  } catch {}
  try {
    const fromSession = sessionStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (fromSession) return fromSession;
  } catch {}
  return null;
}

function writeStoredDeviceId(id: string): void {
  try {
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
  } catch {
    // private-browsing / quota-exceeded — app still works, just won't
    // recognize this device on a future fresh QR scan.
  }
  try {
    sessionStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
  } catch {}
}

function extractDeviceId(
  search: string | URLSearchParams | undefined,
  params: Record<string, string> | undefined,
): string {
  // Stored id wins first, always. This is what guarantees "one device =
  // one deviceId, forever on this browser" — if a URL-provided deviceId
  // (e.g. a `did` forwarded from another site's link) were allowed to
  // override an id this browser already has, the same physical device
  // could start looking like a different one depending on how it arrived,
  // which is exactly the inconsistency we don't want.
  const stored = readStoredDeviceId();
  if (stored) {
    writeStoredDeviceId(stored); // re-sync in case only sessionStorage had it
    return stored;
  }

  // No id yet on this browser — a forwarded URL id becomes this device's
  // id from now on and gets persisted.
  if (search) {
    const fromSearch = resolveParam(search, "deviceId");
    if (fromSearch) {
      writeStoredDeviceId(fromSearch);
      return fromSearch;
    }
  }
  if (params) {
    const fromParam = resolveParam(params, "deviceId");
    if (fromParam) {
      writeStoredDeviceId(fromParam);
      return fromParam;
    }
  }

  // Brand-new device on this browser — generate once and persist.
  const generated = generateDeviceId();
  writeStoredDeviceId(generated);
  return generated;
}

function readPersistedContext(): Partial<QrContextState> | null {
  try {
    const raw = sessionStorage.getItem(QR_CONTEXT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<QrContextState>;
  } catch {
    return null;
  }
}

function normalizeDob(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : s.split(" ")[0] || null;
}

function persistTableSessionId(input: Record<string, string> | undefined | null, data: unknown): void {
  const candidates = [
    input?.sessionId,
    input?.tableSessionId,
    input?.["Table-Session-Id"],
    input?.sid,
  ];

  const walk = (value: unknown): string | null => {
    if (!value || typeof value !== "object") return null;
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (["sessionId", "tableSessionId", "Table-Session-Id", "sid"].includes(key)) {
        if (typeof child === "string" || typeof child === "number") return String(child);
      }
      const nested = walk(child);
      if (nested) return nested;
    }
    return null;
  };

  const sessionCandidates: Array<string | null | undefined> = [...candidates, walk(data)];
  const match = sessionCandidates.find(
    (value) => value && value.trim() !== "00000000-0000-0000-0000-000000000000",
  );

  try {
    if (match) {
      localStorage.setItem(TABLE_SESSION_STORAGE_KEY, JSON.stringify(match));
      sessionStorage.setItem(TABLE_SESSION_STORAGE_KEY, JSON.stringify(match));
      return;
    }
    localStorage.removeItem(TABLE_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(TABLE_SESSION_STORAGE_KEY);
  } catch {}
}

function unwrapDevicePayload(raw: unknown): CheckDeviceResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const anyRaw = raw as Record<string, unknown>;
  const nested: unknown = anyRaw.data && typeof anyRaw.data === "object" ? anyRaw.data : raw;
  if (!nested || typeof nested !== "object") return null;
  const n = nested as Record<string, unknown>;
  return {
    isReturning: Boolean(n.isReturning),
    customerId: typeof n.customerId === "string" ? n.customerId : null,
    firstName: typeof n.firstName === "string" ? n.firstName : null,
    lastName: typeof n.lastName === "string" ? n.lastName : null,
    countryCode: typeof n.countryCode === "string" ? n.countryCode : null,
    mobile: typeof n.mobile === "string" ? n.mobile : null,
    dob: typeof n.dob === "string" ? n.dob : null,
  };
}

function readQueryParam(params: Record<string, string>, key: string): string {
  const match = Object.keys(params).find((paramKey) => paramKey.toLowerCase() === key.toLowerCase());
  return match ? params[match].trim() : "";
}

export const TABLE_OCCUPIED_ERROR = "This table is already booked.";
const ZERO_SESSION_ID = "00000000-0000-0000-0000-000000000000";

function isReusableSessionId(value: string | null | undefined): value is string {
  return Boolean(value && value.trim().toLowerCase() !== ZERO_SESSION_ID);
}

function qrSessionStorageKey(domain: string, tableCode: string): string {
  return `desire_qr_session:${domain.toLowerCase()}:${tableCode.toLowerCase()}`;
}

function readSavedQrSessionId(domain: string, tableCode: string): string {
  const key = qrSessionStorageKey(domain, tableCode);
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const value = storage.getItem(key);
      if (isReusableSessionId(value)) return value;
      if (value) storage.removeItem(key);
    } catch {
      // Try the other browser storage.
    }
  }
  return "";
}

function saveQrSessionId(domain: string, tableCode: string, sessionId: string): void {
  const key = qrSessionStorageKey(domain, tableCode);
  for (const storage of [localStorage, sessionStorage]) {
    try {
      storage.setItem(key, sessionId);
    } catch {
      // The other browser storage may still be available.
    }
  }
}

function clearSavedQrSessionId(domain: string, tableCode: string): void {
  const key = qrSessionStorageKey(domain, tableCode);
  for (const storage of [localStorage, sessionStorage]) {
    try {
      storage.removeItem(key);
    } catch {
      // Storage can be unavailable in private browsing.
    }
  }
}

function readResponseValue(value: unknown, keys: string[]): string {
  if (!value || typeof value !== "object") return "";
  const wanted = new Set(keys.map((key) => key.toLowerCase()));
  for (const [key, child] of Object.entries(value)) {
    if (wanted.has(key.toLowerCase()) && child !== null && child !== undefined) return String(child).trim();
    const nested = readResponseValue(child, keys);
    if (nested) return nested;
  }
  return "";
}

function isOccupiedContext(data: unknown): boolean {
  const sessionId = readResponseValue(data, ["sessionId", "tableSessionId", "uidSessionId"]);
  const sessionStatus = readResponseValue(data, ["sessionStatus"]);
  return sessionId.toLowerCase() === ZERO_SESSION_ID && sessionStatus.toLowerCase() === "occupied";
}

export const fetchQrContext = createAsyncThunk(
  "qrContext/fetch",
  async ({ search, domain }: { search: string; domain: string }, { signal, rejectWithValue }) => {
    const searchParams = new URLSearchParams(search);
    const params = Object.fromEntries(searchParams.entries());
    const tableCode =
      readQueryParam(params, "tableCode") ||
      readQueryParam(params, "tableNo") ||
      readQueryParam(params, "tableNumber") ||
      readQueryParam(params, "name");
    const readParam = (...keys: string[]) =>
      keys.some((key) => Boolean(readQueryParam(params, key)) || Boolean(resolveParam(params, key)));
    const hasForwardedContext =
      readParam("companyId", "companyID", "uidCompanyId", "cid") &&
      readParam("branchId", "branchID", "uidBranchId", "bid") &&
      (readParam("tableId", "tableID", "uidTableId", "tid") ||
        readParam("sessionId", "tableSessionId", "Table-Session-Id", "sid"));
    if (!QR_CONTEXT_PARAMS.some((key) => readQueryParam(params, key)) && !hasForwardedContext) return null;

    const deviceId = extractDeviceId(search, params);
    const requestDomain = readQueryParam(params, "domain") || domain || window.location.hostname;
    const savedSessionId = tableCode ? readSavedQrSessionId(requestDomain, tableCode) : "";
    const requestedSessionId = readQueryParam(params, "sessionId") || savedSessionId;
    if (isReusableSessionId(requestedSessionId)) params.sessionId = requestedSessionId;
    const pending = {
      params,
      data: null,
      fetchedAt: null,
      deviceId,
      device: { status: "idle" as const, error: null, data: null },
    };
    sessionStorage.setItem(QR_CONTEXT_STORAGE_KEY, JSON.stringify(pending));

    if (hasForwardedContext && !tableCode) {
      const longKeys = [
        "companyId",
        "companyID",
        "uidCompanyId",
        "branchId",
        "branchID",
        "uidBranchId",
        "tableId",
        "tableID",
        "uidTableId",
        "companyName",
        "branchName",
        "tableName",
        "tableNumber",
        "tableNo",
        "sessionId",
        "tableSessionId",
        "Table-Session-Id",
      ];
      const data: Record<string, string> = {};
      longKeys.forEach((key) => {
        const v = resolveParam(params, key);
        if (v) data[key] = v;
      });
      persistTableSessionId(params, data);
      const context = { params, data, fetchedAt: new Date().toISOString(), deviceId };
      sessionStorage.setItem(QR_CONTEXT_STORAGE_KEY, JSON.stringify(context));
      return context;
    }

    try {
      const response = await axios.get(URLS.api.qrContext, {
        params: {
          domain: requestDomain,
          tableCode,
          ...(isReusableSessionId(requestedSessionId) ? { sessionId: requestedSessionId } : {}),
        },
        signal,
      });
      if (isOccupiedContext(response.data)) {
        clearSavedQrSessionId(requestDomain, tableCode);
        persistTableSessionId(null, null);
        return rejectWithValue(TABLE_OCCUPIED_ERROR);
      }

      const responseSessionId = readResponseValue(response.data, ["sessionId", "tableSessionId", "uidSessionId"]);
      if (tableCode && isReusableSessionId(responseSessionId)) {
        params.sessionId = responseSessionId;
        saveQrSessionId(requestDomain, tableCode, responseSessionId);
      }
      persistTableSessionId(params, response.data);
      const context = { params, data: response.data, fetchedAt: new Date().toISOString(), deviceId };
      sessionStorage.setItem(QR_CONTEXT_STORAGE_KEY, JSON.stringify(context));
      return context;
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      return rejectWithValue(axios.isAxiosError(error) ? error.message : "Unable to load QR context");
    }
  },
  {
    condition: (_, { getState }) =>
      (getState() as { qrContext: QrContextState }).qrContext.status !== "loading",
  },
);

export const checkDevice = createAsyncThunk(
  "qrContext/checkDevice",
  async (payload: CheckDevicePayload, { signal, rejectWithValue, getState }) => {
    const state = getState() as { qrContext: QrContextState };
    const deviceId = payload.deviceId || state.qrContext.deviceId || "";
    const companyId = payload.companyId;
    if (!deviceId || !companyId) return null;
    try {
      const response = await axios.post(
        URLS.api.checkDevice,
        { deviceId, companyId },
        { signal, headers: { "Content-Type": "application/json" } },
      );
      writeStoredDeviceId(deviceId);
      const payloadResponse = unwrapDevicePayload(response.data);
      return payloadResponse;
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      return rejectWithValue(axios.isAxiosError(error) ? error.message : "Unable to verify device");
    }
  },
);

const persisted = readPersistedContext();
const initialState: QrContextState = {
  params: persisted?.params || {},
  data: persisted?.data || null,
  status: persisted?.data ? "succeeded" : "idle",
  error: null,
  fetchedAt: persisted?.fetchedAt || null,
  deviceId: persisted?.deviceId || readStoredDeviceId(),
  device: persisted?.device || { status: "idle", error: null, data: null },
};

const qrContextSlice = createSlice({
  name: "qrContext",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQrContext.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchQrContext.fulfilled, (state, action) => {
        if (action.payload) {
          state.params = action.payload.params || state.params;
          state.data = action.payload.data || state.data;
          state.fetchedAt = action.payload.fetchedAt || state.fetchedAt;
          if (action.payload.deviceId) state.deviceId = action.payload.deviceId;
        }
        state.status = "succeeded";
      })
      .addCase(fetchQrContext.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || action.error.message || "Unable to load QR context";
      })
      .addCase(checkDevice.pending, (state) => {
        state.device.status = "loading";
        state.device.error = null;
      })
      .addCase(checkDevice.fulfilled, (state, action) => {
        state.device.status = "succeeded";
        state.device.data = action.payload || null;
      })
      .addCase(checkDevice.rejected, (state, action) => {
        state.device.status = "failed";
        state.device.error = (action.payload as string) || action.error.message || "Unable to verify device";
      });
  },
});

export const selectQrContext = (state: { qrContext: QrContextState }) => state.qrContext;
export const selectQrContextError = (state: { qrContext: QrContextState }) => state.qrContext.error;
export const selectDeviceId = (state: { qrContext: QrContextState }) => state.qrContext.deviceId;
export const selectCheckDeviceStatus = (state: { qrContext: QrContextState }) => state.qrContext.device.status;
export const selectCheckDeviceData = (state: { qrContext: QrContextState }) => state.qrContext.device.data;
export const selectIsReturningCustomer = (state: { qrContext: QrContextState }) =>
  Boolean(state.qrContext.device.data?.isReturning);
export const selectReturningCustomer = (state: { qrContext: QrContextState }) => {
  const raw = state.qrContext.device.data;
  if (!raw || !raw.isReturning) return null;
  const firstName = raw.firstName || "";
  const lastName = raw.lastName || "";
  return {
    customerId: raw.customerId || null,
    firstName,
    lastName,
    guestName: [firstName, lastName].filter(Boolean).join(" ").trim() || null,
    countryCode: raw.countryCode || null,
    mobile: raw.mobile || null,
    dateOfBirth: normalizeDob(raw.dob),
  };
};
export default qrContextSlice.reducer;