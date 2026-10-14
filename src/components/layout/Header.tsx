import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { NavIcon } from "@/components/ui/Icon";
import { useHeaderScrolled } from "@/hooks/useHeaderScrolled";
import { URLS } from "@/config/urls";
import { useSession } from "@/context/SessionContext";
import { getImageUrl } from "@/utils/imageUrl";

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
  const websiteDomain = websiteConfig?.domain?.trim();
  const websiteHomeUrl = websiteDomain
    ? `${/^https?:\/\//i.test(websiteDomain) ? "" : "https://"}${websiteDomain}`
    : URLS.website.home;

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
        <a
          href={websiteHomeUrl}
          className="icon-btn header__home"
          aria-label={`Go to ${siteName} home`}
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