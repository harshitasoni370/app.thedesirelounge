import { useEffect, useState } from "react";
import { fetchCategories } from "@/api/category.api";
import { fetchSubCategoriesByCategory } from "@/api/subCategory.api";
import type { Category } from "@/types/menu.types";

interface UseCategoriesResult {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

const categoriesCache = new Map<string, Category[]>();
const categoriesRequests = new Map<string, Promise<Category[]>>();

/**
 * Loads the top-level categories for the branch, then loads each
 * category's subcategories by sending that category's id into
 * GetSubCategory (confirmed flow — see subCategory.api.ts).
 */
export function useCategories(branchId: string | null, companyId: string | null): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!branchId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const cacheKey = `${companyId || ""}:${branchId}`;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const cached = categoriesCache.get(cacheKey);
        if (cached) {
          if (!cancelled) {
            setCategories(cached);
            setIsLoading(false);
          }
          return;
        }

        let request = categoriesRequests.get(cacheKey);
        if (!request) {
          request = fetchCategories(branchId as string, companyId).then(async (cats) => {
            const withSubs = await Promise.all(
              cats.map(async (c) => ({
                ...c,
                subCategories: await fetchSubCategoriesByCategory(branchId as string, c.id),
              }))
            );
            categoriesCache.set(cacheKey, withSubs);
            return withSubs;
          });
          categoriesRequests.set(cacheKey, request);
        }

        const withSubs = await request;

        if (!cancelled) setCategories(withSubs);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Could not load the menu. Please try again.");
      } finally {
        categoriesRequests.delete(cacheKey);
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [branchId, companyId]);

  return { categories, isLoading, error };
}
