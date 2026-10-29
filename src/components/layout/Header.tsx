import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { NavIcon } from "@/components/ui/Icon";
import { useHeaderScrolled } from "@/hooks/useHeaderScrolled";
import { URLS } from "@/config/urls";
import { useSession } from "@/context/SessionContext";
import { getImageUrl } from "@/utils/imageUrl";
import { useAppSelector } from "@/store/hooks";
import { selectQrContext } from "@/store/slices/qrContextSlice";

export function DigitalLoungeHomeLink() {
  const { session, websiteConfig } = useSession();
  const qrContext = useAppSelector(selectQrContext);
  const location = useLocation();

  const digitalLoungeHref = (() => {
    if (!websiteConfig?.digitalLoungeUrl) return undefined;

    const url = new URL(websiteConfig.digitalLoungeUrl, window.location.origin);
    if (session.source === "qr") {
      const sourceParams = Object.keys(qrContext.params).length
        ? qrContext.params
        : Object.fromEntries(new URLSearchParams(location.search).entries());

      Object.entries(sourceParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
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

export function Header() {
  const { count } = useCart();
  const { session, websiteConfig } = useSession();
  const scrolled = useHeaderScrolled();
  const location = useLocation();
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

  const showCallWaiter =
    (session.companyId || websiteConfig?.companyId) &&
    (session.branchId || websiteConfig?.branchId) &&
    ["/", "/categories"].includes(location.pathname);

  return (
    <>
      <header className={`hero__top${scrolled ? " is-scrolled" : ""}`}>
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

        <div className="header__actions">
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
          to={{ pathname: "/call-waiter", search: location.search }}
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