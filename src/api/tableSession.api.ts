import { apiClient } from "./axiosClient";
import type { CreateTableSessionRequest } from "@/types/api.types";

export async function createTableSession(payload: CreateTableSessionRequest): Promise<string | null> {
  const res = await apiClient.post("/TableSession/CreateSession", payload);
  const data = (res.data as { data?: unknown } | null)?.data ?? res.data;
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  const sessionId = record.sessionId ?? record.uidSessionId ?? record.id;
  return sessionId ? String(sessionId) : null;
}