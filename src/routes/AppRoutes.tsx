import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { CategoryLandingPage } from "@/pages/CategoryLandingPage";
import { MenuPage } from "@/pages/MenuPage";
import { CartPage } from "@/pages/CartPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { ConfirmPage } from "@/pages/ConfirmPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { OffersPage } from "@/pages/OffersPage";

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
  const params = new URLSearchParams(location.search);
  const hasForwardedContext =
    Boolean(params.get("companyId") || params.get("companyID") || params.get("uidCompanyId")) &&
    Boolean(params.get("branchId") || params.get("branchID") || params.get("uidBranchId")) &&
    Boolean(
      params.get("tableId") || params.get("tableID") || params.get("uidTableId") ||
      params.get("sessionId") || params.get("tableSessionId") || params.get("Table-Session-Id")
    );
  const hasQrParams = params.has("type") || hasForwardedContext;

  return (
    <Routes>
      <Route path="/" element={hasQrParams ? <Navigate to={`/categories${location.search}`} replace /> : <HomePage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/category" element={<CategoryLandingPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/confirm" element={<ConfirmPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/offers" element={<OffersPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
