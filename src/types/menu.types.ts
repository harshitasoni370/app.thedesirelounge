/**
 * Domain models the UI actually works with — normalized away from
 * whatever field names the raw API happens to use. See
 * src/api/normalize.ts for the mapping.
 */

export interface Category {
  id: string;
  name: string;
  description: string;
  blurb: string;
  icon: string;
  image: string | null;
  /** From the API's intDisplayOrder — use to sort categories/subcategories for display. */
  sortOrder: number;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  blurb: string;
  icon: string;
  image: string | null;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  subcategoryId: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  veg: boolean;
  /** Whether the API supplied a food type for this item. */
  hasFoodType: boolean;
}
