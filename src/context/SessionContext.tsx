import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
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
 * For now, session data (companyId / branchId / tableId) is static —
 * see src/config/staticSession.ts — instead of being read from a
 * scanned QR code's URL. It is saved to localStorage only when the
 * guest taps "Explore Menu" on the home page, and persists from then
 * on (across reloads and in-app navigation) until cleared.
 *
 * When the real QR-scan flow is ready, only `captureSession()` below
 * needs to change (e.g. to read companyId/branchId/tableId from
 * `useSearchParams()` instead of STATIC_SESSION) — every other page
 * already reads session data through `useSession()` and doesn't need
 * to change.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DiningSession>(() => readLocal(SESSION_KEY, EMPTY_SESSION));

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

  const hasSession = Boolean(session.branchId);

  const value = useMemo<SessionContextValue>(
    () => ({ session, isReady: true, hasSession, captureSession, setTableNumber, clearSession }),
    [session, hasSession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
