import { useEffect, useState } from "react";
import { fetchCategoryById } from "@/api/category.api";
import { fetchSubCategoriesByCategory } from "@/api/subCategory.api";
import type { Category } from "@/types/menu.types";

interface UseCategoryDetailResult {
  category: Category | null;
  isLoading: boolean;
  error: string | null;
}

/** Loads one category (by id, from the full list) plus its subcategories. */
export function useCategoryDetail(
  branchId: string | null,
  companyId: string | null,
  categoryId: string | undefined
): UseCategoryDetailResult {
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!branchId || !categoryId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const cat = await fetchCategoryById(branchId as string, companyId, categoryId as string);
        if (!cat) throw new Error("Category not found");

        cat.subCategories = await fetchSubCategoriesByCategory(branchId as string, cat.id);

        if (!cancelled) setCategory(cat);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Could not load this category. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [branchId, companyId, categoryId]);

  return { category, isLoading, error };
}
