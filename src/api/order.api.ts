import { api } from "./axiosClient";
import { assertApiSuccess, extractOrderId } from "./normalize";
import type { OrderConfirmation, PlaceOrderRequest } from "@/types/api.types";

export interface PlaceOrderResult {
  orderId: string | null;
  /** Human-readable order number (e.g. "ORD-14") — nicer to show the guest than the raw orderId GUID. */
  orderNo: string | null;
}

export interface CustomerOrderItem {
  itemName: string;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
}

export interface CustomerOrder {
  orderId: string;
  orderNo: string | null;
  orderDateTime: string | null;
  tableNo: string | null;
  countryCode: string | null;
  mobile: string | null;
  subTotal: number | null;
  orderStatus: string | null;
  acceptedDateTime: string | null;
  estimatedMinutes: number | null;
  estimatedReadyDateTime: string | null;
  grandTotal: number | null;
  items: CustomerOrderItem[];
  isLocalOrder?: boolean;
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
  const res = await api({ method: "post", url: "/Order/order", data: orderPayload });
  assertApiSuccess(res.data);
  const data = (res.data as { data?: { orderId?: string; orderNo?: string } } | null)?.data;
  return {
    orderId: data?.orderId ?? extractOrderId(res.data),
    orderNo: data?.orderNo ?? null,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function getValue(record: Record<string, unknown>, ...keys: string[]): unknown {
  const wanted = new Set(keys.map((key) => key.toLowerCase()));
  const key = Object.keys(record).find((candidate) => wanted.has(candidate.toLowerCase()));
  return key ? record[key] : undefined;
}

function getString(record: Record<string, unknown>, ...keys: string[]): string | null {
  const value = getValue(record, ...keys);
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : null;
}

function getNumber(record: Record<string, unknown>, ...keys: string[]): number | null {
  const value = getValue(record, ...keys);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getCustomerOrderRecords(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.map(asRecord).filter((record): record is Record<string, unknown> => record !== null);

  const record = asRecord(payload);
  if (!record) return [];
  if (getString(record, "orderId", "uidOrderId", "orderNo", "orderNumber")) return [record];

  for (const key of ["orders", "customerOrders", "orderList", "list", "records", "data", "result", "table"]) {
    const nested = getValue(record, key);
    if (Array.isArray(nested)) {
      return nested.map(asRecord).filter((item): item is Record<string, unknown> => item !== null);
    }
    if (nested && typeof nested === "object") {
      const nestedRecords = getCustomerOrderRecords(nested);
      if (nestedRecords.length) return nestedRecords;
    }
  }
  return [];
}

function normalizeCustomerOrder(record: Record<string, unknown>): CustomerOrder | null {
  const nestedOrder = asRecord(getValue(record, "order"));
  const order = nestedOrder ? { ...record, ...nestedOrder } : record;
  const orderId = getString(order, "orderId", "uidOrderId", "id", "orderID");
  if (!orderId) return null;

  const rawItems = getValue(record, "items", "orderItems", "itemDetails", "orderDetails");
  const items = Array.isArray(rawItems)
    ? rawItems.flatMap((rawItem): CustomerOrderItem[] => {
        const item = asRecord(rawItem);
        if (!item) return [];
        const itemName = getString(item, "itemName", "productName", "name");
        if (!itemName) return [];
        return [{
          itemName,
          quantity: getNumber(item, "quantity", "qty") ?? 1,
          unitPrice: getNumber(item, "unitPrice", "price"),
          totalPrice: getNumber(item, "totalPrice", "lineTotal", "total"),
        }];
      })
    : [];

  return {
    orderId,
    orderNo: getString(order, "orderNo", "orderNumber", "orderCode"),
    orderDateTime: getString(order, "orderDateTime", "createdDateTime", "createdAt", "orderDate", "dateTime"),
    tableNo: getString(order, "tableNo", "tableNumber", "tableName"),
    countryCode: getString(order, "countryCode"),
    mobile: getString(order, "mobile", "phone"),
    subTotal: getNumber(order, "subTotal", "orderTotal", "totalAmount", "amount"),
    orderStatus: getString(order, "orderStatus", "status"),
    acceptedDateTime: getString(order, "acceptedDateTime", "acceptedTime", "acceptedAt"),
    estimatedMinutes: getNumber(order, "estimatedMinutes", "prepMinutes", "preparationMinutes"),
    estimatedReadyDateTime: getString(order, "estimatedReadyDateTime", "readyTime", "estimatedReadyAt", "readyAt"),
    grandTotal: getNumber(order, "grandTotal"),
    items,
  };
}

/** GET /Order/GetCustomerOrders?companyId=...&customerId=...&all=... */
export async function getCustomerOrders(
  companyId: string,
  customerId: string,
  all: boolean
): Promise<CustomerOrder[]> {
  const res = await api({
    method: "get",
    url: "/Order/GetCustomerOrders",
    params: { companyId, customerId, all },
  });
  assertApiSuccess(res.data);
  return getCustomerOrderRecords(res.data)
    .map(normalizeCustomerOrder)
    .filter((order): order is CustomerOrder => order !== null);
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
  const res = await api({ method: "get", url: "/Order/getOrderConfirmationID", params: { orderId } });
  const payload = res.data as OrderConfirmation | null;
  if (!payload?.order) return null;
  return { order: payload.order, items: payload.items ?? [] };
}