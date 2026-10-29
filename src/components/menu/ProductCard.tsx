import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatAED } from "@/utils/format";
import type { MenuItem } from "@/types/menu.types";
import staticImage from "@/assets/images/staticimage.jpg";
import { getImageUrl } from "@/utils/imageUrl";

export function ProductCard({ product, priority = false }: { product: MenuItem; priority?: boolean }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [sizePickerOpen, setSizePickerOpen] = useState(false);
  const [portionQuantity, setPortionQuantity] = useState(1);
  const sizeOptions = [
    ...(product.halfPrice != null && product.halfPrice > 0
      ? [{ label: "Half" as const, price: product.halfPrice }]
      : []),
    ...(product.fullPrice != null && product.fullPrice > 0
      ? [{ label: "Full" as const, price: product.fullPrice }]
      : []),
  ];

  const handleAdd = () => {
    addToCart(product);
    showToast(`${product.name} added to cart`);
  };

  const handleAddSize = (variant: "Half" | "Full", price: number) => {
    addToCart({
      ...product,
      id: `${product.id}::${variant.toLowerCase()}`,
      menuItemId: product.id,
      variant,
      price,
    }, portionQuantity);
    showToast(`${portionQuantity} ${variant} portion${portionQuantity === 1 ? "" : "s"} of ${product.name} added to cart`);
    setSizePickerOpen(false);
    setPortionQuantity(1);
  };

  useEffect(() => {
    if (!sizePickerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSizePickerOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [sizePickerOpen]);

  const imageSrc = getImageUrl(product.image) || staticImage;

  return (
    <article className="menu-card" data-product={product.id}>
      <div className="menu-card__media">
        <img
          src={imageSrc}
          alt={product.name}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          width={400}
          height={300}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = staticImage;
          }}
        />
      </div>
      <div className="menu-card__body">
        <h3 className="menu-card__name">{product.name}</h3>
        <p className="menu-card__desc">{product.description}</p>
        <div className="menu-card__footer">
          <span className="menu-card__price">{formatAED(product.price)}</span>
          <button
            type="button"
            className="menu-card__add"
            onClick={sizeOptions.length > 0 ? () => {
              setPortionQuantity(1);
              setSizePickerOpen(true);
            } : handleAdd}
          >
            + Add to Cart
          </button>
        </div>
      </div>
      {sizePickerOpen && (
        <div
          className="size-picker"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSizePickerOpen(false);
          }}
        >
          <section
            className="size-picker__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`size-picker-title-${product.id}`}
          >
            <button
              type="button"
              className="size-picker__close"
              aria-label="Close size selection"
              onClick={() => setSizePickerOpen(false)}
            >
              ×
            </button>
            <p className="size-picker__eyebrow">Choose your portion</p>
            <h2 id={`size-picker-title-${product.id}`}>{product.name}</h2>
            <div className="size-picker__quantity">
              <span>Quantity</span>
              <div className="size-picker__quantity-control" aria-label="Portion quantity">
                <button
                  type="button"
                  aria-label="Decrease portion quantity"
                  disabled={portionQuantity <= 1}
                  onClick={() => setPortionQuantity((quantity) => Math.max(1, quantity - 1))}
                >
                  −
                </button>
                <output aria-live="polite">{portionQuantity}</output>
                <button
                  type="button"
                  aria-label="Increase portion quantity"
                  onClick={() => setPortionQuantity((quantity) => quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="size-picker__options">
              {sizeOptions.map((option) => (
                <button
                  type="button"
                  className="size-picker__option"
                  key={option.label}
                  onClick={() => handleAddSize(option.label, option.price)}
                >
                  <span>{option.label}</span>
                  <strong>{formatAED(option.price)}</strong>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </article>
  );
}
