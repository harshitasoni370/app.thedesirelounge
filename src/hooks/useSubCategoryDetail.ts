import { useEffect, useState } from "react";
import { fetchSubCategoryById } from "@/api/subCategory.api";
import type { SubCategory } from "@/types/menu.types";

interface UseSubCategoryDetailResult {
  subCategory: SubCategory | null;
  isLoading: boolean;
  error: string | null;
}

export function useSubCategoryDetail(
  branchId: string | null,
  subcategoryId: string | undefined
): UseSubCategoryDetailResult {
  const [subCategory, setSubCategory] = useState<SubCategory | null>(null);
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
        const sub = await fetchSubCategoryById(branchId as string, subcategoryId as string);
        if (!cancelled) setSubCategory(sub);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Could not load this menu. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [branchId, subcategoryId]);

  return { subCategory, isLoading, error };
}
