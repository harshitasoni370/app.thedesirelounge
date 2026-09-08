import { apiClient } from "./axiosClient";
import { assertApiSuccess, extractCartId, extractCartItemId, extractCartItems } from "./normalize";
import type { AddCartRequest, RemoveCartItemRequest, UpdateCartQuantityRequest } from "@/types/api.types";
import type { CartItem } from "@/types/cart.types";

export interface AddCartResult {
  cartId: string | null;
  /** The line's own id, if the API returned one for this specific item — used later for remove/update calls. */
  cartItemId: string | null;
}

/**
 * POST /Cart/addcart
 *
 * Adds one menu item to the guest's cart, creating the cart itself on
 * the first call. Payload matches the Postman collection exactly —
 * companyId, branchId, menuItemId, quantity.
 * Confirmed response shape: { id, status, message, type, data: { cartId, cartItemId } }.
 * Falls back to extractCartItems (matching this menuItemId in an
 * `items` array) only if a deployment ever returns that shape instead.
 */
export async function addCartItem(params: {
  companyId: string;
  branchId: string;
  menuItemId: string;
  quantity: number;
  tableSessionId: string | null;
}): Promise<AddCartResult> {
  const { tableSessionId, ...cartParams } = params;
  const payload: AddCartRequest = cartParams;
  const res = await apiClient.post("/Cart/addcart", payload, {
    headers: tableSessionId ? { "Table-Session-Id": tableSessionId } : undefined,
  });
  assertApiSuccess(res.data);

  const cartId = extractCartId(res.data);
  let cartItemId = extractCartItemId(res.data);
  if (!cartItemId) {
    const items = extractCartItems(res.data);
    cartItemId = items.find((i) => i.id === params.menuItemId)?.cartItemId ?? null;
  }

  return { cartId, cartItemId };
}

/** DELETE /Cart/removeitem */
export async function removeCartItem(cartId: string, cartItemId: string): Promise<void> {
  const payload: RemoveCartItemRequest = { cartId, cartItemId };
  const res = await apiClient.delete("/Cart/removeitem", { data: payload });
  assertApiSuccess(res.data);
}

/** POST /Cart/updatequantity (per the Postman collection — NOT PUT) */
export async function updateCartQuantity(cartId: string, cartItemId: string, quantity: number): Promise<void> {
  const payload: UpdateCartQuantityRequest = { cartId, cartItemId, quantity };
  const res = await apiClient.post("/Cart/updatequantity", payload);
  assertApiSuccess(res.data);
}

/** GET /Cart/getcartitems/{cartId} — used to re-hydrate the cart on page load. */
export async function getCartItems(cartId: string): Promise<CartItem[]> {
  const res = await apiClient.get(`/Cart/getcartitems/${cartId}`);
  assertApiSuccess(res.data);
  return extractCartItems(res.data);
}