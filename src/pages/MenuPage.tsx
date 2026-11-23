import { useMemo, useState } from "react";
import { useLocation, Navigate, Link } from "react-router-dom";
import { Header, type MenuView } from "@/components/layout/Header";
import { ProductCard, ProductCartAction } from "@/components/menu/ProductCard";
import { CategoryIcon } from "@/components/ui/Icon";
import { Loader, ErrorState } from "@/components/ui/StatusStates";
import { SessionGate } from "@/components/layout/SessionGate";
import { useSession } from "@/context/SessionContext";
import { useCategories } from "@/hooks/useCategories";
import { useMenuItems } from "@/hooks/useMenuItems";
import { formatAED } from "@/utils/format";
import { getImageUrl } from "@/utils/imageUrl";
import staticImage from "@/assets/images/staticimage.jpg";

type VegFilter = "veg" | "nonveg";

interface LocationState {
  subcategoryId?: string;
  categoryId?: string;
}

function MenuContent({
  subcategoryId,
  categoryId,
  menuView,
}: {
  subcategoryId: string;
  categoryId?: string;
  menuView: MenuView;
}) {
  const { session } = useSession();
  const [vegFilter, setVegFilter] = useState<VegFilter>("veg");

  // All categories (Food + Shisha, etc.) with their subcategories — used to
  // resolve this subcategory's display name/blurb/icon AND to render the
  // bottom "Categories" bar with every subcategory across every category
  // (not just the current one). Never blocks the items grid.
  const { categories, isLoading: catLoading } = useCategories(session.branchId, session.companyId);

  const { items, isLoading: itemsLoading, error: itemsError } = useMenuItems(session.branchId, subcategoryId, false);

  const filteredItems = useMemo(() => {
    if (vegFilter === "veg") return items.filter((p) => p.veg);
    if (vegFilter === "nonveg") return items.filter((p) => !p.veg);
    return items;
  }, [items, vegFilter]);

  // Flat list of every subcategory across every category, in category
  // display order (Food's subs, then Shisha's subs, etc.).
  const allSubCategories = useMemo(() => {
    const subCategories = categories.flatMap((category) => category.subCategories);
    const selectedIndex = subCategories.findIndex((subcategory) => subcategory.id === subcategoryId);
    if (selectedIndex <= 0) return subCategories;
    return [subCategories[selectedIndex], ...subCategories.slice(0, selectedIndex), ...subCategories.slice(selectedIndex + 1)];
  }, [categories, subcategoryId]);

  // Items are the only thing that can block this page — category/subcategory
  // details are "nice to have" for the header and bottom bar, and are
  // allowed to fail quietly.
  if (itemsLoading) return <Loader label="Loading menu…" />;
  if (itemsError) return <ErrorState message={itemsError} />;

  const resolvedSub = allSubCategories.find((s) => s.id === subcategoryId);
  const subName = resolvedSub?.name || "Menu";

  const parentCategory = categories.find((c) => c.id === (categoryId || resolvedSub?.categoryId));
  const isShisha = Boolean(
    parentCategory && (parentCategory.icon === "shisha" || parentCategory.id === "shisha" || /shisha/i.test(parentCategory.name))
  );

  // Subcategories that already say "Vegetarian" / "Non-Vegetarian" in their
  // own name (e.g. "Vegetarian Starters", "Non-Vegetarian Mains") are
  // already diet-specific — every item in them is the same type, so the
  // All/Veg/Non-Veg filter would be redundant. "Non-Vegetarian" also
  // contains "Vegetarian" as a substring, so this one check covers both.
  const isDietSpecificSub = Boolean(subName && /vegetarian/i.test(subName));
  const isEggSub = Boolean(subName && /egg/i.test(subName));
  // Beverages aren't meaningfully "veg/non-veg" either — skip the tabs there too.
  const isBeverageSub = Boolean(
    parentCategory && (parentCategory.icon === "beverage" || /beverages?/i.test(parentCategory.name))
  );
  const hasMissingFoodType = items.some((item) => !item.hasFoodType);

  const hideDietTabs = isShisha || isDietSpecificSub || isEggSub || isBeverageSub || hasMissingFoodType;
  const visibleItems = hideDietTabs ? items : filteredItems;

  return (
    <>
      <nav className="menu-toolbar menu-breadcrumb" aria-label="Breadcrumb">
        <ol className="menu-breadcrumb__list">
          <li>
            <Link to="/categories">Categories</Link>
          </li>
          {parentCategory && (
            <li>
              <span className="menu-breadcrumb__separator" aria-hidden="true">/</span>
              <Link
                to="/category"
                state={{ categoryId: parentCategory.id, categoryName: parentCategory.name }}
              >
                {parentCategory.name}
              </Link>
            </li>
          )}
          <li>
            <span className="menu-breadcrumb__separator" aria-hidden="true">/</span>
            <span className="menu-breadcrumb__current" aria-current="page">{subName}</span>
          </li>
        </ol>
      </nav>

      <header className="menu-hero">
        <h1 className="menu-hero__title">{subName}</h1>
        <span className="menu-hero__ornament" aria-hidden="true" />
        <p className="menu-hero__subtitle">
          {resolvedSub?.blurb || `Explore our handcrafted vegetarian & non-vegetarian ${subName.toLowerCase()}.`}
        </p>
      </header>

      {!hideDietTabs && (
        <div className="menu-tabs" role="tablist" aria-label="Dietary filter">
          <button
            type="button"
            className={`menu-tabs__btn${vegFilter === "veg" ? " is-active" : ""}`}
            role="tab"
            aria-selected={vegFilter === "veg"}
            onClick={() => setVegFilter("veg")}
          >
            Vegetarian {subName}
          </button>
          <button
            type="button"
            className={`menu-tabs__btn${vegFilter === "nonveg" ? " is-active" : ""}`}
            role="tab"
            aria-selected={vegFilter === "nonveg"}
            onClick={() => setVegFilter("nonveg")}
          >
            Non-Vegetarian {subName}
          </button>
        </div>
      )}

      {menuView === "grid" ? (
        <div id="product-grid" className="menu-grid">
          {visibleItems.length === 0 && <p className="menu-grid__empty">No items in this selection.</p>}
          {visibleItems.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      ) : (
        <div className="menu-table-wrap">
          <table className="menu-table">
            <thead>
              <tr>
                <th scope="col">Image</th>
                <th scope="col">Item</th>
                <th scope="col">Description</th>
                <th scope="col">Price</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.length === 0 ? (
                <tr>
                  <td className="menu-table__empty" colSpan={5}>No items in this selection.</td>
                </tr>
              ) : visibleItems.map((product) => (
                <tr key={product.id} data-product={product.id}>
                  <td>
                    <div className="menu-table__image">
                      <img
                        src={getImageUrl(product.image) || staticImage}
                        alt=""
                        width={400}
                        height={300}
                        loading="lazy"
                        decoding="async"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = staticImage;
                        }}
                      />
                    </div>
                  </td>
                  <th scope="row">{product.name}</th>
                  <td>{product.description || "—"}</td>
                  <td className="menu-table__price">{formatAED(product.price)}</td>
                  <td className="menu-table__action"><ProductCartAction product={product} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!catLoading && allSubCategories.length > 1 && (
        <section className="menu-categories" aria-labelledby="menu-cat-heading">
          <h2 id="menu-cat-heading" className="menu-categories__heading">
            <span>Categories</span>
          </h2>
          <div className="menu-categories__bar" role="navigation" aria-label="Menu categories">
            {allSubCategories.map((sub) => (
              <Link
                key={sub.id}
                to="/menu"
                state={{ subcategoryId: sub.id, categoryId: sub.categoryId }}
                className={`menu-categories__item${sub.id === subcategoryId ? " is-active" : ""}`}
                aria-label={sub.name}
              >
                <span className="menu-categories__icon">
                  <CategoryIcon name={sub.icon} />
                </span>
                <span className="menu-categories__label">{sub.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export function MenuPage() {
  // subcategoryId travels via router state (useLocation) instead of a
  // URL param, keeping the address bar short. This page is only ever
  // reached by clicking a subcategory tile, so a direct visit/refresh
  // without that state just bounces back to /categories.
  const location = useLocation();
  const [menuView, setMenuView] = useState<MenuView>("grid");
  const { subcategoryId } = (location.state as LocationState) || {};

  if (!subcategoryId) return <Navigate to="/categories" replace />;

  return (
    <main className="page menu-page">
      <Header menuView={menuView} onMenuViewChange={setMenuView} />
      <SessionGate>
        <MenuContent
          subcategoryId={subcategoryId}
          categoryId={((location.state as LocationState) || {}).categoryId}
          menuView={menuView}
        />
      </SessionGate>
    </main>
  );
}
