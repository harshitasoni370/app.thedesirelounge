import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { NavIcon } from "@/components/ui/Icon";
import { useHeaderScrolled } from "@/hooks/useHeaderScrolled";
import { URLS } from "@/config/urls";
import { useSession } from "@/context/SessionContext";
import { getImageUrl } from "@/utils/imageUrl";
import { readLocal } from "@/utils/storage";
import type { PlacedOrder } from "@/types/cart.types";

const ORDER_KEY = "ff_last_order_v1";

export function Header() {
  const { count } = useCart();
  const { websiteConfig } = useSession();
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
  const lastOrder = readLocal<PlacedOrder | null>(ORDER_KEY, null);

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

  return (
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
        {lastOrder?.orderId && (
          <Link
            to="/confirm"
            className="header__order-link"
            aria-label={`View order ${lastOrder.orderNo || lastOrder.orderId}`}
          >
            {lastOrder.orderNo || lastOrder.orderId}
          </Link>
        )}
        <a
          href={websiteConfig?.digitalLoungeUrl || undefined}
          className="icon-btn header__home"
          aria-label="Go to Digital Lounge home"
          aria-disabled={!websiteConfig?.digitalLoungeUrl}
          title="Home"
        >
          <NavIcon name="home" />
        </a>
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
  );
}