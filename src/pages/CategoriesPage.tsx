import { Header } from "@/components/layout/Header";
import { CategoryTile } from "@/components/category/CategoryTile";
import { Loader, ErrorState } from "@/components/ui/StatusStates";
import { CategoryIcon } from "@/components/ui/Icon";
import { SessionGate } from "@/components/layout/SessionGate";
import { useSession } from "@/context/SessionContext";
import { useCategories } from "@/hooks/useCategories";
import { getImageUrl } from "@/utils/imageUrl";
import { SessionDetails } from "@/components/layout/SessionDetails";


/**
 * The brand has exactly two top-level categories today (Food and
 * Shisha), but this page renders whatever the API returns rather than
 * hardcoding that — the "Shisha" one just gets a visually distinct
 * treatment if its name/icon matches "shisha".
 */
function CategoriesContent() {
  const { session } = useSession();
  const { categories, isLoading, error } = useCategories(session.branchId, session.companyId);

  if (isLoading) return <Loader label="Loading categories…" />;
  if (error) return <ErrorState message={error} />;

  const shishaCategory = categories.find((c) => c.icon === "shisha" || c.id === "shisha" || /shisha/i.test(c.name));
  const regularCategories = categories.filter((c) => c !== shishaCategory);

  return (
    <div className="section">
      <p className="section-eyebrow">Explore our menu.</p>
      <header className="section__header">
        <h1 className="section__title">
          Something for <em>every</em> mood.
        </h1>
      </header>

      {regularCategories.map((cat) =>
        cat.subCategories.length > 0 ? (
          <section
            key={cat.id}
            className="shisha-panel"
            aria-labelledby={`cat-heading-${cat.id}`}
          >
            <h2 id={`cat-heading-${cat.id}`} className="shisha-panel__heading">
              <span className="shisha-panel__icon">
                <CategoryIcon name={cat.icon} />
              </span>
              {cat.name}
              <span className="shisha-panel__icon">
                <CategoryIcon name={cat.icon} />
              </span>
            </h2>
            <p className="shisha-panel__tagline">Elevate your experience.</p>
            <div
              id={`cat-grid-${cat.id}`}
              className="category-grid category-grid--panel"
              role="list"
            >
              {cat.subCategories.map((sub) => (
                <CategoryTile
                  key={sub.id}
                  id={sub.id}
                  name={sub.name}
                  icon={sub.icon}
                  image={getImageUrl(sub.image)}
                  href="/menu"
                  state={{ subcategoryId: sub.id, categoryId: cat.id }}
                />
              ))}
            </div>
          </section>
        ) : (
          <div id="category-grid" key={cat.id} className="category-grid" role="list">
            <CategoryTile
              key={cat.id}
              id={cat.id}
              name={cat.name}
              icon={cat.icon}
              image={getImageUrl(cat.image)}
              href="/category"
              state={{ categoryId: cat.id, categoryName: cat.name }}
            />
          </div>
        )
      )}

      {shishaCategory && shishaCategory.subCategories.length > 0 && (
        <section className="shisha-panel" aria-labelledby="shisha-heading">
          <h2 id="shisha-heading" className="shisha-panel__heading">
            <span className="shisha-panel__icon">
              <CategoryIcon name="shisha" />
            </span>
            Shisha
            <span className="shisha-panel__icon">
              <CategoryIcon name="shisha" />
            </span>
          </h2>
          <p className="shisha-panel__tagline">Elevate your experience.</p>
          <div id="shisha-grid" className="category-grid category-grid--shisha" role="list">
            {shishaCategory.subCategories.map((sub) => (
              <CategoryTile
                key={sub.id}
                id={sub.id}
                name={sub.name}
                icon={sub.icon}
                image={getImageUrl(sub.image)}
                href="/menu"
                state={{ subcategoryId: sub.id, categoryId: shishaCategory.id }}
                variant="shisha"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function CategoriesPage() {
  return (
    <main className="page">
      <Header />
      <SessionDetails />
      <SessionGate>
        <CategoriesContent />
      </SessionGate>
    </main>
  );
}