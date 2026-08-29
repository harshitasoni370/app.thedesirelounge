import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatAED } from "@/utils/format";
import type { MenuItem } from "@/types/menu.types";
import staticImage from "@/assets/images/staticimage.jpg";
import { getImageUrl } from "@/utils/imageUrl";

export function ProductCard({ product }: { product: MenuItem }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAdd = () => {
    addToCart(product);
    showToast(`${product.name} added to cart`);
  };

  const Image =getImageUrl(product.image)

  return (
    <article className="menu-card" data-product={product.id}>
      <div className="menu-card__media">
       <img src={product.image === null ? staticImage : Image} alt={product.name} loading="lazy" width={400} height={300} />
      </div>
      <div className="menu-card__body">
        <h3 className="menu-card__name">{product.name}</h3>
        <p className="menu-card__desc">{product.description}</p>
        <div className="menu-card__footer">
          <span className="menu-card__price">{formatAED(product.price)}</span>
          <button type="button" className="menu-card__add" onClick={handleAdd}>
            + Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}
