/**
 * Types for The Desire Sheesha Lounge menu API.
 *
 * NOTE ON SHAPES:
 * The three endpoints below are consumed as POST requests with a JSON
 * body. `CategoryApiRecord` below is CONFIRMED against a real
 * `GetCategory` response:
 *
 *   [
 *     { "uidCategoryId": "...", "strCategoryName": "Food", "intDisplayOrder": 1, "imagePath": null },
 *     { "uidCategoryId": "...", "strCategoryName": "Shisha", "intDisplayOrder": 2, "imagePath": null }
 *   ]
 *
 * `SubCategoryApiRecord` / `MenuItemApiRecord` are NOT yet confirmed —
 * they follow the same `uid`/`str`/`int` naming convention as Category
 * as a best guess, with common alternates also accepted. All raw
 * responses are passed through the `normalize*` functions in
 * `src/api/normalize.ts` before the rest of the app ever touches them —
 * if the live SubCategory/MenuItem responses use different field
 * names, that file is the ONLY place you should need to edit.
 *
 * FLOW: a category's `uidCategoryId` is sent as the id in the
 * GetSubCategory request to list that category's subcategories; each
 * returned subcategory's id is then sent as `subcategoryId` in the
 * GetMenuItem request to list its items. See category.api.ts /
 * subCategory.api.ts / menuItem.api.ts.
 */

export interface DayTimeFilter {
  dayOfWeek: number | null;
  time: string | null;
}

/* ---------------------------- Category ---------------------------- */

export interface GetCategoryRequest extends DayTimeFilter {
  companyId: string | null;
  branchId: string;
}

export interface CategoryApiRecord {
  uidCategoryId: string;
  strCategoryName: string;
  intDisplayOrder?: number;
  imagePath?: string | null;
  id?: string;
  categoryId?: string;
  name?: string;
  categoryName?: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  subCategories?: SubCategoryApiRecord[];
  subcategories?: SubCategoryApiRecord[];
  [key: string]: unknown;
}

/* -------------------------- SubCategory ---------------------------- */

/**
 * The category's uidCategoryId is sent as the identifying field here
 * (per the confirmed flow) to fetch that category's subcategories.
 * For fetching a single specific subcategory by its own id, use
 * `subcategoryId` instead (and leave categoryId null).
 */
export interface GetSubCategoryRequest extends DayTimeFilter {
  categoryId: string | null;
  subcategoryId?: string | null;
  branchId: string;
}

export interface SubCategoryApiRecord {
  uidSubCategoryId?: string;
  strSubCategoryName?: string;
  intDisplayOrder?: number;
  imagePath?: string | null;
  uidCategoryId?: string;
  id?: string;
  subCategoryId?: string;
  subcategoryId?: string;
  categoryId?: string;
  name?: string;
  subCategoryName?: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  menuItems?: MenuItemApiRecord[];
  [key: string]: unknown;
}

/* ---------------------------- MenuItem ------------------------------ */

/** The subcategory's id (from GetSubCategory) is sent as `subcategoryId` here. */
export interface GetMenuItemRequest extends DayTimeFilter {
  subcategoryId: string;
  branchId: string;
}

export interface MenuItemApiRecord {
  // Best-guess field names, following the same convention:
  uidMenuItemId?: string;
  strItemName?: string;
  decPrice?: number | string;
  imagePath?: string | null;
  blnIsVeg?: boolean;
  uidSubCategoryId?: string;
  // Common fallbacks:
  id?: string;
  menuItemId?: string;
  itemId?: string;
  subcategoryId?: string;
  categoryId?: string;
  name?: string;
  itemName?: string;
  description?: string | null;
  price?: number | string;
  rate?: number | string;
  mrp?: number | string;
  image?: string | null;
  imageUrl?: string | null;
  isVeg?: boolean;
  veg?: boolean;
  isAvailable?: boolean;
  isActive?: boolean;
  [key: string]: unknown;
}

/** Generic envelope some ASP.NET style APIs wrap responses in. */
export interface ApiEnvelope<T> {
  data?: T;
  result?: T;
  isSuccess?: boolean;
  success?: boolean;
  message?: string;
  statusCode?: number;
}

/* ------------------------------ Cart --------------------------------- */

/**
 * POST /Cart/addcart — request shape matches the Postman collection
 * exactly: no session field; the cart works off companyId + branchId,
 * same as Category/SubCategory/MenuItem.
 */
export interface AddCartRequest {
  companyId: string;
  branchId: string;
  menuItemId: string;
  quantity: number;
}

/** DELETE /Cart/removeitem — confirmed request shape from Postman. */
export interface RemoveCartItemRequest {
  cartId: string;
  cartItemId: string;
}

/** POST /Cart/updatequantity — confirmed request shape from Postman. */
export interface UpdateCartQuantityRequest {
  cartId: string;
  cartItemId: string;
  quantity: number;
}

/**
 * Response shape for AddCart/updatequantity/GetCart is not confirmed.
 * Best-guess field names below, with common alternates — see
 * src/api/normalize.ts for how these are mapped to the app's CartItem.
 */
export interface CartItemApiRecord {
  cartId?: string;
  uidCartId?: string;
  cartItemId?: string;
  uidCartItemId?: string;
  id?: string;
  menuItemId?: string;
  uidMenuItemId?: string;
  itemName?: string;
  strItemName?: string;
  name?: string;
  description?: string | null;
  price?: number | string;
  currentPrice?: number | string;
  basePrice?: number | string;
  unitPrice?: number | string;
  quantity?: number | string;
  qty?: number | string;
  imagePath?: string | null;
  image?: string | null;
  foodTypes?: string[];
  isVeg?: boolean;
  veg?: boolean;
  [key: string]: unknown;
}

/** Some deployments wrap the cart's line items with the cart's own id alongside them. */
export interface CartApiRecord {
  cartId?: string;
  uidCartId?: string;
  id?: string;
  items?: CartItemApiRecord[];
  cartItems?: CartItemApiRecord[];
  [key: string]: unknown;
}

/* ------------------------------ Order -------------------------------- */

/**
 * POST /Order/order — matches the Postman collection's payload shape.
 * cartId identifies the cart being converted into an order.
 * NOTE: the API's field is capitalized "CountryCode" (not
 * "countryCode") — matched exactly here since it's a literal wire
 * field name, not a JS naming choice.
 *
 */
export interface PlaceOrderRequest {
  sessionId: string | null;
  cartId: string;
  firstName: string;
  lastName: string;
  CountryCode: string;
  mobile: string;
  dob?: string;
  guestCount: number;
  companyId: string | null;
  branchId: string | null;
}

export interface OrderApiRecord {
  orderId?: string;
  uidOrderId?: string;
  id?: string;
  orderNumber?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

/**
 * GET /Order/getOrderConfirmationID — confirmed real response shape.
 * NOT wrapped in the usual { id, status, message, type, data } envelope —
 * this one returns `{ order, items }` directly at the top level.
 */
export interface OrderDetailItemRecord {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderDetailRecord {
  orderId: string;
  orderNo?: string;
  orderDateTime?: string;
  tableNo?: string;
  countryCode?: string;
  mobile?: string;
  subTotal?: number;
  orderStatus?: string;
}

export interface OrderConfirmation {
  order: OrderDetailRecord;
  items: OrderDetailItemRecord[];
}

/* ----------------------------- Customer ------------------------------- */

/** POST /Customer/getcustomerbymobile — confirmed request shape. */
export interface GetCustomerByMobileRequest {
  CountryCode: string;
  mobile: string;
  companyId: string;
}

/**
 * Response shape not yet confirmed — best-guess field names below,
 * following the same conventions as the other endpoints (plain +
 * common alternates). Update once a real response is seen — see
 * getCustomerByMobile in customer.api.ts, the only place this is used.
 */
export interface CustomerRecord {
  firstName?: string;
  lastName?: string;
  name?: string;
  fullName?: string;
  mobile?: string;
  countryCode?: string;
  dob?: string;
  guestCount?: number;
  [key: string]: unknown;
}

/* --------------------------- Reservation ------------------------------ */

/** POST /Reservation/CraeteReservation — confirmed request shape from Postman (note the typo is in the live API path itself). */
export interface CreateReservationRequest {
  companyId: string;
  branchId: string;
  reservationCategory: string;
  guestName: string;
  mobile: string;
  dateOfBirth?: string;
  guestCount: number;
  /** ISO 8601 datetime, e.g. "2026-08-20T08:30:00Z". */
  reservationDateTime: string;
  specialRequest?: string;
  email?: string;
  reservationTitle?: string | null;
  tableId?: string;
  moduleId?: string;
  extraDetails?: Record<string, unknown> | null;
}

export interface CreateTableSessionRequest {
  companyId: string;
  branchId: string;
  tableId: string;
}

export interface ReservationApiRecord {
  reservationId?: string;
  uidReservationId?: string;
  reservationNo?: string;
  moduleId?: string;
  moduleName?: string;
  tableName?: string;
  id?: string;
  [key: string]: unknown;
}