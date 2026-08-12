"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  Phone,
  Truck,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { GizmoLogo } from "../logo/GizmoLogo";
import { useCartStore, Product } from "@/store/useCartStore";
import { CATEGORIES } from "@/lib/constants";
import { formatLKR } from "@/lib/utils";

interface NavbarProps {
  onOpenMobileNav: () => void;
}

function NavbarInner({ onOpenMobileNav }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCatalogPage = pathname === "/products";
  const categoryParam = searchParams?.get("category");

  const { getTotalCount, openCart } = useCartStore();
  const cartCount = getTotalCount();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Debounced search query handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.products || []);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on click outside & ESC key handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
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
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      setIsMobileSearchOpen(false);
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80 shadow-2xl">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Mobile Menu Trigger & Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-900 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/" className="shrink-0">
            <GizmoLogo size="md" />
          </Link>
        </div>

        {/* Center: Desktop Search Bar with Autocomplete */}
        <div ref={searchRef} className="hidden md:block flex-1 max-w-xl relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
              placeholder="Search 100+ tech gadgets, wireless earbuds, smartwatches..."
              className="w-full bg-slate-900/90 text-slate-100 placeholder-slate-400 pl-11 pr-24 py-2.5 rounded-xl border border-slate-700/80 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-sm outline-none transition-all"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-md flex items-center gap-1"
            >
              <span>Search</span>
            </button>
          </form>

          {/* Desktop Search Autocomplete Dropdown */}
          {showSearchDropdown && !isMobileSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  Searching Sri Lanka inventory...
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  <div className="px-4 py-2 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                    <span>Found {searchResults.length} Products</span>
                    <span className="text-[10px] text-cyan-400">Live Match</span>
                  </div>
                  {searchResults.slice(0, 5).map((product) => {
                    const imgs = JSON.parse(product.images || "[]");
                    const thumbUrl = imgs[0] || "/placeholder.jpg";
                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        onClick={() => setShowSearchDropdown(false)}
                        className="flex items-center gap-3 p-3 hover:bg-slate-800/80 transition-colors group"
                      >
                        <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                          <Image
                            src={thumbUrl}
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 truncate">
                            {product.title}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            {product.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-cyan-400">
                            {formatLKR(product.sellingPriceLkr)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                  <Link
                    href={`/products?search=${encodeURIComponent(searchQuery)}`}
                    onClick={() => setShowSearchDropdown(false)}
                    className="block text-center py-2.5 bg-slate-950/80 text-xs font-medium text-cyan-400 hover:underline"
                  >
                    View all matching products &rarr;
                  </Link>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No tech products found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions (Mobile Search Toggle, Catalog Link & Cart) */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Search Button */}
          <button
            onClick={() => {
              setIsMobileSearchOpen(!isMobileSearchOpen);
              setShowSearchDropdown(true);
            }}
            className="md:hidden p-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-900 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Toggle Search Bar"
          >
            {isMobileSearchOpen ? (
              <X className="w-5 h-5 text-cyan-400" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>

          {/* Desktop Browse Catalog Button */}
          <Link
            href="/products"
            className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-colors px-3 py-2 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>Browse Catalog</span>
          </Link>

          {/* Cart Trigger */}
          <button
            onClick={openCart}
            className="relative flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-850 hover:from-slate-850 hover:to-slate-800 text-slate-200 px-3 sm:px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-md hover:border-cyan-500/50 transition-all group"
            aria-label="Open Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-2.5 -right-2.5 bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-neon animate-bounce">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Cart</span>
              <span className="text-xs font-bold text-cyan-300">
                {cartCount > 0 ? `${cartCount} items` : "Empty"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Bar with Autocomplete */}
      {isMobileSearchOpen && (
        <div ref={mobileSearchRef} className="md:hidden px-4 pb-3 pt-1 border-t border-slate-800/80 bg-slate-950/95 animate-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search earbuds, watches, dashcams..."
              className="w-full bg-slate-900 text-slate-100 placeholder-slate-400 pl-10 pr-20 py-2 rounded-xl border border-cyan-500/50 text-xs outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-cyan-500 text-slate-950 font-bold px-3 py-1 rounded-lg text-[11px]"
            >
              Search
            </button>
          </form>

          {/* Mobile Live Search Results Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-800">
              {isSearching ? (
                <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  {searchResults.slice(0, 4).map((product) => {
                    const imgs = JSON.parse(product.images || "[]");
                    const thumbUrl = imgs[0] || "/placeholder.jpg";
                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          setIsMobileSearchOpen(false);
                        }}
                        className="flex items-center gap-3 p-2.5 hover:bg-slate-800 transition-colors"
                      >
                        <div className="w-9 h-9 relative rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                          <Image src={thumbUrl} alt={product.title} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-200 truncate">
                            {product.title}
                          </h4>
                          <span className="text-[10px] text-cyan-400/80">
                            {product.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-cyan-400">
                            {formatLKR(product.sellingPriceLkr)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                  <Link
                    href={`/products?search=${encodeURIComponent(searchQuery)}`}
                    onClick={() => {
                      setShowSearchDropdown(false);
                      setIsMobileSearchOpen(false);
                    }}
                    className="block text-center py-2 bg-slate-950 text-[11px] font-semibold text-cyan-400"
                  >
                    See all results ({searchResults.length}) &rarr;
                  </Link>
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-400">
                  No gadgets found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Category Navigation Strip (Desktop) */}
      <div className="hidden lg:block border-t border-slate-800/60 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs font-medium text-slate-300">
          <div className="flex items-center space-x-1 py-2 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive =
                isCatalogPage &&
                (cat.id === "all"
                  ? !categoryParam || categoryParam === "all"
                  : categoryParam === cat.id);
              return (
                <Link
                  key={cat.id}
                  href={cat.id === "all" ? "/products" : `/products?category=${encodeURIComponent(cat.id)}`}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/30"
                      : "hover:bg-slate-900 hover:text-cyan-400"
                  }`}
                >
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>}
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3 py-2 text-slate-400 font-normal">
            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Exclusive Tech Deals Sri Lanka
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Navbar(props: NavbarProps) {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80 shadow-2xl h-16 flex items-center px-6">
          <GizmoLogo size="md" />
        </header>
      }
    >
      <NavbarInner {...props} />
    </Suspense>
  );
}


