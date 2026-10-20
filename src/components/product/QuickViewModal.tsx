import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { Product, useCartStore } from "@/store/useCartStore";
import { formatLKR, getDefaultCartOptions, getProductOptions, getStockStatus, safeParseImages } from "@/lib/utils";
import { FALLBACK_PRODUCT_IMAGE } from "@/lib/constants";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { OptimizedImage } from "../common/OptimizedImage";

export function QuickViewModal() {
  const quickViewProduct = useCartStore((state) => state.quickViewProduct);
  const setQuickViewProduct = useCartStore((state) => state.setQuickViewProduct);
  const addItem = useCartStore((state) => state.addItem);
  const isOpen = Boolean(quickViewProduct);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuickViewProduct(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setQuickViewProduct]);

  const close = () => setQuickViewProduct(null);

  return (
    <AnimatePresence>
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={quickViewProduct.title}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          {/* Modal Window */}
          <QuickViewContent
            key={quickViewProduct.id}
            product={quickViewProduct}
            onClose={close}
            onAdd={() => {
              addItem(quickViewProduct, 1, getDefaultCartOptions(quickViewProduct.specs));
              close();
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}

interface QuickViewContentProps {
  product: Product;
  onClose: () => void;
  onAdd: () => void;
}

function QuickViewContent({ product, onClose, onAdd }: QuickViewContentProps) {
  const images = safeParseImages(product.images);
  const mainImage = images[0] || FALLBACK_PRODUCT_IMAGE;
  const { specs, warranty } = getProductOptions(product.specs);
  const stockStatus = getStockStatus(product.stock);

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
      className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10 p-6 max-h-[90vh] overflow-y-auto"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close quick view"
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-950 border border-slate-800 transition-colors z-20 cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Preview */}
        <div className="relative h-64 md:h-full min-h-[240px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
          <OptimizedImage src={mainImage} alt={product.title} fill priority />
        </div>

        {/* Product Details */}
        <div className="space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              {product.category}
            </span>
            <h3 className="text-lg font-bold text-slate-100 mt-1 leading-snug pr-8">
              {product.title}
            </h3>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xl font-extrabold text-cyan-400">{formatLKR(product.sellingPriceLkr)}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  stockStatus.tone === "out"
                    ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
                    : stockStatus.tone === "low"
                    ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                    : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                }`}
              >
                {stockStatus.label}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed">
              {product.description}
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{warranty}</span>
            </div>

            {/* Key Specs */}
            {Object.keys(specs).length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                {Object.entries(specs)
                  .filter(([key]) => !["Warranty", "warranty", "VariantType"].includes(key))
                  .slice(0, 4)
                  .map(([key, val]) => (
                    <div key={key} className="flex justify-between gap-3 text-slate-400">
                      <span>{key}:</span>
                      <span className="font-semibold text-slate-200 text-right">{String(val)}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onAdd}
              disabled={!stockStatus.canBuy}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold py-3 rounded-xl shadow-neon transition-all text-xs cursor-pointer disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{stockStatus.canBuy ? "Add to Cart" : "Out of Stock"}</span>
            </button>

            <Link
              to={`/products/${product.slug || product.id}`}
              onClick={onClose}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 font-semibold py-2.5 rounded-xl border border-slate-800 text-xs"
            >
              <span>View Full Specs, Colors & Gallery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
