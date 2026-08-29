import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { MenuBack } from "@/components/layout/MenuBack";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { NavIcon } from "@/components/ui/Icon";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

export function CartPage() {
  const { items } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // "Order Now" hands off to /checkout, which collects guest details and
  // then actually calls the Cart/order API (see CheckoutPage.placeOrder) —
  // it also sends the WhatsApp notification once the order is placed, so
  // that doesn't need to happen here too.
  const handleCheckout = () => {
    if (items.length === 0) {
      showToast("Add something delicious first");
      return;
    }
    navigate("/checkout");
  };

  return (
    <main className="page cart-page">
      <Header />
      <MenuBack to="/categories" label="Back to Menu" />

      <header className="menu-hero cart-hero">
        <h1 className="menu-hero__title">My Cart</h1>
        <span className="menu-hero__ornament" aria-hidden="true" />
      </header>

      {items.length === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty__icon">
            <NavIcon name="cart" />
          </div>
          <p className="mb-4">Your cart is empty</p>
          <Link to="/categories" className="btn btn-primary">
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="cart-panel">
          <div className="cart-table" role="table" aria-label="Cart items">
            <div className="cart-table__head" role="row">
              <span className="cart-table__th cart-table__th--item" role="columnheader">
                Item
              </span>
              <span className="cart-table__th cart-table__th--price" role="columnheader">
                Price
              </span>
              <span className="cart-table__th cart-table__th--qty" role="columnheader">
                Quantity
              </span>
              <span className="cart-table__th cart-table__th--remove" role="columnheader">
                Remove
              </span>
            </div>
            <div className="cart-list" role="rowgroup">
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>

          <Link to="/categories" className="cart-add-more">
            <span aria-hidden="true">+</span>
            Add More Items
          </Link>

          <div className="cart-footer">
            <button type="button" className="btn btn-primary cart-order-btn" onClick={handleCheckout}>
              Order Now
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}