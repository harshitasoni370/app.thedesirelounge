import { useRef } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { CategoryLandingPage } from "@/pages/CategoryLandingPage";
import { MenuPage } from "@/pages/MenuPage";
import { CartPage } from "@/pages/CartPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { ConfirmPage } from "@/pages/ConfirmPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { OffersPage } from "@/pages/OffersPage";
import { CallWaiterPage } from "@/pages/CallWaiterPage";
import { PayBillPage } from "@/pages/PayBillPage";
import { MyPaymentsPage } from "@/pages/MyPaymentsPage";
import { resolveParam } from "@/store/slices/qrContextSlice";

/**
 * /category and /menu carry NO id in the URL — the category/subcategory
 * id is passed via router state (Link's `state` prop / useLocation)
 * instead, so the address bar stays short instead of showing raw GUIDs
 * like /category/dfc8196c-.../menu/e9f39cd0-.... Both pages redirect
 * back to /categories if that state is missing (e.g. a hard refresh),
 * since they're only ever reached by clicking through from the app.
 */
export function AppRoutes() {
  const location = useLocation();
  const qrHomeLocationKey = useRef<string | null>(null);
  const params = new URLSearchParams(location.search);
  const hasForwardedContext =
    Boolean(resolveParam(params, "companyId")) &&
    Boolean(resolveParam(params, "branchId")) &&
    Boolean(resolveParam(params, "tableId") || resolveParam(params, "sessionId") || resolveParam(params, "tableSessionId"));
  const hasQrParams = Boolean(
    resolveParam(params, "type") ||
      resolveParam(params, "tableCode") ||
      resolveParam(params, "location") ||
      resolveParam(params, "name") ||
      resolveParam(params, "resturant") ||
      resolveParam(params, "restaurant") ||
      hasForwardedContext
  );
  const isQrHome = location.pathname === "/" && hasQrParams;

  if (isQrHome && qrHomeLocationKey.current === location.key) {
    return (
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    );
  }

  if (isQrHome) {
    qrHomeLocationKey.current = location.key;
  }

  return (
    <Routes>
      <Route path="/" element={hasQrParams ? <Navigate to={`/categories${location.search}`} /> : <HomePage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/category" element={<CategoryLandingPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/confirm" element={<ConfirmPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/offers" element={<OffersPage />} />
      <Route path="/call-waiter" element={<CallWaiterPage />} />
      <Route path="/pay-bill" element={<PayBillPage />} />
      <Route path="/payments" element={<MyPaymentsPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
