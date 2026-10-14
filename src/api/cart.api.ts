import { api, getTableSessionId } from "./axiosClient";
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
 * the first call. The first request omits cartId; subsequent requests
 * send the cartId returned by the server.
 * Confirmed response shape: { id, status, message, type, data: { cartId, cartItemId } }.
 * Falls back to extractCartItems (matching this menuItemId in an
 * `items` array) only if a deployment ever returns that shape instead.
 */
export async function addCartItem(params: {
  companyId: string;
  branchId: string;
  cartId: string | null;
  menuItemId: string;
  quantity: number;
}): Promise<AddCartResult> {
  const { cartId: requestCartId, ...cartParams } = params;
  // QR flow: Table-Session-Id header jaa raha hai => cartId NAHI bhejna (server session se cart resolve karta hai).
  // Direct flow: header nahi jaata => cartId bhejna (agar pehle se hai).
  const sendsTableSession = Boolean(getTableSessionId());
  const payload: AddCartRequest =
    requestCartId && !sendsTableSession ? { ...cartParams, cartId: requestCartId } : cartParams;
  const res = await api({ method: "post", url: "/Cart/addcart", data: payload });
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
  const res = await api({ method: "delete", url: "/Cart/removeitem", data: payload });
  assertApiSuccess(res.data);
}

/** POST /Cart/updatequantity (per the Postman collection — NOT PUT) */
export async function updateCartQuantity(cartId: string, cartItemId: string, quantity: number): Promise<void> {
  const payload: UpdateCartQuantityRequest = { cartId, cartItemId, quantity };
  const res = await api({ method: "post", url: "/Cart/updatequantity", data: payload });
  assertApiSuccess(res.data);
}

/** GET /Cart/getcartitems/{cartId} — used to re-hydrate the cart on page load. */
export async function getCartItems(cartId: string, tableSessionId?: string | null): Promise<CartItem[]> {
  const res = await api({
    method: "get",
    url: `/Cart/getcartitems/${cartId}`,
    headers: tableSessionId ? { "Table-Session-Id": tableSessionId } : undefined,
  });
  assertApiSuccess(res.data);
  return extractCartItems(res.data);
}