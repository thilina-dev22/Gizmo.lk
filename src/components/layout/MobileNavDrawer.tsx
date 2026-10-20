import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Smartphone,
  Headphones,
  Watch,
  Laptop,
  Car,
  ShieldCheck,
  Phone,
  ChevronRight,
  Cable,
  HardDrive,
  Compass,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import { GizmoLogo } from "../logo/GizmoLogo";
import { CATEGORIES, FALLBACK_PRODUCT_IMAGE } from "@/lib/constants";
import { formatLKR, safeParseImages } from "@/lib/utils";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useProductSearch } from "@/hooks/useProductSearch";
import { OptimizedImage } from "../common/OptimizedImage";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <LayoutGrid className="w-4 h-4 text-cyan-400" />,
  Smartphones: <Smartphone className="w-4 h-4 text-cyan-400" />,
  "Chargers & Cables": <Cable className="w-4 h-4 text-cyan-400" />,
  "Storage & Pen Drives": <HardDrive className="w-4 h-4 text-cyan-400" />,
  Audio: <Headphones className="w-4 h-4 text-cyan-400" />,
  Wearables: <Watch className="w-4 h-4 text-cyan-400" />,
  "Computer Accessories": <Laptop className="w-4 h-4 text-cyan-400" />,
  "Car Gadgets": <Car className="w-4 h-4 text-cyan-400" />,
  "Outdoor & Gadgets": <Compass className="w-4 h-4 text-cyan-400" />,
};

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isCatalogPage = location.pathname === "/products";
  const categoryParam = searchParams.get("category");

  const [search, setSearch] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const { results: searchResults, isSearching } = useProductSearch(search, 4);

  useBodyScrollLock(isOpen);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setShowSearchDropdown(Boolean(search.trim()));
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      onClose();
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
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
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
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
                  aria-label="Search products"
                  autoComplete="off"
                  className="w-full bg-slate-900 text-slate-100 text-xs pl-9 pr-8 py-2.5 rounded-xl border border-slate-700 focus:border-cyan-500 outline-none"
                />
                {isSearching && search.trim() ? (
                  <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                )}
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Live Search Autocomplete Dropdown inside Drawer */}
              {showSearchDropdown && search.trim() && (
                <div className="mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-800 z-50 animate-slide-down">
                  {isSearching && searchResults.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      Searching inventory...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className={isSearching ? "opacity-60 transition-opacity" : "transition-opacity"}>
                      {searchResults.slice(0, 4).map((product) => {
                        const thumbUrl = safeParseImages(product.images)[0] || FALLBACK_PRODUCT_IMAGE;
                        return (
                          <Link
                            key={product.id}
                            to={`/products/${product.slug || product.id}`}
                            onClick={() => {
                              setShowSearchDropdown(false);
                              onClose();
                            }}
                            className="flex items-center gap-2.5 p-2.5 hover:bg-slate-800 transition-colors"
                          >
                            <div className="w-8 h-8 relative rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                              <OptimizedImage src={thumbUrl} alt={product.title} fill />
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
                  const isActive =
                    isCatalogPage &&
                    (cat.id === "all"
                      ? !categoryParam || categoryParam === "all"
                      : categoryParam === cat.id);
                  return (
                    <Link
                      key={cat.id}
                      to={cat.id === "all" ? "/products" : `/products?category=${encodeURIComponent(cat.id)}`}
                      onClick={onClose}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all border ${
                        isActive
                          ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-sm"
                          : "text-slate-200 hover:bg-slate-900 hover:text-cyan-400 border-transparent hover:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {CATEGORY_ICONS[cat.id] || <Smartphone className="w-4 h-4 text-cyan-400" />}
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

              {/* Policy & Legal Links */}
              <div className="pt-2 space-y-1">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Store Policies
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <Link
                    to="/terms-and-conditions"
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-cyan-400"
                  >
                    Terms &amp; Conditions
                  </Link>
                  <Link
                    to="/privacy-policy"
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-cyan-400"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    to="/return-policy"
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-cyan-400"
                  >
                    Return Policy
                  </Link>
                  <Link
                    to="/shipping-policy"
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-cyan-400"
                  >
                    Shipping Policy
                  </Link>
                  <Link
                    to="/faq"
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-cyan-400"
                  >
                    FAQ &amp; Help
                  </Link>
                  <Link
                    to="/contact"
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-cyan-400 col-span-2"
                  >
                    Contact Customer Care ➔
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-800 space-y-2 text-xs">
              <a
                href="https://wa.me/94721410369"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
              >
                <Phone className="w-4 h-4" />
                WhatsApp Order Support
              </a>
              <Link
                to="/admin"
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
