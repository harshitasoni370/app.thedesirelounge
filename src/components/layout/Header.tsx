import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { NavIcon } from "@/components/ui/Icon";
import { useHeaderScrolled } from "@/hooks/useHeaderScrolled";
import { URLS } from "@/config/urls";
import { useSession } from "@/context/SessionContext";
import { useCategories } from "@/hooks/useCategories";
import { getImageUrl } from "@/utils/imageUrl";
import { useAppSelector } from "@/store/hooks";
import { selectQrContext } from "@/store/slices/qrContextSlice";

export type MenuView = "grid" | "table";

export function DigitalLoungeHomeLink() {
  const { session, websiteConfig } = useSession();
  const qrContext = useAppSelector(selectQrContext);
  const location = useLocation();

  const digitalLoungeHref = (() => {
    if (!websiteConfig?.digitalLoungeUrl) return undefined;

    const url = new URL(websiteConfig.digitalLoungeUrl, window.location.origin);
    if (session.source === "qr") {
      const sourceParams = new URLSearchParams();
      Object.entries(qrContext.params).forEach(([key, value]) => sourceParams.set(key, value));
      new URLSearchParams(location.search).forEach((value, key) => sourceParams.set(key, value));
      sourceParams.forEach((value, key) => url.searchParams.set(key, value));
    }

    return url.toString();
  })();

  return (
    <a
      href={digitalLoungeHref}
      className="icon-btn header__home"
      aria-label="Go to Digital Lounge home"
      aria-disabled={!websiteConfig?.digitalLoungeUrl}
      title="Home"
    >
      <NavIcon name="home" />
    </a>
  );
}

export function Header({
  menuView,
  onMenuViewChange,
  searchQuery,
  onSearchQueryChange,
}: {
  menuView?: MenuView;
  onMenuViewChange?: (view: MenuView) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
} = {}) {
  const { count } = useCart();
  const { session, websiteConfig, deviceId } = useSession();
  const scrolled = useHeaderScrolled();
  const location = useLocation();
  const navigate = useNavigate();
  const siteName = websiteConfig?.siteName || websiteConfig?.companyName || "The Desire Sheesha Lounge";
  const [brandWord, ...brandDescription] = siteName.trim().replace(/^the\s+/i, "").split(/\s+/);
  const logoTitle = brandWord ? `The ${brandWord}` : siteName;
  const logoTag =
    brandDescription.join(" ") || websiteConfig?.branchName || "Sheesha Lounge";
  const logoUrl = getImageUrl(websiteConfig?.logoUrl) || URLS.assets.logo;
  const params = new URLSearchParams(location.search);
  const reservationCategory = params.get("reservationCategory");

  const isCheckout = location.pathname === "/checkout";

  const hideCartIcon =
    params.get("hideCardIcon") === "true" ||
    isCheckout ||
    Boolean(
      params.get("gameName") ||
      params.get("bookingType") ||
      [
        "TABLE_RESERVATION",
        "EVENT",
        "OFFER",
        "EXCLUSIVE_OFFER",
        "CUSTOM_MOMENT",
      ].includes(reservationCategory || "")
    );

  const companyId = session.companyId || websiteConfig?.companyId;
  const branchId = session.branchId || websiteConfig?.branchId;
  const { categories } = useCategories(menuView !== undefined ? branchId || null : null, companyId || null);
  const currentSubcategoryId =
    (location.state as { subcategoryId?: string } | null)?.subcategoryId || "";

  const handleCategoryChange = (subcategoryId: string) => {
    const subcategory = categories
      .flatMap((category) => category.subCategories)
      .find((item) => item.id === subcategoryId);
    if (!subcategory) return;

    navigate(
      { pathname: "/menu", search: location.search },
      { state: { subcategoryId: subcategory.id, categoryId: subcategory.categoryId } }
    );
  };

  const callWaiterParams = new URLSearchParams(location.search);
  if (companyId) callWaiterParams.set("companyId", companyId);
  if (branchId) callWaiterParams.set("branchId", branchId);
  if (session.tableId) callWaiterParams.set("tableId", session.tableId);
  if (session.tableNumber) callWaiterParams.set("tableNumber", session.tableNumber);
  if (session.sessionId) callWaiterParams.set("sessionId", session.sessionId);
  if (deviceId) callWaiterParams.set("deviceId", deviceId);
  const callWaiterSearch = callWaiterParams.toString();
  const showCallWaiter =
    Boolean(companyId && branchId) && location.pathname !== "/call-waiter";

  return (
    <>
      <header className={`hero__top${scrolled ? " is-scrolled" : ""}${menuView !== undefined ? " hero__top--menu" : ""}`}>
        <Link to="/" className="logo">
          <img
            src={logoUrl}
            alt={`${siteName} logo`}
            className="logo__mark"
            width={42}
            height={42}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />

          <span className="logo__copy">
            <span className="logo__text">{logoTitle}</span>
            <span className="logo__tag">{logoTag}</span>
          </span>
        </Link>

        <div className={`header__actions${menuView !== undefined ? " header__actions--menu-view" : ""}`}>
          {searchQuery !== undefined && onSearchQueryChange && (
            <input
              type="search"
              className="header__search"
              aria-label="Search menu items"
              placeholder="Search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.currentTarget.value)}
            />
          )}
          {menuView !== undefined && onMenuViewChange && (
            <select
              className="header__category-select"
              aria-label="Menu category"
              value={currentSubcategoryId}
              onChange={(event) => handleCategoryChange(event.currentTarget.value)}
            >
              <option value="" disabled>Categories</option>
              {categories.map((category) => (
                <optgroup key={category.id} label={category.name}>
                  {category.subCategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
          {menuView !== undefined && onMenuViewChange && (
            <select
              className="header__view-select"
              aria-label="Menu view"
              value={menuView}
              onChange={(event) => {
                const view = event.currentTarget.value;
                if (view === "grid" || view === "table") onMenuViewChange(view);
              }}
            >
              <option value="grid">Grid</option>
              <option value="table">Table</option>
            </select>
          )}
          <Link
            to="/orders?all=true"
            className="header__order-link"
            aria-label="View all orders"
          >
            My Orders
          </Link>
          <DigitalLoungeHomeLink />
          {!hideCartIcon && (
            <Link
              to="/cart"
              className="icon-btn header__cart"
              aria-label="Open cart"
            >
              <NavIcon name="cart" />
              <span className={`badge${count > 0 ? " is-visible" : ""}`}>
                {count}
              </span>
            </Link>
          )}
        </div>
      </header>
      {showCallWaiter && (
        <Link
          to={{ pathname: "/call-waiter", search: callWaiterSearch ? `?${callWaiterSearch}` : "" }}
          className="call-waiter-fab"
          aria-label="Call waiter for assistance"
        >
          <span className="call-waiter-fab__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
          </span>
          <span>
            <strong>Call Waiter</strong>
            <small>Need assistance?</small>
          </span>
        </Link>
      )}
    </>
  );
}