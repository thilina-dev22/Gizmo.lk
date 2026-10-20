import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Sparkles,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { GizmoLogo } from "../logo/GizmoLogo";
import { useCartStore, Product } from "@/store/useCartStore";
import { CATEGORIES, FALLBACK_PRODUCT_IMAGE } from "@/lib/constants";
import { formatLKR, safeParseImages } from "@/lib/utils";
import { useProductSearch } from "@/hooks/useProductSearch";
import { OptimizedImage } from "../common/OptimizedImage";

interface NavbarProps {
  onOpenMobileNav: () => void;
}

interface SearchResultsListProps {
  query: string;
  results: Product[];
  isSearching: boolean;
  maxResults: number;
  compact?: boolean;
  onNavigate: () => void;
}

function SearchResultsList({ query, results, isSearching, maxResults, compact, onNavigate }: SearchResultsListProps) {
  if (isSearching && results.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
        Searching Sri Lanka inventory...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400">
        No tech products found matching &quot;{query}&quot;
      </div>
    );
  }

  return (
    <div className={isSearching ? "opacity-60 transition-opacity" : "transition-opacity"}>
      {!compact && (
        <div className="px-4 py-2 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
          <span>Top matches</span>
          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          ) : (
            <span className="text-[10px] text-cyan-400">Live Match</span>
          )}
        </div>
      )}
      {results.slice(0, maxResults).map((product) => {
        const thumbUrl = safeParseImages(product.images)[0] || FALLBACK_PRODUCT_IMAGE;
        return (
          <Link
            key={product.id}
            to={`/products/${product.slug || product.id}`}
            onClick={onNavigate}
            className={`flex items-center gap-3 ${compact ? "p-2.5" : "p-3"} hover:bg-slate-800/80 transition-colors group`}
          >
            <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
              <OptimizedImage src={thumbUrl} alt={product.title} fill />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 truncate">
                {product.title}
              </h4>
              <span className="text-[11px] text-slate-400">{product.category}</span>
            </div>
            <span className="text-xs font-bold text-cyan-400 shrink-0">{formatLKR(product.sellingPriceLkr)}</span>
          </Link>
        );
      })}
      <Link
        to={`/products?search=${encodeURIComponent(query)}`}
        onClick={onNavigate}
        className="block text-center py-2.5 bg-slate-950/80 text-xs font-semibold text-cyan-400 hover:underline"
      >
        View all matching products &rarr;
      </Link>
    </div>
  );
}

export function Navbar({ onOpenMobileNav }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isCatalogPage = location.pathname === "/products";
  const categoryParam = searchParams.get("category");

  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const openCart = useCartStore((state) => state.openCart);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { results: searchResults, isSearching } = useProductSearch(searchQuery, 6);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Animate the cart badge each time the item count increases
  const [badgePulseKey, setBadgePulseKey] = useState(0);
  const previousCartCount = useRef(cartCount);
  useEffect(() => {
    if (cartCount > previousCartCount.current) setBadgePulseKey((key) => key + 1);
    previousCartCount.current = cartCount;
  }, [cartCount]);

  // Keep the search box in sync with the catalog's active search
  useEffect(() => {
    if (isCatalogPage) setSearchQuery(searchParams.get("search") || "");
  }, [isCatalogPage, searchParams]);

  // Close search dropdowns when navigating to another page
  useEffect(() => {
    setShowSearchDropdown(false);
    setIsMobileSearchOpen(false);
  }, [location.pathname]);

  // Close search dropdown on click outside & ESC key handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const insideDesktop = searchRef.current?.contains(target);
      const insideMobile = mobileSearchRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) {
        setShowSearchDropdown(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowSearchDropdown(false);
        setIsMobileSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      setShowSearchDropdown(false);
      setIsMobileSearchOpen(false);
      navigate(`/products?search=${encodeURIComponent(query)}`);
    }
  };

  const closeSearch = () => {
    setShowSearchDropdown(false);
    setIsMobileSearchOpen(false);
  };

  const hasQuery = searchQuery.trim().length > 0;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80 shadow-2xl">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Mobile Menu Trigger & Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-900 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to="/" className="shrink-0" aria-label="GizmoTek.lk home">
            <GizmoLogo size="md" />
          </Link>
        </div>

        {/* Center: Desktop Search Bar with Autocomplete */}
        <div ref={searchRef} className="hidden md:block flex-1 max-w-xl relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center" role="search">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => hasQuery && setShowSearchDropdown(true)}
              placeholder="Search 100+ tech gadgets, wireless earbuds, smartwatches..."
              aria-label="Search products"
              autoComplete="off"
              className="w-full bg-slate-900/90 text-slate-100 placeholder-slate-400 pl-11 pr-24 py-2.5 rounded-xl border border-slate-700/80 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-sm outline-none transition-all [&::-webkit-search-cancel-button]:hidden"
            />
            {isSearching && hasQuery ? (
              <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin" />
            ) : (
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            )}

            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-md flex items-center gap-1 cursor-pointer"
            >
              <span>Search</span>
            </button>
          </form>

          {/* Desktop Search Autocomplete Dropdown */}
          {showSearchDropdown && hasQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800 animate-slide-down">
              <SearchResultsList
                query={searchQuery.trim()}
                results={searchResults}
                isSearching={isSearching}
                maxResults={5}
                onNavigate={closeSearch}
              />
            </div>
          )}
        </div>

        {/* Right: Actions (Mobile Search Toggle, Catalog Link & Cart) */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => {
              setIsMobileSearchOpen(!isMobileSearchOpen);
              setShowSearchDropdown(!isMobileSearchOpen);
            }}
            className="md:hidden p-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-900 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            aria-label={isMobileSearchOpen ? "Close search" : "Open search"}
            aria-expanded={isMobileSearchOpen}
          >
            {isMobileSearchOpen ? (
              <X className="w-5 h-5 text-cyan-400" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>

          {/* Desktop Browse Catalog Button */}
          <Link
            to="/products"
            className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-colors px-3 py-2 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>Browse Catalog</span>
          </Link>

          {/* Cart Trigger */}
          <button
            type="button"
            onClick={openCart}
            className="relative flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-850 hover:from-slate-850 hover:to-slate-800 text-slate-200 px-3 sm:px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-md hover:border-cyan-500/50 transition-all group cursor-pointer"
            aria-label={`Open shopping cart (${cartCount} items)`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span
                  key={badgePulseKey}
                  className="absolute -top-2.5 -right-2.5 bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-extrabold text-[10px] min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shadow-neon animate-pop"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Cart</span>
              <span className="text-xs font-bold text-cyan-300">
                {cartCount > 0 ? `${cartCount} ${cartCount === 1 ? "item" : "items"}` : "Empty"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Bar with Autocomplete */}
      {isMobileSearchOpen && (
        <div ref={mobileSearchRef} className="md:hidden px-4 pb-3 pt-1 border-t border-slate-800/80 bg-slate-950/95 animate-slide-down">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center" role="search">
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              placeholder="Search earbuds, watches, chargers..."
              aria-label="Search products"
              autoComplete="off"
              className="w-full bg-slate-900 text-slate-100 placeholder-slate-400 pl-10 pr-20 py-2 rounded-xl border border-cyan-500/50 text-xs outline-none focus:ring-2 focus:ring-cyan-500/30 [&::-webkit-search-cancel-button]:hidden"
            />
            {isSearching && hasQuery ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            )}
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-cyan-500 text-slate-950 font-bold px-3 py-1 rounded-lg text-[11px] cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Mobile Live Search Results Dropdown */}
          {showSearchDropdown && hasQuery && (
            <div className="mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-800 animate-fade-in">
              <SearchResultsList
                query={searchQuery.trim()}
                results={searchResults}
                isSearching={isSearching}
                maxResults={4}
                compact
                onNavigate={closeSearch}
              />
            </div>
          )}
        </div>
      )}

      {/* Category Navigation Strip (Mobile & Desktop) */}
      <nav aria-label="Product categories" className="border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between text-xs font-medium text-slate-300">
          <div className="flex items-center space-x-1.5 py-2 overflow-x-auto touch-scroll no-scrollbar w-full lg:w-auto">
            {CATEGORIES.map((cat) => {
              const isActive =
                isCatalogPage &&
                (cat.id === "all"
                  ? !categoryParam || categoryParam === "all"
                  : categoryParam === cat.id);
              return (
                <Link
                  key={cat.id}
                  to={cat.id === "all" ? "/products" : `/products?category=${encodeURIComponent(cat.id)}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 text-xs ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40 shadow-sm"
                      : "bg-slate-900/60 lg:bg-transparent border border-slate-800 lg:border-transparent text-slate-300 hover:bg-slate-900 hover:text-cyan-400"
                  }`}
                >
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>}
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-3 py-2 text-slate-400 font-normal shrink-0 pl-4">
            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Exclusive Tech Deals Sri Lanka
            </span>
          </div>
        </div>
      </nav>
    </header>
  );
}
