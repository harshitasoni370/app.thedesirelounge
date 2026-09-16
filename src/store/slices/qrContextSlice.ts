import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { QR_CONTEXT_PARAMS, QR_CONTEXT_STORAGE_KEY, URLS } from "@/config/urls";

export interface QrContextState {
  params: Record<string, string>;
  data: unknown;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  fetchedAt: string | null;
}

function readPersistedContext(): Partial<QrContextState> | null {
  try {
    return JSON.parse(sessionStorage.getItem(QR_CONTEXT_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

export const fetchQrContext = createAsyncThunk(
  "qrContext/fetch",
  async (search: string, { signal, rejectWithValue }) => {
    const searchParams = new URLSearchParams(search);
    const params = Object.fromEntries(searchParams.entries());
    const readParam = (...keys: string[]) => keys.some((key) => Boolean(params[key]));
    const hasForwardedContext =
      readParam("companyId", "companyID", "uidCompanyId") &&
      readParam("branchId", "branchID", "uidBranchId") &&
      (readParam("tableId", "tableID", "uidTableId") || readParam("sessionId", "tableSessionId", "Table-Session-Id"));
    if (!QR_CONTEXT_PARAMS.some((key) => params[key]) && !hasForwardedContext) return null;

    const pending = { params, data: null, fetchedAt: null };
    sessionStorage.setItem(QR_CONTEXT_STORAGE_KEY, JSON.stringify(pending));

    // The lounge site forwards the resolved QR response to this app. Use it
    // directly instead of sending response fields back to the QR endpoint.
    if (hasForwardedContext) {
      const data = Object.fromEntries(
        [
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
        ]
          .filter((key) => params[key])
          .map((key) => [key, params[key]])
      );
      const context = { params, data, fetchedAt: new Date().toISOString() };
      sessionStorage.setItem(QR_CONTEXT_STORAGE_KEY, JSON.stringify(context));
      return context;
    }

    try {
      const response = await axios.get(URLS.api.qrContext, {
        params: searchParams,
        signal,
      });
      const context = { params, data: response.data, fetchedAt: new Date().toISOString() };
      sessionStorage.setItem(QR_CONTEXT_STORAGE_KEY, JSON.stringify(context));
      return context;
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      return rejectWithValue(axios.isAxiosError(error) ? error.message : "Unable to load QR context");
    }
  }
);

const persisted = readPersistedContext();
const initialState: QrContextState = {
  params: persisted?.params || {},
  data: persisted?.data || null,
  status: persisted?.data ? "succeeded" : "idle",
  error: null,
  fetchedAt: persisted?.fetchedAt || null,
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
          state.params = action.payload.params;
          state.data = action.payload.data;
          state.fetchedAt = action.payload.fetchedAt;
        }
        state.status = "succeeded";
      })
      .addCase(fetchQrContext.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || action.error.message || "Unable to load QR context";
      });
  },
});

export const selectQrContext = (state: { qrContext: QrContextState }) => state.qrContext;
export default qrContextSlice.reducer;
