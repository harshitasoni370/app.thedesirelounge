import { apiClient } from "@/api/axiosClient";
import { URLS } from "@/config/urls";

export interface WaiterRequestType {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
}

const REQUEST_TYPE_HINTS: Record<string, string> = {
  "ready to order": "Food, drinks or shisha",
  "water / refill": "Drinks or ice",
  "shisha assistance": "Coals, flavour or setup",
  "request the bill": "Ready to pay",
  "clean table / ashtray": "Tidying up",
  "need assistance": "General help",
  other: "Tell us below",
};

interface WaiterRequestTypeApiRecord {
  requestTypeId?: string;
  RequestTypeId?: string;
  id?: string;
  Id?: string;
  requestType?: string;
  RequestType?: string;
  name?: string;
  Name?: string;
  description?: string;
  Description?: string;
  displayOrder?: number;
  DisplayOrder?: number;
}

function getApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  const message = record.message ?? record.Message ?? record.error ?? record.Error;
  return typeof message === "string" ? message : "";
}

function unwrapRequestTypes(payload: unknown): WaiterRequestTypeApiRecord[] {
  const layers: Record<string, unknown>[] = [];
  let current = payload;

  while (current && typeof current === "object" && !Array.isArray(current)) {
    const record = current as Record<string, unknown>;
    if (layers.includes(record)) break;
    layers.push(record);
    current = record.data ?? record.Data;
  }

  for (const layer of layers) {
    if (Array.isArray(layer)) return layer as WaiterRequestTypeApiRecord[];
    for (const key of ["data", "Data", "items", "Items", "requestTypes", "RequestTypes", "types", "Types", "result", "Result", "records", "Records"]) {
      if (Array.isArray(layer[key])) return layer[key] as WaiterRequestTypeApiRecord[];
    }
  }

  return Array.isArray(payload) ? payload as WaiterRequestTypeApiRecord[] : [];
}

function assertWaiterApiSuccess(payload: unknown): void {
  if (!payload || typeof payload !== "object") return;
  const record = payload as Record<string, unknown>;
  if (record.success === false || record.Success === false) {
    throw new Error(getApiMessage(payload) || "The waiter request could not be completed.");
  }
}

export async function fetchWaiterTypes(
  companyId: string,
  branchId: string,
  signal?: AbortSignal
): Promise<WaiterRequestType[]> {
  const response = await apiClient.get("/Waiter/Types", {
    baseURL: URLS.api.waiterBase,
    params: { companyId, branchId },
    signal,
  });
  assertWaiterApiSuccess(response.data);

  return unwrapRequestTypes(response.data)
    .map((item) => {
      const name = String(item.requestType ?? item.RequestType ?? item.name ?? item.Name ?? "");
      return {
        id: String(item.requestTypeId ?? item.RequestTypeId ?? item.id ?? item.Id ?? ""),
        name,
        description:
          String(item.description ?? item.Description ?? "") ||
          REQUEST_TYPE_HINTS[name.trim().toLowerCase()] ||
          "",
        displayOrder: Number(item.displayOrder ?? item.DisplayOrder ?? 0),
      };
    })
    .filter((item) => item.id && item.name)
    .sort((left, right) => left.displayOrder - right.displayOrder);
}

export interface CreateWaiterRequestPayload {
  companyId: string;
  branchId: string;
  tableId: string;
  requestTypeIds: string[];
  note: string;
}

export async function createWaiterRequest(payload: CreateWaiterRequestPayload): Promise<unknown> {
  const response = await apiClient.post("/Waiter/Create", payload, {
    baseURL: URLS.api.waiterBase,
  });
  assertWaiterApiSuccess(response.data);
  return response.data;
}
