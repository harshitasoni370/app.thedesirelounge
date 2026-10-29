import type {
  ApiEnvelope,
  CartApiRecord,
  CartItemApiRecord,
  CategoryApiRecord,
  MenuItemApiRecord,
  OrderApiRecord,
  SubCategoryApiRecord,
} from "@/types/api.types";
import type { Category, MenuItem, SubCategory } from "@/types/menu.types";
import type { CartItem } from "@/types/cart.types";

/**
 * Unwraps a response body that may be:
 *  - the array/object itself
 *  - { data: ... }
 *  - { result: ... }
 * and always returns an array, whether the API sent back a single
 * record or a list.
 */
export function unwrapToArray<T>(payload: unknown): T[] {
  if (payload == null) return [];

  const tryExtract = (node: unknown): unknown[] | undefined => {
    if (node == null) return undefined;
    if (Array.isArray(node)) return node;
    if (typeof node !== "object") return undefined;
    const obj = node as Record<string, unknown>;
    const directKeys = ["data", "result", "Table", "table", "Tables", "tables", "items", "Items", "list", "List"];
    for (const k of directKeys) {
      if (k in obj && Array.isArray(obj[k])) return obj[k] as unknown[];
    }
    for (const k of directKeys) {
      if (k in obj && typeof obj[k] === "object" && obj[k] !== null) {
        const nested = tryExtract(obj[k]);
        if (nested) return nested;
      }
    }
    return undefined;
  };

  const extracted = tryExtract(payload);
  if (extracted) return extracted as T[];

  if (typeof payload === "object") return [payload as T];
  return [];
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "string" ? parseFloat(value) : (value as number);
  return Number.isFinite(n) ? (n as number) : fallback;
}

/**
 * Category — field names confirmed against a real GetCategory response:
 * { uidCategoryId, strCategoryName, intDisplayOrder, imagePath }
 */
export function normalizeCategory(raw: CategoryApiRecord): Category {
  const rawSubs = raw.subCategories ?? raw.subcategories ?? [];
  const id = String(raw.uidCategoryId ?? raw.id ?? raw.categoryId ?? "");
  return {
    id,
    name: String(raw.strCategoryName ?? raw.name ?? raw.categoryName ?? "Untitled"),
    description: String(raw.description ?? ""),
    blurb: String(raw.description ?? ""),
    icon: String(raw.icon ?? "fumes-specials"),
    image: (raw.imagePath as string) ?? (raw.image as string) ?? (raw.imageUrl as string) ?? null,
    sortOrder: toNumber(raw.intDisplayOrder, 0),
    subCategories: rawSubs.map((s) => normalizeSubCategory(s, id)),
  };
}

export function normalizeSubCategory(raw: SubCategoryApiRecord, fallbackCategoryId = ""): SubCategory {
  return {
    id: String(raw.uidSubCategoryId ?? raw.id ?? raw.subCategoryId ?? raw.subcategoryId ?? ""),
    categoryId: String(raw.uidCategoryId ?? raw.categoryId ?? fallbackCategoryId ?? ""),
    name: String(raw.strSubCategoryName ?? raw.name ?? raw.subCategoryName ?? "Untitled"),
    description: String(raw.description ?? ""),
    blurb: String(raw.description ?? ""),
    icon: String(raw.icon ?? "fumes-specials"),
    image: (raw.imagePath as string) ?? (raw.image as string) ?? (raw.imageUrl as string) ?? null,
    sortOrder: toNumber(raw.intDisplayOrder, 0),
  };
}

function isTruthy(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return Boolean(value);
}

/** true only for an explicit veg tag ("Veg", "Vegetarian", "V") — never for "Non Veg"/"Non-Veg"/"NonVeg". */
function isVegTag(tag: unknown): boolean {
  const s = String(tag).trim().toLowerCase();
  if (/non[\s-]?veg/.test(s)) return false;
  return s === "veg" || s === "vegetarian" || s === "v";
}

/** true only for an explicit non-veg tag ("Non Veg", "Non-Veg", "NonVeg", "Non-Vegetarian"). */
function isNonVegTag(tag: unknown): boolean {
  return /non[\s-]?veg/.test(String(tag).trim().toLowerCase());
}

function parseVeg(raw: MenuItemApiRecord): boolean {
  // Confirmed real field: foodTypes: ["Veg"] or foodTypes: ["Non Veg"].
  const ft = raw.foodTypes ?? raw.foodtypes ?? raw.FoodTypes ?? raw.food_type;
  if (Array.isArray(ft) && ft.length > 0) {
    // An explicit "Non Veg" tag always wins, even if another tag is present.
    if (ft.some(isNonVegTag)) return false;
    return ft.some(isVegTag);
  }
  if (typeof raw.foodType === "string" || typeof raw.FoodType === "string") {
    const tag = raw.foodType ?? raw.FoodType;
    return isNonVegTag(tag) ? false : isVegTag(tag);
  }
  if ("blnIsVeg" in raw || "isVeg" in raw || "veg" in raw) {
    return isTruthy(raw.blnIsVeg ?? raw.isVeg ?? raw.veg);
  }
  return false;
}

function hasFoodType(raw: MenuItemApiRecord): boolean {
  const foodTypes = raw.foodTypes ?? raw.foodtypes ?? raw.FoodTypes ?? raw.food_type;
  if (Array.isArray(foodTypes)) return foodTypes.length > 0;
  if (typeof raw.foodType === "string" || typeof raw.FoodType === "string") {
    return Boolean(String(raw.foodType ?? raw.FoodType).trim());
  }
  return "blnIsVeg" in raw || "isVeg" in raw || "veg" in raw;
}

export function normalizeMenuItem(raw: MenuItemApiRecord): MenuItem {
  const rawPrice =
    raw.currentPrice ?? raw.basePrice ?? raw.salePrice ?? raw.sellingPrice ?? raw.decPrice ?? raw.price ?? raw.rate ?? raw.mrp ?? 0;
  const halfPrice = raw.halfPrice == null ? null : toNumber(raw.halfPrice, 0);
  const fullPrice = raw.fullPrice == null ? null : toNumber(raw.fullPrice, 0);
  return {
    id: String(raw.uidMenuItemId ?? raw.id ?? raw.menuItemId ?? raw.itemId ?? ""),
    subcategoryId: String(raw.uidSubCategoryId ?? raw.subcategoryId ?? ""),
    name: String(raw.strItemName ?? raw.itemName ?? raw.name ?? "Untitled"),
    description: String(raw.description ?? raw.itemDescription ?? raw.shortDescription ?? ""),
    price: toNumber(rawPrice, 0),
    halfPrice,
    fullPrice,
    image: (raw.imagePath as string) ?? (raw.image as string) ?? (raw.imageUrl as string) ?? null,
    veg: parseVeg(raw),
    hasFoodType: hasFoodType(raw),
  };
}

/** Sorts by the API's intDisplayOrder (falls back to input order for ties/missing values). */
export function byDisplayOrder<T extends { sortOrder?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}
/* --------------------------- Cart / Order ----------------------------- */

/**
 * Every Cart/Order response on this backend uses the same envelope:
 * { id, status, message, type, data }. HTTP 200 alone doesn't mean the
 * operation succeeded — `status: false` is how this API reports a
 * business-logic failure (e.g. "item already removed"). Call this on
 * every cart/order response so those failures throw with the API's own
 * message instead of being silently treated as success.
 */
export function assertApiSuccess(payload: unknown): void {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const obj = payload as { status?: boolean; message?: string };
    if (obj.status === false) {
      throw new Error(obj.message || "Request failed");
    }
  }
}

/**
 * Pulls an order id out of whatever shape Cart/order responds with.
 * Same `{ id, status, message, type, data: {...} }` envelope as
 * this backend commonly returns, so `data` is checked
 * directly first — the outer `id` is only used as a last resort, and
 * only when it's a real (non-zero/empty) value.
 */
export function extractOrderId(payload: unknown): string | null {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const obj = payload as OrderApiRecord & { data?: OrderApiRecord; result?: OrderApiRecord };
    const direct = obj.orderId ?? obj.uidOrderId ?? obj.data?.orderId ?? obj.data?.uidOrderId ?? obj.data?.id ?? obj.result?.orderId;
    if (direct) return String(direct);
  }

  const records = unwrapToArray<OrderApiRecord>(payload);
  const raw = records[0];
  if (!raw) return null;
  const id = raw.orderId ?? raw.uidOrderId ?? raw.id;
  return id ? String(id) : null;
}

/**
 * Pulls a cart id out of an AddCart/GetCart response. Confirmed real
 * shape wraps it inside `data`: { id, status, message, type, data:
 * { cartId, cartItemId } }, so `data.cartId`
 * is checked first. The envelope's own top-level `id` is NOT used as
 * a fallback (it's usually 0/unrelated, and `id ?? data.cartId` would
 * wrongly stop at that 0 before ever reaching the real value).
 */
export function extractCartId(payload: unknown): string | null {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const obj = payload as CartApiRecord & { data?: CartApiRecord; result?: CartApiRecord };
    const direct = obj.data?.cartId ?? obj.data?.uidCartId ?? obj.cartId ?? obj.uidCartId ?? obj.result?.cartId;
    if (direct) return String(direct);
  }
  const records = unwrapToArray<CartItemApiRecord>(payload);
  const withCartId = records.find((r) => r.cartId || r.uidCartId);
  return withCartId ? String(withCartId.cartId ?? withCartId.uidCartId) : null;
}

/**
 * Pulls the specific cart-line id out of an AddCart response: { data:
 * { cartId, cartItemId } }. Needed separately from extractCartItems
 * because AddCart's confirmed response has no `items` array — just
 * this one line's own id, for later remove/update calls.
 */
export function extractCartItemId(payload: unknown): string | null {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const obj = payload as { data?: { cartItemId?: string; uidCartItemId?: string }; cartItemId?: string; uidCartItemId?: string };
    const direct = obj.data?.cartItemId ?? obj.data?.uidCartItemId ?? obj.cartItemId ?? obj.uidCartItemId;
    if (direct) return String(direct);
  }
  return null;
}

export function normalizeCartItem(raw: CartItemApiRecord): CartItem {
  const rawPrice = raw.currentPrice ?? raw.basePrice ?? raw.unitPrice ?? raw.price ?? 0;
  const rawQty = raw.quantity ?? raw.qty ?? 1;
  return {
    id: String(raw.menuItemId ?? raw.uidMenuItemId ?? ""),
    cartItemId: raw.cartItemId ?? raw.uidCartItemId ?? raw.id ? String(raw.cartItemId ?? raw.uidCartItemId ?? raw.id) : undefined,
    name: String(raw.itemName ?? raw.strItemName ?? raw.name ?? "Untitled"),
    description: String(raw.description ?? ""),
    price: toNumber(rawPrice, 0),
    image: (raw.imagePath as string) ?? (raw.image as string) ?? null,
    veg: Array.isArray(raw.foodTypes)
      ? raw.foodTypes.some(isVegTag) && !raw.foodTypes.some(isNonVegTag)
      : isTruthy(raw.isVeg ?? raw.veg),
    qty: toNumber(rawQty, 1),
  };
}

/** Extracts the line-items array from a GetCart response, whatever envelope shape it uses. */
export function extractCartItems(payload: unknown): CartItem[] {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const obj = payload as CartApiRecord & { data?: CartApiRecord; result?: CartApiRecord };
    const list = obj.items ?? obj.cartItems ?? obj.data?.items ?? obj.data?.cartItems ?? obj.result?.items;
    if (Array.isArray(list)) return list.map(normalizeCartItem);
  }
  return unwrapToArray<CartItemApiRecord>(payload).map(normalizeCartItem);
}