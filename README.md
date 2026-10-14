# The Desire Sheesha Lounge — Menu (React + TypeScript)

A rebuild of the original static HTML/CSS/JS menu site as a proper
Vite + React + TypeScript app, wired up to the live
Category / SubCategory / MenuItem APIs and to the table's QR-code
session (`companyId`, `branchId`, `tableNumber`).

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit values if needed
npm run dev
```

Build for production:

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build locally
```

## Project structure

```
src/
  api/            axios client + one file per endpoint (Category, SubCategory, MenuItem)
                  + normalize.ts, which maps raw API fields -> the app's own types
  types/          api.types.ts (raw API shapes), menu.types.ts (normalized domain models),
                  cart.types.ts, session.types.ts
  context/        SessionContext (QR session), CartContext, ToastContext
  config/         urls.ts (API/URL config), staticSession.ts (demo table details)
  store/          Redux Toolkit store and QR context slice
  hooks/          useCategories, useCategoryDetail, useSubCategoryDetail, useMenuItems, useHeaderScrolled
  components/     layout/ (Header, MenuBack, SessionGate), category/, menu/, cart/, checkout/, ui/
  pages/          one component per route
  routes/         AppRoutes.tsx (React Router route table)
  utils/          format.ts, dayTime.ts, storage.ts, icons.ts
  styles/         style.css (ported ~1:1 from the original design), utilities.css (small
                  Tailwind-utility replacements — the original only used a handful, so a
                  full Tailwind build wasn't pulled in)
```

Path alias `@/*` → `src/*` is configured in both `tsconfig.app.json` and `vite.config.ts`.

## How the QR session works

Guests scan a URL such as:
`https://dl.thedesirelounge.com?type=Table&location=OudMetha&name=TBL01&resturant=Desire`.
The Redux `qrContext` thunk sends all query parameters to
`VITE_QR_CONTEXT_API_URL` and saves the complete `{ params, data, fetchedAt }`
record in `sessionStorage` under `desire_qr_context`.

Flow:

1. `SessionContext` reads the Redux response and maps `companyId`, `branchId`,
  `tableId` and `tableNumber` into `localStorage` (`ff_session_v1`).
2. Categories, cart, reservation and order API calls read these IDs through
  `useSession()`. The placed order also keeps the IDs for confirmation/debugging.
3. From then on (until cleared or the browser storage is wiped):
   - `branchId` is used for every Category/SubCategory/MenuItem/Cart API call.
   - `tableNumber` pre-fills the Table Number field at checkout.
   - `companyId`, `branchId` and the final table number are all stored
     on the placed order (`PlacedOrder` in `src/types/cart.types.ts`).
4. On direct app-domain visits, the app looks up `WebsiteUrl/by-domain`
   using the current hostname and saves the returned company/branch IDs.
   Its website identity (site name, logo, branch, contact details, country
   code, address, timezone, theme JSON and remaining response fields) is
   shared with the UI; branding, document metadata, checkout defaults and
   contact links use the resolved domain configuration.
   Menu API requests wait until those IDs match the current domain, so a
   session saved for a different restaurant is never reused accidentally.
5. Pages that need a branch to function (`Categories`, category landing,
   `Menu`) are wrapped in `<SessionGate>`. If the domain lookup fails, the
   app shows an error instead of silently calling the menu APIs with stale IDs.

The `/domain-api/WebsiteUrl/by-domain` same-origin proxy is configured for
Vite development, Vercel, and IIS deployments. Set `VITE_WEBSITE_DOMAIN` only
when testing a specific tenant from a local hostname.
For local tenant previews, pass `?websiteDomain=<tenant-hostname>` in
development. The selected tenant is kept in the current browser tab while
navigating between home and menu:

- `http://localhost:5180/?websiteDomain=app-thedesirelounge.cylsysuat.com`
- `http://localhost:5180/?websiteDomain=app-hookahpani.cylsysuat.com`
- `http://localhost:5180/?websiteDomain=app-humtumkitchen.cylsysuat.com`

For a different API environment, update `.env.local` or the centralized
values in `src/config/urls.ts`; do not edit endpoint strings across pages.

## API integration — matches the `RestaurantOS_UAT` Postman collection

All endpoints below are wired up exactly as shown in the Postman
collection (method, path, and payload shape).

| Endpoint | Method | Purpose |
|---|---|---|
| `/Category/GetCategory` | POST | Body: `{ companyId, branchId, dayOfWeek: null, time: null }`. Always returns the **full list** of categories for that company/branch. |
| `/SubCategory/GetSubCategory` | POST | Body: `{ categoryId: "<uidCategoryId>", subcategoryId: null, branchId, dayOfWeek: null, time: null }`. Returns that category's subcategories. |
| `/MenuItem/GetMenuItem` | POST | Body: `{ subcategoryId, branchId, dayOfWeek, time }`. Returns that subcategory's items. `dayOfWeek` is a **number** (0=Sunday…6=Saturday) when used. |
| `/Cart/addcart` | POST | Body: `{ companyId, branchId, menuItemId, quantity }`, matching the collection exactly. |
| `/Cart/removeitem` | DELETE | Body: `{ cartId, cartItemId }`. |
| `/Cart/updatequantity` | POST | Body: `{ cartId, cartItemId, quantity }`. (Fixed — this app previously called it as `PUT`.) |
| `/Cart/getcartitems/{cartId}` | GET | Re-hydrates the cart on page load. |
| `/Cart/order` | POST | Body: `{ cartId, firstName, lastName, CountryCode, mobile, dob, guestCount }`. (Fixed — this app previously posted to `/Order/order`.) |
| `/Order/getOrderConfirmationID` | GET | Query: `?orderId=...`. Returns `{ order, items }` directly (not wrapped in the usual envelope). |
| `/Customer/getcustomerbymobile` | POST | Body: `{ CountryCode, mobile, companyId }`. Used by the "Returning Guest" tab at checkout. |
| `/Reservation/CraeteReservation` | POST | Body: `{ companyId, branchId, tableId, guestName, mobile, email, guestCount, reservationDateTime, specialRequest }`. Not currently wired into any page/form. (Typo "Craete" is in the live API's own path.) |

Since there's no "get one category" or "get one subcategory by its own
id" endpoint confirmed to work:
- `fetchCategoryById()` (`src/api/category.api.ts`) fetches the full
  category list and finds the match client-side.
- A subcategory's display name/blurb/icon on the Menu page come from
  the category's already-fetched `subCategories` list
  (`useCategoryDetail`) — never from a separate per-subcategory fetch.

**`src/api/normalize.ts`** is still the one place that knows about raw
field names (it accepts the confirmed `uidCategoryId`/`strCategoryName`
style plus several fallback variants for SubCategory/MenuItem, since
those two weren't confirmed at the time of writing) — edit there if a
live response uses different names.

### Bug fixed: menu items / subcategory name not showing

**Symptom:** navigating into a subcategory showed a blank/generic
"Items" title and no products, even though the API calls were
succeeding.

**Root cause (two bugs):**
1. `fetchCategoryById()` was accidentally sending the **categoryId**
   value into the request's `companyId` field (a mix-up from an
   earlier refactor), so it always fetched the wrong company's
   (empty) category list and threw "Category not found".
2. The Menu page depended on a separate "fetch this one subcategory by
   its own id" call to get the subcategory's name. That endpoint isn't
   confirmed to work, and when it failed, the page did
   `if (subError) return <ErrorState .../>` — which replaced the
   **entire page**, hiding the product grid even though the items
   themselves had already loaded fine independently.

**Fix:** `fetchCategoryById` now reuses the confirmed-working
`fetchCategories()` list call. The Menu page no longer fetches a
subcategory by its own id at all — it resolves the subcategory's name
from the category's subcategory list, and only blocks rendering on
`itemsError`/`itemsLoading` (never on category/subcategory lookup
failures, which now degrade gracefully instead of hiding the page).

## Cart & checkout

- Cart state lives in `CartContext`, persisted to `localStorage`
  (`ff_cart_v1`) — same behaviour as the original `cart.js`.
- Checkout collects guest details (new vs returning + OTP flow, currently
  simulated client-side — wire up a real OTP endpoint when available) and
  writes the placed order to `sessionStorage` (`ff_last_order_v1`), which
  the confirmation page reads.

## What's intentionally simplified vs. the original static site

- GSAP/Lottie entrance animations were not ported 1:1 — the CSS design
  system (`style.css`) is preserved, but scroll/entry animations were
  left out to keep the dependency list small. They can be reintroduced
  with `framer-motion` or a small GSAP wrapper if desired.
- OTP send/verify is currently a client-side simulation (matches the
  original's behaviour) — swap `handleSendOtp` / the OTP check in
  `CheckoutPage.tsx` for a real API call when one exists.
