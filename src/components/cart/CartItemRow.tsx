import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { NavIcon } from "@/components/ui/Icon";
import { formatAED } from "@/utils/format";
import { getImageUrl } from "@/utils/imageUrl";
import type { CartItem } from "@/types/cart.types";
import placeholderDish from "@/assets/images/staticimage.jpg";

export function CartItemRow({ item }: { item: CartItem }) {
  const { setQty, removeFromCart } = useCart();
  const { showToast } = useToast();

  const imageSrc = getImageUrl(item.image) || placeholderDish;

  return (
    <div className="cart-item" data-cart-id={item.id} role="row">
      <div className="cart-item__product" role="cell">
        <img
          className="cart-item__img"
          src={imageSrc}
          alt={item.name}
          width={72}
          height={72}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = placeholderDish;
          }}
        />
        <div className="cart-item__info">
          <h3 className="cart-item__name">{item.name}</h3>
          {item.variant && <p className="cart-item__desc">{item.variant} portion</p>}
          {item.description && <p className="cart-item__desc">{item.description}</p>}
        </div>
      </div>
      <div className="cart-item__price" role="cell">
        {formatAED(item.price)}
      </div>
      <div className="cart-item__qty" role="cell">
        <div className="qty-control">
          <button
            type="button"
            className="qty-control__btn"
            aria-label="Decrease quantity"
            onClick={() => setQty(item.id, item.qty - 1)}
          >
            −
          </button>
          <span className="qty-control__val">{item.qty}</span>
          <button
            type="button"
            className="qty-control__btn"
            aria-label="Increase quantity"
            onClick={() => setQty(item.id, item.qty + 1)}
          >
            +
          </button>
        </div>
      </div>
      <div className="cart-item__remove" role="cell">
        <button
          type="button"
          className="cart-remove-btn"
          aria-label={`Remove ${item.name}`}
          onClick={() => {
            removeFromCart(item.id);
            showToast("Item removed");
          }}
        >
          <NavIcon name="trash" />
        </button>
      </div>
    </div>
  );
}