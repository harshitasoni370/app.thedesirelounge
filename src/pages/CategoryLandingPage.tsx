import { useLocation, Navigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { MenuBack } from "@/components/layout/MenuBack";
import { CategoryTile } from "@/components/category/CategoryTile";
import { Loader, ErrorState } from "@/components/ui/StatusStates";
import { SessionGate } from "@/components/layout/SessionGate";
import { useSession } from "@/context/SessionContext";
import { useCategoryDetail } from "@/hooks/useCategoryDetail";

interface LocationState {
  categoryId?: string;
  categoryName?: string;
}

function CategoryLandingContent({ categoryId }: { categoryId: string }) {
  const { session } = useSession();
  const { category, isLoading, error } = useCategoryDetail(session.branchId, session.companyId, categoryId);

  if (isLoading) return <Loader label="Loading…" />;
  if (error) return <ErrorState message={error} />;
  if (!category) return <ErrorState message="Category not found." />;

  return (
    <div className="section">
      <p className="section-eyebrow">{category.description || "Explore our menu."}</p>
      <header className="section__header">
        <h1 className="section__title">{category.name}</h1>
      </header>

      <div className="category-grid" role="list">
        {category.subCategories.map((sub) => (
          <CategoryTile
            key={sub.id}
            id={sub.id}
            name={sub.name}
            icon={sub.icon}
            image={sub.image}
            href="/menu"
            state={{ subcategoryId: sub.id, categoryId: category.id }}
          />
        ))}
        {category.subCategories.length === 0 && <p className="menu-grid__empty">No items in this category yet.</p>}
      </div>
    </div>
  );
}

export function CategoryLandingPage() {
  // categoryId travels via router state (useLocation) instead of a URL
  // param, keeping the address bar short. This page is only ever
  // reached by clicking a category tile, so a direct visit/refresh
  // without that state just bounces back to /categories.
  const location = useLocation();
  const { categoryId } = (location.state as LocationState) || {};

  if (!categoryId) return <Navigate to="/categories" replace />;

  return (
    <main className="page">
      <Header />
      <MenuBack to="/categories" label="Back to Categories" />
      <SessionGate>
        <CategoryLandingContent categoryId={categoryId} />
      </SessionGate>
    </main>
  );
}
