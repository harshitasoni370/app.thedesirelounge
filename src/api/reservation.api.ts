import { apiClient } from "./axiosClient";
import { unwrapToArray } from "./normalize";
import type { CreateReservationRequest, ReservationApiRecord } from "@/types/api.types";

/**
 * POST /Reservation/CraeteReservation
 * (The typo "Craete" is in the live API's own path — kept exactly as-is.)
 *
 * NOT currently called from any page — there's no reservation form in
 * the UI yet. Ready to wire up once a "Reserve a table" page/form
 * exists; the request shape below is confirmed from the Postman
 * collection.
 */
export async function createReservation(payload: CreateReservationRequest): Promise<string | null> {
  const res = await apiClient.post("/Reservation/CraeteReservation", payload);
  const records = unwrapToArray<ReservationApiRecord>(res.data);
  const raw = records[0];
  if (!raw) return null;
  const id = raw.reservationId ?? raw.uidReservationId ?? raw.id;
  return id ? String(id) : null;
}
