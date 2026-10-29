export interface CartItem {
  /** The menu item's own id — used throughout the UI (ProductCard, CartItemRow) as the line's identity. */
  id: string;
  /** The menu item's API ID; differs from `id` when a size variant is selected. */
  menuItemId?: string;
  variant?: "Half" | "Full";
  name: string;
  price: number;
  image: string | null;
  description?: string;
  veg: boolean;
  qty: number;
  /**
   * The server-side cart line's own id (from Cart/addcart), needed to
   * call RemoveCartitem/updatequantity for this line. Undefined until
   * the first successful AddCart call for this item (e.g. if the API
   * call is still in flight, or failed and we're running on the local
   * optimistic copy only).
   */
  cartItemId?: string;
}

export type GuestType = "new" | "returning";

export interface CheckoutInfo {
  guestType: GuestType;
  name?: string;
  countryCode: string;
  phone: string;
  people?: string;
  table: string;
  otpVerified?: boolean;
  orderType: "dine-in";
  payment: "cod";
  dob?: string;
  deviceId?: string;
}

export interface PlacedOrder {
  id: string;
  createdAt: string;
  count: number;
  total: number;
  payment: string;
  orderType: string;
  items: CartItem[];
  customer: CheckoutInfo;
  companyId: string | null;
  branchId: string | null;
  tableNumber: string | null;
  /** Set once Cart/order succeeds — the backend's real order id (falls back to the locally generated `id` above if the API call failed). */
  orderId?: string | null;
  /** Human-readable order number from the backend (e.g. "ORD-14"). */
  orderNo?: string | null;
  customerId?: string | null;
  cartId?: string | null;
}