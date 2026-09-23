export const DEVICE_ID_STORAGE_KEY = "desire_device_id";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function generateRandomDeviceId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const rand = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");

  return `${rand(8)}-${rand(4)}-4${rand(3)}-${(
    8 + Math.floor(Math.random() * 4)
  ).toString(16)}${rand(3)}-${rand(12)}`;
}

function readCookie(name: string) {
  if (!isBrowser()) return null;
  try {
    const parts = document.cookie.split(";").map((part) => part.trim());
    const prefix = `${name}=`;
    const hit = parts.find((part) => part.startsWith(prefix));
    return hit ? decodeURIComponent(hit.slice(prefix.length)) : null;
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string) {
  if (!isBrowser()) return;
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

function readStorage(storage: Storage, key: string) {
  if (!isBrowser()) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, key: string, value: string) {
  if (!isBrowser()) return;
  try {
    storage.setItem(key, value);
  } catch {
    /* private mode / quota */
  }
}

export function readUrlDeviceId(search?: string | URLSearchParams) {
  const raw =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(
          (search || (isBrowser() ? window.location.search : "")).replace(/^\?/, ""),
        );
  return raw.get("deviceId") || raw.get("did") || null;
}

export function persistDeviceId(id: string) {
  if (!id || !isBrowser()) return;
  writeStorage(window.localStorage, DEVICE_ID_STORAGE_KEY, id);
  writeStorage(window.sessionStorage, DEVICE_ID_STORAGE_KEY, id);
  writeCookie(DEVICE_ID_STORAGE_KEY, id);
}

export function readStoredDeviceId() {
  if (!isBrowser()) return null;
  return (
    readStorage(window.localStorage, DEVICE_ID_STORAGE_KEY) ||
    readStorage(window.sessionStorage, DEVICE_ID_STORAGE_KEY) ||
    readCookie(DEVICE_ID_STORAGE_KEY)
  );
}

export function getOrCreateDeviceId(search?: string | URLSearchParams) {
  const fromUrl = readUrlDeviceId(search);
  if (fromUrl) {
    persistDeviceId(fromUrl);
    return fromUrl;
  }

  const storedId = readStoredDeviceId();
  if (storedId) {
    persistDeviceId(storedId);
    return storedId;
  }

  const newDeviceId = generateRandomDeviceId();
  persistDeviceId(newDeviceId);
  return newDeviceId;
}
