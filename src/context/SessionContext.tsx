import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchQrContext, selectQrContext } from "@/store/slices/qrContextSlice";
import { readLocal, writeLocal } from "@/utils/storage";
import { EMPTY_SESSION, type DiningSession } from "@/types/session.types";
import { STATIC_SESSION } from "@/config/staticSession";

const SESSION_KEY = "ff_session_v1";

interface SessionContextValue {
  session: DiningSession;
  isReady: boolean;
  /** true once we have a branchId to call the menu API with */
  hasSession: boolean;
  /** Saves the (currently static) session data. Called when the guest taps "Explore Menu". */
  captureSession: () => void;
  setTableNumber: (table: string) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

/**
 * QR context is fetched by Redux and converted into the session fields
 * consumed by the category, cart, reservation and order APIs. The static
 * values remain only as a local fallback when the home-page demo is used
 * without a QR URL.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const qrContext = useAppSelector(selectQrContext);
  const [session, setSession] = useState<DiningSession>(() => readLocal(SESSION_KEY, EMPTY_SESSION));

  const hasQrUrl = Boolean(new URLSearchParams(location.search).get("type"));

  useEffect(() => {
    if (hasQrUrl) {
      persist({ ...EMPTY_SESSION, capturedFrom: window.location.href });
    }
    dispatch(fetchQrContext(location.search));
  }, [dispatch, hasQrUrl, location.search]);

  useEffect(() => {
    if (qrContext.status !== "succeeded" || !qrContext.data) return;

    const readValue = (keys: string[]) => {
      const wanted = new Set(keys.map((key) => key.toLowerCase()));
      const visit = (value: unknown): string | null => {
        if (!value || typeof value !== "object") return null;
        for (const [key, child] of Object.entries(value)) {
          if (wanted.has(key.toLowerCase()) && (typeof child === "string" || typeof child === "number")) {
            return String(child);
          }
          const nested = visit(child);
          if (nested) return nested;
        }
        return null;
      };
      return visit(qrContext.data);
    };
    const readParam = (key: string) => qrContext.params[key] || null;

    const next: DiningSession = {
      ...session,
      companyId: readValue(["companyId", "uidCompanyId"]) || session.companyId,
      branchId: readValue(["branchId", "uidBranchId"]) || session.branchId,
      tableId: readValue(["tableId", "uidTableId"]) || session.tableId,
      tableNumber: readValue(["tableNumber", "tableNo"]) || readParam("name") || session.tableNumber,
      capturedFrom: window.location.href,
      updatedAt: new Date().toISOString(),
    };
    persist(next);
  }, [qrContext.data, qrContext.params, qrContext.status]);

  const persist = (next: DiningSession) => {
    writeLocal(SESSION_KEY, next);
    setSession(next);
  };

  const captureSession = () => {
    const next: DiningSession = {
      ...session,
      ...STATIC_SESSION,
      updatedAt: new Date().toISOString(),
    };
    persist(next);
  };

  const setTableNumber = (table: string) => {
    persist({ ...session, tableNumber: table, updatedAt: new Date().toISOString() });
  };

  const clearSession = () => {
    persist(EMPTY_SESSION);
  };

  const hasSession = Boolean(session.companyId && session.branchId);
  const isReady = !hasQrUrl || qrContext.status === "succeeded" || qrContext.status === "failed";

  const value = useMemo<SessionContextValue>(
    () => ({ session, isReady, hasSession, captureSession, setTableNumber, clearSession }),
    [session, isReady, hasSession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
