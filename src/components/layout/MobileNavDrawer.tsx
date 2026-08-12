"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Smartphone, Headphones, Watch, Laptop, Car, ShieldCheck, Phone, ChevronRight } from "lucide-react";
import { GizmoLogo } from "../logo/GizmoLogo";
import { CATEGORIES } from "@/lib/constants";
import { Product } from "@/store/useCartStore";
import { formatLKR } from "@/lib/utils";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function MobileNavDrawerInner({ isOpen, onClose }: MobileNavDrawerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams?.get("category") || "all";

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const categoryIcons: Record<string, React.ReactNode> = {
    Smartphones: <Smartphone className="w-4 h-4 text-cyan-400" />,
    Audio: <Headphones className="w-4 h-4 text-cyan-400" />,
    Smartwatches: <Watch className="w-4 h-4 text-cyan-400" />,
    "Computer Accessories": <Laptop className="w-4 h-4 text-cyan-400" />,
    "Car Gadgets": <Car className="w-4 h-4 text-cyan-400" />,
  };

  // Lock body scroll when drawer is open & handle Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Live debounced search for mobile drawer
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.products || []);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error("Mobile drawer search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      onClose();
      router.push(`/products?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[85%] max-w-xs bg-slate-950 border-r border-slate-800/90 z-50 flex flex-col shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <GizmoLogo size="sm" />
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search Input */}
            <div className="p-4 border-b border-slate-800/80 relative">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => search.trim() && setShowSearchDropdown(true)}
                  placeholder="Search 100+ tech gadgets..."
                  className="w-full bg-slate-900 text-slate-100 text-xs pl-9 pr-8 py-2.5 rounded-xl border border-slate-700 focus:border-cyan-500 outline-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Live Search Autocomplete Dropdown inside Drawer */}
              {showSearchDropdown && search.trim() && (
                <div className="mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-800 z-50">
                  {isSearching ? (
                    <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                      Searching inventory...
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
                              onClose();
                            }}
                            className="flex items-center gap-2.5 p-2.5 hover:bg-slate-800 transition-colors"
                          >
                            <div className="w-8 h-8 relative rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
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
                            <span className="text-[11px] font-bold text-cyan-400">
                              {formatLKR(product.sellingPriceLkr)}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No gadgets found matching &quot;{search}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Categories List */}
            <div className="flex-1 p-4 space-y-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Product Categories
              </div>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <Link
                      key={cat.id}
                      href={cat.id === "all" ? "/products" : `/products?category=${encodeURIComponent(cat.id)}`}
                      onClick={onClose}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all border ${
                        isActive
                          ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-sm"
                          : "text-slate-200 hover:bg-slate-900 hover:text-cyan-400 border-transparent hover:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {categoryIcons[cat.id] || <Smartphone className="w-4 h-4 text-cyan-400" />}
                        <span>{cat.name}</span>
                      </div>
                      {isActive ? (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-neon animate-pulse"></span>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Sri Lanka Trust Info */}
              <div className="mt-6 p-3.5 bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/20 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-cyan-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Islandwide Cash On Delivery
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Quick doorstep delivery to all 25 districts in Sri Lanka with direct bank slip verification option.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-800 space-y-2 text-xs">
              <a
                href="https://wa.me/94771234567"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
              >
                <Phone className="w-4 h-4" />
                WhatsApp Order Support
              </a>
              <Link
                href="/admin"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-medium py-2 rounded-xl border border-slate-700"
              >
                Admin Dashboard
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function MobileNavDrawer(props: MobileNavDrawerProps) {
  return (
    <Suspense fallback={null}>
      <MobileNavDrawerInner {...props} />
    </Suspense>
  );
}


