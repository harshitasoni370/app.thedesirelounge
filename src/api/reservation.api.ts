import { apiClient } from "./axiosClient";
import type { CreateReservationRequest, ReservationApiRecord } from "@/types/api.types";

/**
 * POST /Reservation/CraeteReservation
 * (The typo "Craete" is in the live API's own path — kept exactly as-is.)
 *
 * Called by the Live Sports checkout form and returns the reservation id when
 * the API includes one in its response.
 */
export async function createReservation(
  payload: CreateReservationRequest,
  tableSessionId?: string | null,
): Promise<ReservationApiRecord | null> {
  const res = await apiClient.post("/Reservation/CraeteReservation", payload, {
    headers: tableSessionId ? { "Table-Session-Id": tableSessionId } : undefined,
  });
  const body = res.data as { data?: ReservationApiRecord; result?: ReservationApiRecord } & ReservationApiRecord;
  const record = body.data || body.result || body;
  return record && typeof record === "object" ? record : null;
}
