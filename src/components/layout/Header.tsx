import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { NavIcon } from "@/components/ui/Icon";
import { useHeaderScrolled } from "@/hooks/useHeaderScrolled";
import { URLS } from "@/config/urls";

export function Header() {
  const { count } = useCart();
  const scrolled = useHeaderScrolled();
  const location = useLocation();

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
          src={URLS.assets.logo}
          alt=""
          className="logo__mark"
          width={42}
          height={42}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />

        <span className="logo__copy">
          <span className="logo__text">The Desire</span>
          <span className="logo__tag">Sheesha Lounge</span>
        </span>
      </Link>

      <div className="header__actions">
        <a
          href={URLS.website.home}
          className="icon-btn header__home"
          aria-label="Go to Desire home"
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