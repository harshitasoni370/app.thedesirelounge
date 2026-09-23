import { apiClient } from "./axiosClient";
import type { CreateReservationRequest, ReservationApiRecord } from "@/types/api.types";
import { DEFAULT_COUNTRY_CODE } from "@/config/urls";

/**
 * POST /Reservation/CraeteReservation
 * (The typo "Craete" is in the live API's own path — kept exactly as-is.)
 *
 * Called by the Live Sports checkout form and returns the reservation id when
 * the API includes one in its response.
 */
export async function createReservation(
  payload: Partial<CreateReservationRequest> & {
    companyId: string;
    branchId: string;
    guestName: string;
    mobile: string;
    reservationDateTime: string;
    guestCount: number;
  },
  tableSessionId?: string | null,
  extraDeviceId?: string | null,
): Promise<ReservationApiRecord | null> {
  const normalized: CreateReservationRequest = {
    companyId: payload.companyId,
    branchId: payload.branchId,
    moduleId: payload.moduleId || "3e340f23-d842-47f0-98e8-b0d458dc22dd",
    reservationCategory: payload.reservationCategory,
    guestName: payload.guestName,
    countryCode: payload.countryCode || DEFAULT_COUNTRY_CODE,
    mobile: payload.mobile,
    email: payload.email || "",
    dateOfBirth: payload.dateOfBirth || null,
    guestCount: Number(payload.guestCount) || 1,
    reservationDateTime: payload.reservationDateTime,
    reservationTitle: payload.reservationTitle ?? null,
    ...(payload.tableId ? { tableId: payload.tableId } : {}),
    specialRequest: payload.specialRequest || "",
    extraDetails: payload.extraDetails ?? null,
    deviceId: payload.deviceId || extraDeviceId || "",
  };

  const res = await apiClient.post("/Reservation/CraeteReservation", normalized, {
    headers: tableSessionId ? { "Table-Session-Id": tableSessionId } : undefined,
  });
  const body = res.data as { data?: ReservationApiRecord; result?: ReservationApiRecord } & ReservationApiRecord;
  const record = body.data || body.result || body;
  return record && typeof record === "object" ? record : null;
}
