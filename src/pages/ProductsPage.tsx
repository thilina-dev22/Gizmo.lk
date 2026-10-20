import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/common/Skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { Product } from "@/store/useCartStore";
import { CATEGORIES } from "@/lib/constants";
import { formatLKR } from "@/lib/utils";
import { apiFetch, getErrorMessage, isAbortError } from "@/lib/api";
import { Filter, SlidersHorizontal, Search, RefreshCw, X, PackageCheck } from "lucide-react";
import { SEOHead } from "@/components/common/SEOHead";

const SORT_OPTIONS = [
  { id: "newest", label: "Newest Arrivals" },
  { id: "bestsellers", label: "Best Sellers" },
  { id: "rating", label: "Top Rated" },
  { id: "price-low", label: "Price: Low to High" },
  { id: "price-high", label: "Price: High to Low" },
];

const PRICE_SLIDER_STEP = 1000;

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // The URL is the single source of truth so filters survive refresh, back/forward & sharing
  const category = searchParams.get("category") || "all";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || (key === "category" && value === "all") || (key === "sort" && value === "newest")) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (search) params.set("search", search);
    params.set("sort", sort);

    setLoading(true);
    setError(null);
    apiFetch<{ products: Product[] }>(`/api/products?${params.toString()}`, { signal: controller.signal })
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch((err) => {
        // Ignore responses for filters the user has already moved away from
        if (isAbortError(err)) return;
        setError(getErrorMessage(err, "We couldn't load products right now."));
        setLoading(false);
      });

    return () => controller.abort();
  }, [category, search, sort, reloadKey]);

  // Price slider bounds follow the loaded products
  const highestPrice = useMemo(() => {
    const max = products.reduce((highest, p) => Math.max(highest, p.sellingPriceLkr), 0);
    return Math.max(PRICE_SLIDER_STEP, Math.ceil(max / PRICE_SLIDER_STEP) * PRICE_SLIDER_STEP);
  }, [products]);

  // Reset the price cap when the result set changes so new results aren't hidden
  useEffect(() => {
    setMaxPrice(null);
  }, [category, search]);

  const effectiveMaxPrice = maxPrice ?? highestPrice;
  const isPriceFiltered = maxPrice !== null && maxPrice < highestPrice;

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) => p.sellingPriceLkr <= effectiveMaxPrice && (!inStockOnly || p.stock > 0)
      ),
    [products, effectiveMaxPrice, inStockOnly]
  );

  const hasActiveFilters = category !== "all" || Boolean(search) || isPriceFiltered || inStockOnly;
  const categoryLabel = CATEGORIES.find((c) => c.id === category)?.name || category;

  const resetFilters = () => {
    setMaxPrice(null);
    setInStockOnly(false);
    setSearchParams(sort !== "newest" ? { sort } : {});
  };

  const pageTitle = search
    ? `Search results for "${search}" | GizmoTek.lk`
    : category !== "all"
    ? `Buy ${categoryLabel} Online in Sri Lanka | GizmoTek.lk`
    : "All Tech Products & Electronics in Sri Lanka | GizmoTek.lk";

  const pageDescription = category !== "all"
    ? `Shop top-rated ${categoryLabel} in Sri Lanka. Guaranteed authentic products with Islandwide Cash on Delivery (COD) & 2-4 day delivery at GizmoTek.lk.`
    : "Explore 100+ trending tech products, wireless earbuds, smartwatches, power banks & PC gear with islandwide delivery across Sri Lanka.";

  const categoryQuery = category !== "all" ? `?category=${encodeURIComponent(category)}` : "";

  const collectionJsonLd = useMemo(
    () => [
      {
        "@type": "CollectionPage",
        "@id": `https://gizmotek.lk/products${categoryQuery}#collection`,
        "name": pageTitle,
        "description": pageDescription,
        "url": `https://gizmotek.lk/products${categoryQuery}`,
        "numberOfItems": filteredProducts.length,
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://gizmotek.lk/",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": category !== "all" ? categoryLabel : "Products",
            "item": `https://gizmotek.lk/products${categoryQuery}`,
          },
        ],
      },
    ],
    [categoryQuery, pageTitle, pageDescription, filteredProducts.length, category, categoryLabel]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        keywords={`${categoryLabel}, buy ${categoryLabel} online Sri Lanka, electronics Sri Lanka, gadgets Colombo, GizmoTek.lk`}
        canonical={`https://gizmotek.lk/products${categoryQuery}`}
        noIndex={Boolean(search)}
        jsonLd={collectionJsonLd}
      />

      {/* Header Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {search ? `Results for "${search}"` : category === "all" ? "All Electronics & Gadgets" : categoryLabel}
          </h1>
          <p className="text-xs text-slate-400 mt-1" aria-live="polite">
            {loading
              ? "Loading products…"
              : `Showing ${filteredProducts.length} of ${products.length} tech products with Islandwide Sri Lanka delivery.`}
          </p>
        </div>

        {/* Top Control Bar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            aria-expanded={isMobileFilterOpen}
            className="md:hidden flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>Filters</span>
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
          </button>

          {/* Sort Dropdown */}
          <label className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Sort By:</span>
            <select
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              aria-label="Sort products"
              className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id} className="bg-slate-900">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-4 text-[11px] animate-fade-in">
          {search && (
            <button
              type="button"
              onClick={() => updateParams({ search: null })}
              className="inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full font-semibold hover:bg-cyan-500/20 cursor-pointer"
            >
              Search: “{search}” <X className="w-3 h-3" />
            </button>
          )}
          {category !== "all" && (
            <button
              type="button"
              onClick={() => updateParams({ category: null })}
              className="inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full font-semibold hover:bg-cyan-500/20 cursor-pointer"
            >
              {categoryLabel} <X className="w-3 h-3" />
            </button>
          )}
          {isPriceFiltered && (
            <button
              type="button"
              onClick={() => setMaxPrice(null)}
              className="inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full font-semibold hover:bg-cyan-500/20 cursor-pointer"
            >
              Under {formatLKR(effectiveMaxPrice)} <X className="w-3 h-3" />
            </button>
          )}
          {inStockOnly && (
            <button
              type="button"
              onClick={() => setInStockOnly(false)}
              className="inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full font-semibold hover:bg-cyan-500/20 cursor-pointer"
            >
              In stock only <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={resetFilters}
            className="text-slate-400 hover:text-cyan-400 font-semibold underline-offset-2 hover:underline cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-6">
        {/* Sidebar Filters (Desktop) */}
        <aside className={`space-y-6 md:block ${isMobileFilterOpen ? "block animate-slide-down" : "hidden"}`}>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-6 md:sticky md:top-32">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-cyan-400" />
                <span>Filter Inventory</span>
              </h3>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-semibold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Category
              </span>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      updateParams({ category: cat.id });
                      setIsMobileFilterOpen(false);
                    }}
                    aria-pressed={category === cat.id}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                      category === cat.id
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "text-slate-300 hover:bg-slate-850 hover:text-white border border-transparent"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {category === cat.id && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <label className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs cursor-pointer">
              <span className="flex items-center gap-2 font-semibold text-slate-300">
                <PackageCheck className="w-4 h-4 text-emerald-400" />
                In stock only
              </span>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </label>

            {/* Price Filter (LKR) */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <label htmlFor="max-price" className="font-semibold text-slate-400 uppercase tracking-wider">
                  Max Price (LKR)
                </label>
                <span className="font-bold text-cyan-400">{formatLKR(effectiveMaxPrice)}</span>
              </div>
              <input
                id="max-price"
                type="range"
                min={PRICE_SLIDER_STEP}
                max={highestPrice}
                step={PRICE_SLIDER_STEP}
                value={effectiveMaxPrice}
                disabled={loading || products.length === 0}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>{formatLKR(PRICE_SLIDER_STEP)}</span>
                <span>{formatLKR(highestPrice)}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="md:col-span-3">
          {loading ? (
            <ProductGridSkeleton count={9} className="grid-cols-2 md:grid-cols-2 lg:grid-cols-3" />
          ) : error ? (
            <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-200 text-base">
                {search ? `No products match “${search}”` : "No tech products match your filters"}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try a different search term, select another category, or adjust your maximum price.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
