import { apiClient } from "./axiosClient";
import { assertApiSuccess, extractOrderId } from "./normalize";
import type { OrderConfirmation, PlaceOrderRequest } from "@/types/api.types";

export interface PlaceOrderResult {
  orderId: string | null;
  /** Human-readable order number (e.g. "ORD-14") — nicer to show the guest than the raw orderId GUID. */
  orderNo: string | null;
}

function normalizeDob(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    const date = new Date(`${trimmed}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? undefined : trimmed;
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * POST /Order/order
 *
 * Converts the guest's cart into a placed order. Note the request's
 * Payload matches the checkout request contract — does NOT include
 * companyId/branchId or session data.
 * Confirmed response: { data: { orderId, orderNo } }.
 */
export async function placeOrder(payload: PlaceOrderRequest): Promise<PlaceOrderResult> {
  const { sessionId: _sessionId, dob, companyId: _companyId, branchId: _branchId, ...orderFields } = payload;
  const normalizedDob = normalizeDob(dob);
  const orderPayload: Omit<PlaceOrderRequest, "sessionId" | "companyId" | "branchId"> = normalizedDob
    ? { ...orderFields, dob: normalizedDob }
    : orderFields;
  const res = await apiClient.post("/Order/order", orderPayload);
  assertApiSuccess(res.data);
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