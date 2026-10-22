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
import { URLS } from "@/config/urls";
import { setTableSessionId } from "@/api/axiosClient";
import { createTableSession } from "@/api/tableSession.api";
import { getOrCreateDeviceId } from "@/utils/deviceId";
import { getImageUrl } from "@/utils/imageUrl";

const SESSION_KEY = "ff_session_v1";
const LOCAL_WEBSITE_DOMAIN_KEY = "ff_local_website_domain";

interface WebsiteConfig {
  websiteUrlId: string | null;
  companyId: string;
  companyName: string | null;
  branchId: string;
  branchName: string | null;
  domain: string | null;
  digitalLoungeUrl: string | null;
  appType: string | null;
  siteName: string | null;
  logoUrl: string | null;
  themeJson: string | null;
  countryCode: string | null;
  phone: string | null;
  address: string | null;
  timezone: string | null;
  raw: unknown;
}

type WebsiteConfigStatus = "loading" | "succeeded" | "failed";

function readConfigValue(value: unknown, keys: string[]): string | null {
  if (!value || typeof value !== "object") return null;
  const wanted = new Set(keys.map((key) => key.toLowerCase()));

  for (const [key, child] of Object.entries(value)) {
    if (wanted.has(key.toLowerCase()) && (typeof child === "string" || typeof child === "number")) {
      return String(child);
    }
  }
  for (const child of Object.values(value)) {
    const nested = readConfigValue(child, keys);
    if (nested) return nested;
  }
  return null;
}

function getDigitalLoungeUrl(
  domainsJson: string | null,
  currentDomain: string | null,
  currentAppType: string | null
): string | null {
  if (!domainsJson || !currentDomain) return null;

  let entries: unknown;
  try {
    entries = JSON.parse(domainsJson) as unknown;
  } catch (error) {
    console.error("Could not parse domainsJson from WebsiteUrl/by-domain", error);
    return null;
  }
  if (!Array.isArray(entries)) {
    console.error("domainsJson from WebsiteUrl/by-domain must be a JSON array");
    return null;
  }

  const normalizeHost = (value: string): string | null => {
    try {
      return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
        .hostname.toLowerCase();
    } catch {
      return null;
    }
  };

  const currentHost = normalizeHost(currentDomain);
  if (!currentHost) return null;
  const isDigitalLounge = currentAppType?.toUpperCase() === "DL";
  const loungeHost = isDigitalLounge
    ? currentHost
    : currentHost.startsWith("app.")
      ? `dl.${currentHost.slice("app.".length)}`
      : currentHost.startsWith("app-")
        ? `dl-${currentHost.slice("app-".length)}`
        : null;
  if (!loungeHost) {
    console.error(`Could not determine the Digital Lounge domain for ${currentDomain}`);
    return null;
  }

  const loungeEntry = entries.find((entry): entry is Record<string, unknown> => {
    if (!entry || typeof entry !== "object") return false;
    const appType = entry.appType;
    const domain = entry.domain;
    return (
      typeof appType === "string" &&
      appType.toUpperCase() === "DL" &&
      typeof domain === "string" &&
      normalizeHost(domain) === loungeHost
    );
  });
  if (!loungeEntry) return null;

  const target = typeof loungeEntry.url === "string" ? loungeEntry.url : String(loungeEntry.domain);
  try {
    const url = new URL(/^https?:\/\//i.test(target) ? target : `https://${target}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function readSearchParam(params: URLSearchParams, key: string): string | null {
  for (const [paramKey, value] of params.entries()) {
    if (paramKey.toLowerCase() === key.toLowerCase() && value.trim()) return value.trim();
  }
  return null;
}

interface SessionContextValue {
  session: DiningSession;
  isReady: boolean;
  /** True once the current domain (or QR context) supplies tenant IDs. */
  hasSession: boolean;
  /** Saves the current tenant session when the guest enters the menu. */
  captureSession: () => boolean;
  websiteConfig: WebsiteConfig | null;
  websiteConfigStatus: WebsiteConfigStatus;
  websiteConfigError: string | null;
  setTableNumber: (table: string) => void;
  clearSession: () => void;
  deviceId: string | null;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

/**
 * Direct visits resolve tenant IDs from WebsiteUrl/by-domain. QR context
 * continues to supply its own tenant and table values when present.
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
  const hasQrUrl = Boolean(readSearchParam(urlParams, "type") || readSearchParam(urlParams, "tableCode")) ||
    hasForwardedContext;
  const localDomainOverrideParam = import.meta.env.DEV
    ? urlParams.get("websiteDomain")?.trim()
    : null;
  const localDomainOverride =
    localDomainOverrideParam ||
    (import.meta.env.DEV ? sessionStorage.getItem(LOCAL_WEBSITE_DOMAIN_KEY) : null);
  const domain =
    localDomainOverride ||
    import.meta.env.VITE_WEBSITE_DOMAIN?.trim() ||
    window.location.hostname;
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig | null>(null);
  const [websiteConfigStatus, setWebsiteConfigStatus] = useState<WebsiteConfigStatus>("loading");
  const [websiteConfigError, setWebsiteConfigError] = useState<string | null>(null);
  const persistedSession = readLocal(SESSION_KEY, EMPTY_SESSION);

  useEffect(() => {
    if (localDomainOverrideParam) {
      sessionStorage.setItem(LOCAL_WEBSITE_DOMAIN_KEY, localDomainOverrideParam);
    }
    const controller = new AbortController();
    setWebsiteConfig(null);
    setWebsiteConfigStatus("loading");
    setWebsiteConfigError(null);

    fetch(`${URLS.api.websiteByDomain}?domain=${encodeURIComponent(domain)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Website configuration request failed (${response.status})`);
        }
        return response.json() as Promise<unknown>;
      })
      .then((payload) => {
        const appDomain = readConfigValue(payload, ["domain"]);
        const appType = readConfigValue(payload, ["appType"]);
        const digitalLoungeUrl = getDigitalLoungeUrl(
          readConfigValue(payload, ["domainsJson", "domainJson"]),
          appDomain,
          appType
        );
        if (!digitalLoungeUrl) {
          console.error(`Website configuration for ${domain} has no matching Digital Lounge domain`);
        }
        const config: WebsiteConfig = {
          websiteUrlId: readConfigValue(payload, ["websiteUrlId", "uidWebsiteUrlId"]),
          companyId: readConfigValue(payload, ["companyId", "uidCompanyId", "companyID"]) || "",
          companyName: readConfigValue(payload, ["companyName", "strCompanyName"]),
          branchId: readConfigValue(payload, ["branchId", "uidBranchId", "branchID"]) || "",
          branchName: readConfigValue(payload, ["branchName", "strBranchName"]),
          domain: appDomain,
          digitalLoungeUrl,
          appType,
          siteName: readConfigValue(payload, ["siteName", "websiteName", "strSiteName"]),
          logoUrl: readConfigValue(payload, ["logoUrl", "logo", "strLogoUrl"]),
          themeJson: readConfigValue(payload, ["themeJson"]),
          countryCode: readConfigValue(payload, ["countryCode", "CountryCode"]),
          phone: readConfigValue(payload, ["phone", "mobile", "phoneNumber"]),
          address: readConfigValue(payload, ["address"]),
          timezone: readConfigValue(payload, ["timezone", "timeZone"]),
          raw: payload,
        };
        if (!config.companyId || !config.branchId) {
          throw new Error(`Website configuration for ${domain} did not include company and branch IDs`);
        }
        setWebsiteConfig(config);
        setWebsiteConfigStatus("succeeded");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Could not load website configuration for ${domain}`, error);
        setWebsiteConfigError(message);
        setWebsiteConfigStatus("failed");
      });

    return () => controller.abort();
  }, [domain, localDomainOverrideParam]);

  useEffect(() => {
    if (!websiteConfig) return;
    const siteName = websiteConfig.siteName || websiteConfig.companyName;
    if (siteName) document.title = siteName;

    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const logoUrl = websiteConfig.logoUrl ? getImageUrl(websiteConfig.logoUrl) : undefined;
    if (favicon && logoUrl) favicon.href = logoUrl;

    const description = [siteName, websiteConfig.branchName, websiteConfig.address]
      .filter(Boolean)
      .join(" - ");
    const descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (descriptionTag && description) descriptionTag.content = description;
  }, [websiteConfig]);

  const isDirectEntry =
    !hasQrUrl &&
    persistedSession.source !== "qr" &&
    Boolean((websiteConfig?.companyId && websiteConfig.branchId) || (companyId && branchId));
  const buildDirectSession = (): DiningSession => ({
    ...EMPTY_SESSION,
    companyId: websiteConfig?.companyId || companyId || "",
    companyName: websiteConfig?.companyName || resolveParam(urlParams, "companyName"),
    branchId: websiteConfig?.branchId || branchId || "",
    branchName: websiteConfig?.branchName || resolveParam(urlParams, "branchName"),
    source: "direct",
    capturedFrom: window.location.href,
  });
  const [session, setSession] = useState<DiningSession>(() => {
    if (isDirectEntry) return buildDirectSession();
    if (!hasForwardedContext) return persistedSession;
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
    if (!readSearchParam(urlParams, "domain") && websiteConfigStatus === "loading") return;
    dispatch(fetchQrContext({ search: location.search, domain: websiteConfig?.domain || domain }));
  }, [
    branchId,
    companyId,
    dispatch,
    hasForwardedContext,
    hasQrUrl,
    isDirectEntry,
    location.search,
    sessionId,
    tableId,
    websiteConfig,
    websiteConfigStatus,
    domain,
  ]);

  // QR flow me companyId URL me nahi hota (sirf type/location/name aata hai) ya
  // /cart, /checkout jaise pages pe URL params hat jaate hain. Isliye QR ke liye
  // session.companyId pe fallback. Direct flow ka behaviour same rakha hai
  // (sirf URL ka companyId).
  const checkDeviceCompanyId = companyId || (session.source === "qr" ? session.companyId : null);

  useEffect(() => {
    if (!deviceId || !checkDeviceCompanyId) return;
    if (qrContext.device.status === "idle") {
      dispatch(checkDevice({ deviceId, companyId: checkDeviceCompanyId }));
    }
  }, [checkDeviceCompanyId, deviceId, dispatch, qrContext.device.status]);

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
    setTableSessionId(next.source === "qr" ? next.sessionId : null);
    setSession(next);
  };

  const captureSession = (): boolean => {
    if (hasQrUrl) {
      return Boolean(
        (qrContext.status === "succeeded" && qrContext.data) ||
          (session.companyId && session.branchId)
      );
    }
    if (websiteConfigStatus !== "succeeded" || !websiteConfig) return false;

    const next: DiningSession = {
      ...session,
      ...STATIC_SESSION,
      companyId: websiteConfig.companyId,
      companyName: websiteConfig.companyName,
      branchId: websiteConfig.branchId,
      branchName: websiteConfig.branchName,
      source: "direct",
      updatedAt: new Date().toISOString(),
    };
    persist(next);
    return true;
  };

  const setTableNumber = (table: string) => {
    persist({ ...session, tableNumber: table, updatedAt: new Date().toISOString() });
  };

  const clearSession = () => {
    setTableSessionId(null);
    persist(EMPTY_SESSION);
  };

  const hasSession = Boolean(
    session.companyId &&
      session.branchId &&
      (hasQrUrl
        ? session.source === "qr"
        : websiteConfigStatus === "succeeded" &&
          session.companyId === websiteConfig?.companyId &&
          session.branchId === websiteConfig.branchId)
  );
  const isReady = hasQrUrl
    ? qrContext.status === "succeeded" || qrContext.status === "failed"
    : websiteConfigStatus === "failed" || (websiteConfigStatus === "succeeded" && hasSession);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      isReady,
      hasSession,
      captureSession,
      websiteConfig,
      websiteConfigStatus,
      websiteConfigError,
      setTableNumber,
      clearSession,
      deviceId,
    }),
    [session, isReady, hasSession, captureSession, websiteConfig, websiteConfigStatus, websiteConfigError, deviceId]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}