import { apiClient } from "./axiosClient";
import type { CustomerRecord, GetCustomerByMobileRequest } from "@/types/api.types";

export interface CustomerLookupResult {
  firstName: string;
  lastName: string;
  dob?: string;
  guestCount?: number;
}

/**
 * POST /Customer/getcustomerbymobile
 *
 * Looks up a returning guest by mobile number so Cart/order can be
 * called with their real name instead of a placeholder — used by the
 * "Returning Guest" tab on the checkout page.
 *
 * Response shape is NOT yet confirmed — this assumes the same
 * `{ id, status, message, type, data: {...} }` envelope every other
 * endpoint here uses, with `data` either holding the customer record
 * directly or null/absent when no match is found. If the real
 * response differs, this is the only place that needs updating (see
 * CustomerRecord in api.types.ts for the field-name guesses).
 *
 * Returns null when there's no matching customer (so the caller can
 * fall back to "New Here"), and rethrows on an actual network/API error.
 */
export async function getCustomerByMobile(params: {
  countryCode: string;
  mobile: string;
  companyId: string;
}): Promise<CustomerLookupResult | null> {
  const payload: GetCustomerByMobileRequest = {
    CountryCode: params.countryCode,
    mobile: params.mobile,
    companyId: params.companyId,
  };
  const res = await apiClient.post("/Customer/getcustomerbymobile", payload);

  const raw = res.data as Record<string, unknown> | null;
  if (!raw) return null;
  if (raw.status === false) return null;

  const record = (raw.data ?? raw) as CustomerRecord | null | undefined;
  if (!record || typeof record !== "object" || Object.keys(record).length === 0) return null;

  const fullName = String(record.firstName ?? record.name ?? record.fullName ?? "").trim();
  const [guessedFirst, ...guessedRest] = fullName.split(/\s+/).filter(Boolean);

  return {
    firstName: String(record.firstName ?? guessedFirst ?? "Guest"),
    lastName: String(record.lastName ?? guessedRest.join(" ") ?? ""),
    dob: record.dob ? String(record.dob) : undefined,
    guestCount: record.guestCount ? Number(record.guestCount) : undefined,
  };
}