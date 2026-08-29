import { apiClient } from "./axiosClient";
import { byDisplayOrder, normalizeCategory, unwrapToArray } from "./normalize";
import type { CategoryApiRecord, GetCategoryRequest } from "@/types/api.types";
import type { Category } from "@/types/menu.types";

/**
 * POST /Category/GetCategory
 *
 * Confirmed: this endpoint always returns the FULL list of categories
 * for a company/branch — there's no "single category by id" filter on
 * it (categoryId is not a request field; companyId + branchId are).
 * Confirmed real response shape:
 *   [{ uidCategoryId, strCategoryName, intDisplayOrder, imagePath }, ...]
 */
export async function fetchCategories(branchId: string, companyId: string | null): Promise<Category[]> {
  const payload: GetCategoryRequest = {
    companyId,
    branchId,
    dayOfWeek: null,
    time: null,
  };
  const res = await apiClient.post("/Category/GetCategory", payload);
  const records = unwrapToArray<CategoryApiRecord>(res.data);
  return byDisplayOrder(records.map(normalizeCategory));
}

/**
 * There's no dedicated "get one category" endpoint (see above), so
 * this just fetches the full list and picks the one that matches —
 * one extra network call, but it always agrees with what the list
 * page shows and doesn't depend on an unconfirmed filter param.
 */
export async function fetchCategoryById(
  branchId: string,
  companyId: string | null,
  categoryId: string
): Promise<Category | null> {
  const categories = await fetchCategories(branchId, companyId);
  return categories.find((c) => c.id === categoryId) ?? null;
}
