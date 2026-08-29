import { useEffect, useState } from "react";
import { fetchMenuItems } from "@/api/menuItem.api";
import type { MenuItem } from "@/types/menu.types";

interface UseMenuItemsResult {
  items: MenuItem[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Loads items for a subcategory. Pass `filterByAvailability: true` to
 * only get items being served right now (uses the current
 * day-of-week/time); otherwise the full list is returned regardless
 * of serving hours.
 */
export function useMenuItems(
  branchId: string | null,
  subcategoryId: string | undefined,
  filterByAvailability = false
): UseMenuItemsResult {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!branchId || !subcategoryId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        let dayOfWeek: number | null = null;
        let time: string | null = null;
        if (filterByAvailability) {
          const { getCurrentDayOfWeek, getCurrentTime } = await import("@/utils/dayTime");
          dayOfWeek = getCurrentDayOfWeek();
          time = getCurrentTime();
        }

        const result = await fetchMenuItems(branchId as string, subcategoryId as string, { dayOfWeek, time });
        if (!cancelled) setItems(result);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Could not load items. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [branchId, subcategoryId, filterByAvailability]);

  return { items, isLoading, error };
}
