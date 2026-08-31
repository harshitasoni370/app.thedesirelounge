import { configureStore } from "@reduxjs/toolkit";
import qrContextReducer from "@/store/slices/qrContextSlice";

export const store = configureStore({
  reducer: {
    qrContext: qrContextReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
