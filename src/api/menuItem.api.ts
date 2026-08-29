import { apiClient } from "./axiosClient";
import { normalizeMenuItem, unwrapToArray } from "./normalize";
import type { GetMenuItemRequest, MenuItemApiRecord } from "@/types/api.types";
import type { MenuItem } from "@/types/menu.types";

/**
 * POST /MenuItem/GetMenuItem
 *
 * `dayOfWeek` / `time` let the API hide items that aren't being
 * served right now (e.g. breakfast-only dishes). Pass the current
 * day/time to get "what's available now", or null/null to get
 * everything regardless of availability window.
 */
export async function fetchMenuItems(
  branchId: string,
  subcategoryId: string,
  options?: { dayOfWeek?: number | null; time?: string | null }
): Promise<MenuItem[]> {
  const payload: GetMenuItemRequest = {
    subcategoryId,
    branchId,
    dayOfWeek: options?.dayOfWeek ?? null,
    time: options?.time ?? null,
  };
  const res = await apiClient.post("/MenuItem/GetMenuItem", payload);
  const records = unwrapToArray<MenuItemApiRecord>(res.data);
  return records.map((r) =>
    normalizeMenuItem({ ...r, uidSubCategoryId: r.uidSubCategoryId ?? r.subcategoryId ?? subcategoryId })
  );
}
