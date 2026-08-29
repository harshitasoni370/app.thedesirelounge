import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { NavIcon } from "@/components/ui/Icon";
import { useHeaderScrolled } from "@/hooks/useHeaderScrolled";
import logo from "@/assets/images/logo.webp";

export function Header() {
  const { count } = useCart();
  const scrolled = useHeaderScrolled();

  return (
    <header className={`hero__top${scrolled ? " is-scrolled" : ""}`}>
      <Link to="/" className="logo">
        <img src={logo} alt="" className="logo__mark" width={42} height={42} />
        <span className="logo__copy">
          <span className="logo__text">The Desire</span>
          <span className="logo__tag">Sheesha Lounge</span>
        </span>
      </Link>
      <Link to="/cart" className="icon-btn header__cart" aria-label="Open cart">
        <NavIcon name="cart" />
        <span className={`badge${count > 0 ? " is-visible" : ""}`}>{count}</span>
      </Link>
    </header>
  );
}
