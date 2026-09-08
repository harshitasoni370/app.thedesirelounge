import { Link } from "react-router-dom";
import placeholderDish from "@/assets/images/staticimage.jpg";

interface CategoryTileProps {
  id: string;
  name: string;
  icon: string;
  href: string;
  image?: string | null;
  variant?: "default" | "shisha";
  /** Passed as router state (useLocation) instead of a URL param — keeps the address bar short. */
  state?: Record<string, unknown>;
}

export function CategoryTile({ name, href, image, variant = "default", state }: CategoryTileProps) {
  const classes = [
    "category-item",
    "category-item--image",
    variant === "shisha" ? "category-item--shisha" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link to={href} state={state} className={classes} aria-label={name}>
      <img
        src={image || placeholderDish}
        alt={name}
        className="category-item__image"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = placeholderDish;
        }}
      />
      <span className="category-item__overlay" aria-hidden="true" />
      <span className="category-item__label category-item__label--on-image">{name}</span>
    </Link>
  );
}
