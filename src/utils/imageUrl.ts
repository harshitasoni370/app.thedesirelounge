/**
 * The API returns image paths as relative strings (e.g. "/uploads/dish.jpg")
 * in most cases, but sometimes as a FULL absolute URL that has the domain
 * hardcoded on the backend/DB side (e.g. still pointing at the UAT host
 * even when the API itself is being called on production). If we trusted
 * that embedded domain, switching VITE_API_BASE_URL / VITE_IMAGE_BASE_URL
 * to production would have no effect on images — exactly what was
 * happening.
 *
 * So: always strip whatever protocol+host the API gave us (if any) and
 * rebuild the URL using OUR configured IMAGE_BASE_URL. That makes the
 * image domain fully controlled by env vars, regardless of what the
 * backend embeds.
 *
 * Prefers VITE_IMAGE_BASE_URL (set in .env.local). Falls back to deriving
 * the host from VITE_API_BASE_URL (stripping a trailing "/api") for
 * setups that only have the API URL configured.
 */

const IMAGE_BASE_URL: string =
  import.meta.env.VITE_IMAGE_BASE_URL ||
  (import.meta.env.VITE_API_BASE_URL).replace(/\/api\/?$/i, "");

export function getImageUrl(path?: string | null): string | undefined {
  if (!path) return undefined;

  // Strip any protocol+host the API embedded (e.g. "https://oldhost.com/x.png" -> "/x.png").
  // Leaves protocol-relative/relative paths untouched.
  const pathOnly = path.replace(/^https?:\/\/[^/]+/i, "");

  return `${IMAGE_BASE_URL}${pathOnly.startsWith("/") ? "" : "/"}${pathOnly}`;
}