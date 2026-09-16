import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { NavIcon } from "@/components/ui/Icon";
import { useHeaderScrolled } from "@/hooks/useHeaderScrolled";
import { URLS } from "@/config/urls";
import { useLocation } from "react-router-dom";

export function Header() {
  const { count } = useCart();
  const scrolled = useHeaderScrolled();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const reservationCategory = params.get("reservationCategory");
  const hideCardIcon = params.get("hideCardIcon") === "true" || Boolean(
    params.get("gameName") ||
    params.get("bookingType") ||
    ["TABLE_RESERVATION", "EVENT", "OFFER", "EXCLUSIVE_OFFER", "CUSTOM_MOMENT"].includes(reservationCategory || ""),
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
      {!hideCardIcon && (
        <Link to="/cart" className="icon-btn header__cart" aria-label="Open cart">
          <NavIcon name="cart" />
          <span className={`badge${count > 0 ? " is-visible" : ""}`}>{count}</span>
        </Link>
      )}
    </header>
  );
}
