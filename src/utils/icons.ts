/**
 * Line-art category icons and nav icons, ported from the original
 * assets/js/icons.js. Kept as raw SVG strings (rendered via
 * dangerouslySetInnerHTML in <Icon />) since they are static,
 * developer-authored markup — not user input.
 */

export const CATEGORY_ICONS: Record<string, string | null> = {
  breakfast: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="24" cy="34" rx="12" ry="3.5"/><path d="M14 28c0-7 4.5-12 10-12s10 5 10 12"/><path d="M34 22v8a3 3 0 01-3 3"/><path d="M20 12c.8-2.5 2.2-4 4-4s3.2 1.5 4 4"/><path d="M18 16c1-2 2.5-3.5 4-3.5"/></svg>`,
  chaat: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="22" cy="34" rx="12" ry="4"/><path d="M12 28c0-8 4.5-14 10-14s10 6 10 14"/><circle cx="18" cy="24" r="2"/><circle cx="26" cy="22" r="2"/><circle cx="22" cy="18" r="1.8"/><path d="M32 14l6-6M34 18l8-2"/></svg>`,
  starters: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 40L28 8"/><path d="M20 40L34 8"/><ellipse cx="17" cy="32" rx="3.5" ry="2.2" transform="rotate(-20 17 32)"/><ellipse cx="23" cy="28" rx="3.5" ry="2.2" transform="rotate(-20 23 28)"/><ellipse cx="23" cy="32" rx="3.5" ry="2.2" transform="rotate(-20 23 32)"/><ellipse cx="29" cy="28" rx="3.5" ry="2.2" transform="rotate(-20 29 28)"/></svg>`,
  "main-course": `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="24" cy="34" rx="14" ry="4"/><path d="M10 34c0-10 6-18 14-18s14 8 14 18"/><path d="M18 16c0-4 2.5-6 6-6s6 2 6 6"/><path d="M24 10V8"/></svg>`,
  "indo-chinese": `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="22" cy="34" rx="12" ry="4"/><path d="M12 28c1-8 5-14 10-14s9 6 10 14"/><path d="M16 24c2 1 4 1.5 6 1.5s4-.5 6-1.5"/><path d="M30 12l10 4M32 16l10 2"/></svg>`,
  breads: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="24" cy="24" rx="14" ry="10"/><path d="M14 22c3 2 7 3 10 3s7-1 10-3"/></svg>`,
  "rice-biryani": `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 26h24v4c0 7-5 12-12 12s-12-5-12-12v-4z"/><path d="M16 26c0-6 3.5-11 8-11s8 5 8 11"/><path d="M20 16c0-2 1-4 4-5M28 16c0-2-1-4-4-5"/><circle cx="20" cy="22" r="1" fill="currentColor" stroke="none"/><circle cx="28" cy="20" r="1" fill="currentColor" stroke="none"/><circle cx="24" cy="18" r="1" fill="currentColor" stroke="none"/></svg>`,
  italian: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 18c8-7 20-7 28 0L24 40 10 18z"/><circle cx="20" cy="24" r="1.6" fill="currentColor" stroke="none"/><circle cx="26" cy="28" r="1.6" fill="currentColor" stroke="none"/><circle cx="24" cy="22" r="1.2" fill="currentColor" stroke="none"/></svg>`,
  "burgers-sandwiches": `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20c0-7 5.5-11 12-11s12 4 12 11"/><path d="M10 24h28"/><path d="M12 28h24"/><path d="M14 32c2 3 5 4 10 4s8-1 10-4"/><path d="M16 24c1 2 3 3 8 3s7-1 8-3"/></svg>`,
  "soups-salads": `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 26h24l-2 12H14l-2-12z"/><path d="M16 26c0-5 3.5-9 8-9s8 4 8 9"/><path d="M20 18c1-3 2.5-5 4-5M26 17c.5-2 1.5-3.5 3-4"/><path d="M22 20c2 1 4 1 6 0"/></svg>`,
  "fumes-specials": `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="24" cy="36" rx="14" ry="4"/><path d="M10 36c0-10 6-18 14-18s14 8 14 18"/><path d="M18 18c0-4 2.5-6 6-6s6 2 6 6"/><path d="M24 8l1.2 3.6H29l-3 2.2 1.2 3.6L24 15.2l-3.2 2.2 1.2-3.6-3-2.2h3.8L24 8z"/></svg>`,
  "hot-beverages": `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 20h16v12a6 6 0 01-6 6h-4a6 6 0 01-6-6V20z"/><path d="M30 24h3.5a3.5 3.5 0 010 7H30"/><ellipse cx="22" cy="40" rx="10" ry="2.5"/><path d="M18 12c0 2 1 3.5 2 4.5M24 11c0 2 1 3.5 2 4.5"/></svg>`,
  "cold-beverages": `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 10h12l-2.5 28H20.5L18 10z"/><path d="M16 10h16"/><path d="M22 18h4M22 24h4"/><path d="M30 14c4 1 6 4 5 7"/><circle cx="34" cy="22" r="3"/><path d="M24 38v4"/></svg>`,
  desserts: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 28h24l-3 12H15l-3-12z"/><path d="M14 28c0-7 4.5-12 10-12s10 5 10 12"/><path d="M24 16v4"/><circle cx="24" cy="14" r="2"/><path d="M18 34h12"/></svg>`,
  shisha: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 6h4v7l4 4v5H18v-5l4-4V6z"/><path d="M20 22h8v3c0 4-2 7-4 9s-4 5-4 9h8"/><path d="M28 26c7 2 11 7 11 12"/><circle cx="38" cy="16" r="2.2"/><path d="M36 12c1-2 2-3.5 3-4"/></svg>`,
  lunch: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="10" y="16" width="28" height="22" rx="3"/><path d="M18 16v-3a6 6 0 0112 0v3"/><path d="M10 26h28"/><path d="M24 22v8"/></svg>`,
  "classic-flavours": `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="24" cy="18" rx="10" ry="5"/><path d="M14 18v6c0 3 4.5 5 10 5s10-2 10-5v-6"/><path d="M24 29v6"/><ellipse cx="24" cy="38" rx="6" ry="2.5"/><path d="M20 14c1-3 2.5-5 4-5s3 2 4 5"/></svg>`,
  "premium-blends": `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M24 8l8 10-8 22-8-22 8-10z"/><path d="M16 18h16"/></svg>`,
  "ff-signature": `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="24" cy="24" r="14"/><text x="24" y="28" text-anchor="middle" fill="currentColor" stroke="none" font-size="11" font-family="Montserrat, sans-serif" font-weight="600">F&amp;F</text></svg>`,
  "premium-bases": `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 14h12v6c4 4 6 9 6 14 0 5-4 8-12 8s-12-3-12-8c0-5 2-10 6-14v-6z"/><path d="M24 8l1.5 4H30l-3.5 2.5L28 19l-4-3-4 3 1.5-4.5L18 12h4.5L24 8z"/></svg>`,
  enhancements: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M24 38c-6-8-10-14-10-20a10 10 0 0120 0c0 6-4 12-10 20z"/><path d="M18 22c2 1 4 1.5 6 1.5s4-.5 6-1.5"/><path d="M20 16c1.5-2 3-3 4-3"/></svg>`,
  // legacy aliases
  burgers: null,
  pizza: null,
  sushi: null,
  chinese: null,
  cocktails: null,
  mocktails: null,
  coffee: null,
  beverages: null,
  combo: null,
  specials: null,
  platters: null,
};

CATEGORY_ICONS.burgers = CATEGORY_ICONS["burgers-sandwiches"];
CATEGORY_ICONS.pizza = CATEGORY_ICONS.italian;
CATEGORY_ICONS.sushi = CATEGORY_ICONS.italian;
CATEGORY_ICONS.chinese = CATEGORY_ICONS["indo-chinese"];
CATEGORY_ICONS.cocktails = CATEGORY_ICONS["cold-beverages"];
CATEGORY_ICONS.mocktails = CATEGORY_ICONS["cold-beverages"];
CATEGORY_ICONS.coffee = CATEGORY_ICONS["hot-beverages"];
CATEGORY_ICONS.beverages = CATEGORY_ICONS["cold-beverages"];
CATEGORY_ICONS.combo = CATEGORY_ICONS["fumes-specials"];
CATEGORY_ICONS.specials = CATEGORY_ICONS["fumes-specials"];
CATEGORY_ICONS.platters = CATEGORY_ICONS["fumes-specials"];

export function getCategoryIcon(key: string): string {
  return CATEGORY_ICONS[key] || CATEGORY_ICONS["fumes-specials"] || "";
}

export const NAV_ICONS: Record<string, string> = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-10.5z"/></svg>`,
  categories: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  cart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6h15l-1.5 9h-12L6 6z"/><path d="M6 6L5 3H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>`,
  profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M10 11v6M14 11v6M6 7l1 12h10l1-12"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>`,
  "step-menu": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h11a2 2 0 012 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 012-2z"/><path d="M9 9h6M9 13h6"/></svg>`,
  "step-cart": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6h15l-1.5 9h-12L6 6z"/><path d="M6 6L5 3H2"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg>`,
  "step-user": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.4-3.5 4-5.2 7-5.2s5.6 1.7 7 5.2"/></svg>`,
  "step-confirm": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8a2 2 0 012 2v14l-3-1.5L12 20l-3-1.5L6 20V6a2 2 0 012-2z"/><path d="M9 10h6M9 14h4"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.4-3.5 4-5.2 7-5.2s5.6 1.7 7 5.2"/></svg>`,
  "user-plus": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="8" r="3.2"/><path d="M3.5 20c1.2-3.2 3.5-4.8 6.5-4.8s5.3 1.6 6.5 4.8"/><path d="M18 8v6M15 11h6"/></svg>`,
  "user-return": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="8" r="3.2"/><path d="M3.5 20c1.2-3.2 3.5-4.8 6.5-4.8 1.4 0 2.7.3 3.8 1"/><path d="M20 11h-5.5"/><path d="M17 8l-3 3 3 3"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M2.5 20c1.1-3 3.2-4.5 6.5-4.5s5.4 1.5 6.5 4.5"/><circle cx="17" cy="9" r="2.4"/><path d="M14.2 20c.7-1.8 1.9-2.9 3.8-3.2"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 3.5h3.2l1.2 3.2-2 1.4a12.4 12.4 0 005 5l1.4-2 3.2 1.2v3.2c0 .9-.4 1.7-1.3 2-2.3.8-7.2.5-11.2-3.5S4.3 7.5 5.1 5.2c.3-.9 1.1-1.7 2-1.7z"/></svg>`,
  table: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h16"/><path d="M6 9v10M18 9v10"/><path d="M9 13v6M15 13v6"/><path d="M5 5h14v4H5z"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>`,
  clipboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4h6a2 2 0 012 2v14H7V6a2 2 0 012-2z"/><path d="M9 4.5h6v2.5H9z"/><path d="M10 12h4M10 16h4"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3.2v5.4c0 4.6-3.1 8.7-8 9.9-4.9-1.2-8-5.3-8-9.9V6.2L12 3z"/><path d="M9 12l2.2 2.2L15.5 10"/></svg>`,
};
