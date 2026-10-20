import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, ShieldCheck } from "lucide-react";
import { getCartItemKey, useCartStore } from "@/store/useCartStore";
import { calculateShippingFee, formatLKR, getMaxPurchasableQuantity, safeParseImages } from "@/lib/utils";
import { FALLBACK_PRODUCT_IMAGE, FREE_SHIPPING_THRESHOLD_LKR } from "@/lib/constants";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { OptimizedImage } from "../common/OptimizedImage";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getSubtotal, getTotalCount } = useCartStore();

  const subtotal = getSubtotal();
  const totalUnits = getTotalCount();
  const shippingFee = calculateShippingFee(undefined, subtotal);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_LKR - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD_LKR) * 100);

  useBodyScrollLock(isOpen);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[450px] bg-slate-950 border-l border-slate-800 z-50 flex flex-col shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-base">Your Shopping Cart</h3>
                <span className="bg-cyan-500/20 text-cyan-400 font-extrabold text-xs px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {totalUnits} {totalUnits === 1 ? "item" : "items"}
                </span>
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress Meter */}
            {items.length > 0 && (
              <div className="p-3.5 bg-gradient-to-r from-slate-900 to-cyan-950/40 border-b border-slate-800/80 text-xs">
                <div className="flex items-center justify-between font-semibold mb-1.5">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Truck className="w-4 h-4 text-cyan-400" />
                    {remainingForFreeShipping === 0 ? (
                      <span className="text-emerald-400 font-bold">🎉 You unlocked FREE Islandwide Delivery!</span>
                    ) : (
                      <span>Add <strong className="text-cyan-400">{formatLKR(remainingForFreeShipping)}</strong> for Free Delivery</span>
                    )}
                  </span>
                  <span className="text-slate-400 text-[11px]">{Math.round(freeShippingProgress)}%</span>
                </div>
                <div
                  className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(freeShippingProgress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progress towards free delivery"
                >
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      remainingForFreeShipping === 0
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                        : "bg-gradient-to-r from-cyan-500 to-cyan-400"
                    }`}
                    style={{ width: `${freeShippingProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-800/60 touch-scroll">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">Your cart is currently empty</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Explore our hot trending premium tech gadgets with islandwide cash on delivery in Sri Lanka.
                    </p>
                  </div>
                  <Link
                    to="/products"
                    onClick={closeCart}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-neon transition-all"
                  >
                    Start Shopping Now
                  </Link>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const { product, quantity, selectedColor, selectedVariant, warranty } = item;
                    const itemKey = getCartItemKey(item);
                    const maxQuantity = getMaxPurchasableQuantity(product.stock);
                    const thumb = safeParseImages(product.images)[0] || FALLBACK_PRODUCT_IMAGE;
                    return (
                      <motion.div
                        key={itemKey}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40, height: 0, paddingTop: 0, marginTop: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pt-3 first:pt-0 flex gap-3 overflow-hidden"
                      >
                        {/* Product Thumbnail */}
                        <Link
                          to={`/products/${product.slug || product.id}`}
                          onClick={closeCart}
                          className="w-16 h-16 relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0"
                        >
                          <OptimizedImage src={thumb} alt={product.title} fill />
                        </Link>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">
                                {product.title}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeItem(itemKey)}
                                className="text-slate-500 hover:text-red-400 transition-colors p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
                                title="Remove item"
                                aria-label={`Remove ${product.title} from cart`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Variant / Color & Warranty Tag */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400">{product.category}</span>
                              {selectedColor && (
                                <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/20 px-1.5 rounded">
                                  Color: {selectedColor}
                                </span>
                              )}
                              {selectedVariant && (
                                <span className="text-[10px] text-slate-300 bg-slate-800 px-1.5 rounded font-mono">
                                  {selectedVariant}
                                </span>
                              )}
                              {warranty && (
                                <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 rounded">
                                  🛡️ {warranty}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            {/* Quantity control */}
                            <div className="flex items-center border border-slate-700/80 rounded-lg bg-slate-900/90 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => updateQuantity(itemKey, quantity - 1)}
                                aria-label="Decrease quantity"
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2.5 text-xs font-bold text-slate-100 tabular-nums" aria-live="polite">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(itemKey, quantity + 1)}
                                disabled={quantity >= maxQuantity}
                                aria-label="Increase quantity"
                                title={quantity >= maxQuantity ? "Maximum available quantity reached" : undefined}
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Line total */}
                            <span className="text-xs font-extrabold text-cyan-400">
                              {formatLKR(product.sellingPriceLkr * quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer Summary & Checkout Action */}
            {items.length > 0 && (
              <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-800 bg-slate-900/95 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-200">{formatLKR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Islandwide Delivery</span>
                    <span className="font-medium text-slate-300">
                      {shippingFee === 0 ? (
                        <span className="text-emerald-400 font-bold">FREE</span>
                      ) : (
                        formatLKR(shippingFee)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-100 pt-2 border-t border-slate-800">
                    <span>Estimated Total (LKR)</span>
                    <span className="text-cyan-400 font-extrabold text-base">{formatLKR(subtotal + shippingFee)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Choose Cash on Delivery or Bank Deposit Slip Upload at next step.</span>
                </div>

                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-extrabold text-sm py-3.5 rounded-xl shadow-neon transition-all active:scale-[0.99]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
