import { apiClient } from "./axiosClient";
import type {
  CustomerRecord,
  GetCustomerByMobileRequest,
} from "@/types/api.types";

function normalizeDob(
  raw: string | null | undefined
): string | undefined {
  if (!raw) return undefined;

  const s = String(raw).trim();

  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);

  return m ? m[1] : s.split(" ")[0] || undefined;
}

export interface CustomerLookupResult {
  isReturning: boolean;
  customerId?: string | null;
  firstName: string;
  lastName: string;
  countryCode?: string | null;
  mobile?: string | null;
  dob?: string;
  guestCount?: number;
}

/**
 * POST /Customer/getcustomerbymobile
 *
 * Looks up a returning guest by mobile number so Cart/order can be
 * called with their real name instead of a placeholder.
 *
 * Used by the "Returning Guest" tab on the checkout page.
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

  const res = await apiClient.post(
    "/Customer/getcustomerbymobile",
    payload
  );

  const raw = res.data as Record<string, unknown> | null;

  if (!raw) {
    return null;
  }

  if (raw.status === false) {
    return null;
  }

  const record = (raw.data ?? raw) as
    | CustomerRecord
    | null
    | undefined;

  if (
    !record ||
    typeof record !== "object" ||
    Object.keys(record).length === 0
  ) {
    return null;
  }

  const fullName = String(
    record.firstName ??
      record.name ??
      record.fullName ??
      ""
  ).trim();

  const [guessedFirst, ...guessedRest] = fullName
    .split(/\s+/)
    .filter(Boolean);

  // IMPORTANT:
  // Declare anyRecord BEFORE using it.
  const anyRecord = record as Record<string, unknown>;

  return {
    // This API is specifically used for returning-customer lookup.
    isReturning: true,

    customerId:
      typeof anyRecord.customerId === "string"
        ? anyRecord.customerId
        : typeof anyRecord.uidCustomerId === "string"
          ? anyRecord.uidCustomerId
          : typeof anyRecord.id === "string"
            ? anyRecord.id
            : null,

    firstName: String(
      record.firstName ??
        guessedFirst ??
        "Guest"
    ),

    lastName: String(
      record.lastName ??
        guessedRest.join(" ") ??
        ""
    ),

    countryCode:
      typeof anyRecord.countryCode === "string"
        ? anyRecord.countryCode
        : null,

    mobile:
      typeof anyRecord.mobile === "string"
        ? anyRecord.mobile
        : null,

    dob: normalizeDob(
      record.dob
        ? String(record.dob)
        : undefined
    ),

    guestCount: record.guestCount
      ? Number(record.guestCount)
      : undefined,
  };
}