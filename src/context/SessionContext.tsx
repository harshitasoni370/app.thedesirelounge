import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  checkDevice,
  fetchQrContext,
  resolveParam,
  selectDeviceId,
  selectQrContext,
} from "@/store/slices/qrContextSlice";
import { readLocal, writeLocal } from "@/utils/storage";
import { EMPTY_SESSION, type DiningSession } from "@/types/session.types";
import { STATIC_SESSION } from "@/config/staticSession";
import { createTableSession } from "@/api/tableSession.api";
import { getOrCreateDeviceId } from "@/utils/deviceId";

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
  deviceId: string | null;
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
  const storeDeviceId = useAppSelector(selectDeviceId);
  const urlParams = new URLSearchParams(location.search);
  const readUrlParam = (...keys: string[]) => {
    for (const key of keys) {
      const value = resolveParam(urlParams, key);
      if (value) return value;
    }
    return null;
  };
  const companyId = readUrlParam("companyId", "companyID", "uidCompanyId");
  const branchId = readUrlParam("branchId", "branchID", "uidBranchId");
  const tableId = readUrlParam("tableId", "tableID", "uidTableId");
  const sessionId = readUrlParam("sessionId", "tableSessionId", "Table-Session-Id");
  const deviceId = storeDeviceId || readUrlParam("deviceId");
  const hasForwardedContext = Boolean(companyId && branchId && (tableId || sessionId));
  const hasQrUrl = Boolean(urlParams.get("type")) || hasForwardedContext;
  // Website se seedha aaya (company+branch hai, par na QR type, na tableId/sessionId)
  // => direct flow: koi table session nahi, header me Table-Session-Id nahi.
  const isDirectEntry = Boolean(companyId && branchId) && !hasQrUrl;
  const buildDirectSession = (): DiningSession => ({
    ...EMPTY_SESSION,
    companyId: companyId || "",
    companyName: resolveParam(urlParams, "companyName"),
    branchId: branchId || "",
    branchName: resolveParam(urlParams, "branchName"),
    source: "direct",
    capturedFrom: window.location.href,
  });
  const [session, setSession] = useState<DiningSession>(() => {
    if (isDirectEntry) return buildDirectSession();
    if (!hasForwardedContext) return readLocal(SESSION_KEY, EMPTY_SESSION);
    return {
      ...EMPTY_SESSION,
      source: "qr",
      companyId: companyId || "",
      companyName: resolveParam(urlParams, "companyName"),
      branchId: branchId || "",
      branchName: resolveParam(urlParams, "branchName"),
      tableId: tableId || "",
      tableNumber:
        readUrlParam("tableNumber", "tableNo", "tableName", "name") || "",
      tableName: resolveParam(urlParams, "tableName"),
      sessionId: sessionId || "",
      capturedFrom: window.location.href,
    };
  });

  useEffect(() => {
    if (isDirectEntry) {
      persist(buildDirectSession());
    } else if (hasQrUrl) {
      const forwardedSession: DiningSession = {
        ...EMPTY_SESSION,
        source: "qr",
        companyId: companyId || "",
        companyName: resolveParam(urlParams, "companyName"),
        branchId: branchId || "",
        branchName: resolveParam(urlParams, "branchName"),
        tableId: tableId || "",
        tableNumber:
          readUrlParam("tableNumber", "tableNo", "tableName", "name") || "",
        tableName: resolveParam(urlParams, "tableName"),
        sessionId: sessionId || "",
        capturedFrom: window.location.href,
      };
      persist(
        hasForwardedContext
          ? forwardedSession
          : { ...EMPTY_SESSION, source: "qr", capturedFrom: window.location.href }
      );
    }
    dispatch(fetchQrContext(location.search));
  }, [branchId, companyId, dispatch, hasForwardedContext, hasQrUrl, isDirectEntry, location.search, sessionId, tableId]);

  useEffect(() => {
    if (!deviceId || !companyId) return;
    if (qrContext.device.status === "idle") {
      dispatch(checkDevice({ deviceId, companyId }));
    }
  }, [companyId, deviceId, dispatch, qrContext.device.status]);

  useEffect(() => {
    if (qrContext.status !== "succeeded" || !qrContext.data) return;
    // Direct flow me purane QR context se sessionId/tableId wapas nahi lena.
    if (!hasQrUrl && (isDirectEntry || session.source === "direct")) return;

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
    const readParam = (...keys: string[]) => {
      for (const key of keys) {
        if (qrContext.params[key]) return qrContext.params[key];
        const aliased = resolveParam(qrContext.params, key);
        if (aliased) return aliased;
      }
      return null;
    };

    const next: DiningSession = {
      ...session,
      companyId: readValue(["companyId", "uidCompanyId"]) || readParam("companyId", "uidCompanyId") || session.companyId,
      companyName: readValue(["companyName"]) || session.companyName,
      branchId: readValue(["branchId", "uidBranchId"]) || readParam("branchId", "uidBranchId") || session.branchId,
      branchName: readValue(["branchName"]) || session.branchName,
      tableId: readValue(["tableId", "uidTableId"]) || readParam("tableId", "uidTableId") || session.tableId,
      tableNumber:
        readValue(["tableNumber", "tableNo"]) ||
        readParam("tableNumber", "tableNo", "name", "tableName") ||
        session.tableNumber,
      tableName: readValue(["tableName"]) || readParam("tableName") || session.tableName,
      sessionId: readValue(["sessionId"]) || readParam("sessionId") || session.sessionId,
      source: hasQrUrl ? "qr" : session.source,
      capturedFrom: window.location.href,
      updatedAt: new Date().toISOString(),
    };
    persist(next);
  }, [qrContext.data, qrContext.params, qrContext.status]);

  useEffect(() => {
    // Direct flow me table session create nahi karni.
    if (session.source === "direct") return;
    if (session.sessionId || !session.companyId || !session.branchId || !session.tableId) return;
    let cancelled = false;

    createTableSession({
      companyId: session.companyId,
      branchId: session.branchId,
      tableId: session.tableId,
    })
      .then((newSessionId) => {
        if (cancelled || !newSessionId) return;
        persist({ ...session, sessionId: newSessionId, updatedAt: new Date().toISOString() });
      })
      .catch((error) => console.error("Could not create table session", error));

    return () => {
      cancelled = true;
    };
  }, [session]);

  const persist = (next: DiningSession) => {
    writeLocal(SESSION_KEY, next);
    setSession(next);
  };

  const captureSession = () => {
    if (qrContext.status === "succeeded" && qrContext.data) return;
    const next: DiningSession = {
      ...session,
      ...STATIC_SESSION,
      source: session.source === "qr" ? "qr" : "direct",
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
    () => ({
      session,
      isReady,
      hasSession,
      captureSession,
      setTableNumber,
      clearSession,
      deviceId,
    }),
    [session, isReady, hasSession, deviceId]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}