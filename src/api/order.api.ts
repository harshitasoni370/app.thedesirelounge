import { apiClient } from "./axiosClient";
import { extractOrderId } from "./normalize";
import type { OrderConfirmation, PlaceOrderRequest } from "@/types/api.types";

export interface PlaceOrderResult {
  orderId: string | null;
  /** Human-readable order number (e.g. "ORD-14") — nicer to show the guest than the raw orderId GUID. */
  orderNo: string | null;
}

/**
 * POST /Cart/order
 *
 * Converts the guest's cart into a placed order. Note the request's
 * `CountryCode` field is capitalized exactly like this on the wire —
 * see PlaceOrderRequest in api.types.ts. Payload matches the Postman
 * collection exactly — does NOT include companyId/branchId or session data.
 * Confirmed response: { data: { orderId, orderNo } }.
 */
export async function placeOrder(payload: PlaceOrderRequest): Promise<PlaceOrderResult> {
  const res = await apiClient.post("/Order/order", payload);
  const data = (res.data as { data?: { orderId?: string; orderNo?: string } } | null)?.data;
  return {
    orderId: data?.orderId ?? extractOrderId(res.data),
    orderNo: data?.orderNo ?? null,
  };
}

/**
 * GET /Order/getOrderConfirmationID?orderId=...
 *
 * NOT wrapped in the usual { id, status, message, type, data } envelope
 * that every other endpoint here uses — this one returns the order
 * details and its line items directly at the top level:
 * { order: { orderId, orderNo, tableNo, ... }, items: [{ itemName, quantity, ... }] }
 */
export async function getOrderConfirmation(orderId: string): Promise<OrderConfirmation | null> {
  const res = await apiClient.get("/Order/getOrderConfirmationID", { params: { orderId } });
  const payload = res.data as OrderConfirmation | null;
  if (!payload?.order) return null;
  return { order: payload.order, items: payload.items ?? [] };
}