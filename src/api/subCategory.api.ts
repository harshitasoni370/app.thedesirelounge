import { apiClient } from "./axiosClient";
import { byDisplayOrder, normalizeSubCategory, unwrapToArray } from "./normalize";
import type { GetSubCategoryRequest, SubCategoryApiRecord } from "@/types/api.types";
import type { SubCategory } from "@/types/menu.types";

/**
 * POST /SubCategory/GetSubCategory
 *
 * CONFIRMED FLOW: a category's id (`uidCategoryId` from GetCategory)
 * is sent as the identifying field in this request to list that
 * category's subcategories — e.g. Food's uidCategoryId in, Food's
 * subcategories out. (The request body's field is still literally
 * named `subcategoryId` per the API contract; we're just passing the
 * category's id as its value here, per the confirmed flow.)
 */
export async function fetchSubCategoriesByCategory(branchId: string, categoryId: string): Promise<SubCategory[]> {
  const payload: GetSubCategoryRequest = {
    // categoryId: categoryId,
    // subcategoryId: null,
    categoryId,
    branchId,
    dayOfWeek: null,
    time: null,
  };
  const res = await apiClient.post("/SubCategory/GetSubCategory", payload);
  const records = unwrapToArray<SubCategoryApiRecord>(res.data);
  return byDisplayOrder(records.map((r) => normalizeSubCategory(r, categoryId)));
}

/**
 * Fetch a single subcategory by its own id. NOT currently used by any
 * page — `fetchSubCategoriesByCategory` (categoryId-scoped list) is
 * the confirmed-working call, and every page derives a subcategory's
 * name/details from that list instead. This is kept as a utility in
 * case a real "get one subcategory" filter is confirmed later, but
 * don't wire it into a page in a way that can block rendering if it
 * fails — sending `categoryId: null` here is unconfirmed and may
 * error/return empty depending on the live API's validation.
 */
export async function fetchSubCategoryById(branchId: string, subcategoryId: string): Promise<SubCategory | null> {
  const payload: GetSubCategoryRequest = {
    categoryId: null,
    subcategoryId,
    branchId,
    dayOfWeek: null,
    time: null,
  };
  const res = await apiClient.post("/SubCategory/GetSubCategory", payload);
  const records = unwrapToArray<SubCategoryApiRecord>(res.data);
  return records.length ? normalizeSubCategory(records[0]) : null;
}
