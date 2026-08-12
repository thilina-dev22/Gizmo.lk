"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { Product } from "@/store/useCartStore";
import { CATEGORIES } from "@/lib/constants";
import { formatLKR } from "@/lib/utils";
import { Filter, SlidersHorizontal, Search, RefreshCw } from "lucide-react";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = searchParams.get("category") || "all";
  const initialSearch = searchParams.get("search") || "";
  const initialSort = searchParams.get("sort") || "newest";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);
  const [maxPrice, setMaxPrice] = useState<number>(30000);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [category, sort, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category && category !== "all") params.append("category", category);
      if (search) params.append("search", search);
      if (sort) params.append("sort", sort);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Fetch products page error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) => p.sellingPriceLkr <= maxPrice
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {category === "all" ? "All Electronics & Gadgets" : category}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Showing {filteredProducts.length} high-converting dropshipping products with Islandwide Sri Lanka delivery.
          </p>
        </div>

        {/* Top Control Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="md:hidden flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold"
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>Filters</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Sort By:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-slate-900">Newest Arrivals</option>
              <option value="price-low" className="bg-slate-900">Price: Low to High</option>
              <option value="price-high" className="bg-slate-900">Price: High to Low</option>
              <option value="bestsellers" className="bg-slate-900">Best Sellers</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-8">
        {/* Sidebar Filters (Desktop) */}
        <div className={`space-y-6 md:block ${isMobileFilterOpen ? "block" : "hidden"}`}>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-cyan-400" />
                <span>Filter Inventory</span>
              </h3>
              {(category !== "all" || search || maxPrice < 30000) && (
                <button
                  onClick={() => {
                    setCategory("all");
                    setSearch("");
                    setMaxPrice(30000);
                    router.push("/products");
                  }}
                  className="text-[11px] font-semibold text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Category
              </label>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                      category === cat.id
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "text-slate-300 hover:bg-slate-850 hover:text-white"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {category === cat.id && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter (LKR) */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-400 uppercase tracking-wider">
                  Max Price (LKR)
                </label>
                <span className="font-bold text-cyan-400">{formatLKR(maxPrice)}</span>
              </div>
              <input
                type="range"
                min={2000}
                max={30000}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Rs. 2,000</span>
                <span>Rs. 30,000+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-80 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse p-4 space-y-4"
                >
                  <div className="h-44 bg-slate-800 rounded-xl"></div>
                  <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-200 text-base">No tech products match your filters</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try selecting a different category or adjusting your maximum price slider in LKR.
              </p>
              <button
                onClick={() => {
                  setCategory("all");
                  setSearch("");
                  setMaxPrice(30000);
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
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

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading catalog...</span>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
