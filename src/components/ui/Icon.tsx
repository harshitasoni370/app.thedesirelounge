import { CATEGORY_ICONS, NAV_ICONS, getCategoryIcon } from "@/utils/icons";

interface CategoryIconProps {
  name: string;
  className?: string;
}

/** Renders a category line-art icon by key (falls back to the "fumes-specials" glyph). */
export function CategoryIcon({ name, className }: CategoryIconProps) {
  const markup = getCategoryIcon(name);
  if (!markup) return null;
  return <span className={className} dangerouslySetInnerHTML={{ __html: markup }} />;
}

interface NavIconProps {
  name: keyof typeof NAV_ICONS;
  className?: string;
}

/** Renders one of the small UI/nav icons (cart, back, trash, check, etc). */
export function NavIcon({ name, className }: NavIconProps) {
  const markup = NAV_ICONS[name];
  if (!markup) return null;
  return <span className={className} dangerouslySetInnerHTML={{ __html: markup }} />;
}

export { CATEGORY_ICONS, NAV_ICONS };
