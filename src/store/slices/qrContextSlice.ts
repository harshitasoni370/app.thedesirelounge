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
    if (!QR_CONTEXT_PARAMS.some((key) => params[key])) return null;

    const pending = { params, data: null, fetchedAt: null };
    sessionStorage.setItem(QR_CONTEXT_STORAGE_KEY, JSON.stringify(pending));

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
