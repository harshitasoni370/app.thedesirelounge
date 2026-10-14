import type { DiningSession } from "@/types/session.types";

/**
 * Demo table details used on direct menu entry. Company and branch IDs
 * are resolved from WebsiteUrl/by-domain for the current app domain.
 */
export const STATIC_SESSION: Pick<DiningSession, "tableId" | "tableNumber"> = {
  tableId: "b9689df4-cb11-46f1-8207-c5fc46c22712",
  tableNumber: "1",
};
