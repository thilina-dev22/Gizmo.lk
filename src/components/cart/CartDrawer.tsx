"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, Sparkles, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatLKR } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD_LKR } from "@/lib/constants";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getSubtotal } = useCartStore();

  const subtotal = getSubtotal();
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_LKR - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD_LKR) * 100);

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
          <motion.div
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
                  {items.length}
                </span>
              </div>
              <button
                onClick={closeCart}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress Meter */}
            <div className="p-3.5 bg-gradient-to-r from-slate-900 to-cyan-950/40 border-b border-slate-800/80 text-xs">
              <div className="flex items-center justify-between font-semibold mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  {remainingForFreeShipping === 0 ? (
                    <span className="text-emerald-400 font-bold">🎉 You unlocked FREE Islandwide Shipping!</span>
                  ) : (
                    <span>Add <strong className="text-cyan-400">{formatLKR(remainingForFreeShipping)}</strong> for Free Delivery</span>
                  )}
                </span>
                <span className="text-slate-400 text-[11px]">{Math.round(freeShippingProgress)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${freeShippingProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-800/60">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">Your cart is currently empty</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Explore our hot trending dropshipping tech gadgets with islandwide cash on delivery in Sri Lanka.
                    </p>
                  </div>
                  <button
                    onClick={closeCart}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-neon transition-all"
                  >
                    Start Shopping Now
                  </button>
                </div>
              ) : (
                items.map(({ product, quantity }) => {
                  const imgs = JSON.parse(product.images || "[]");
                  const thumb = imgs[0] || "/placeholder.jpg";
                  return (
                    <div key={product.id} className="pt-3 first:pt-0 flex gap-3">
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                        <Image src={thumb} alt={product.title} fill className="object-cover" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">
                              {product.title}
                            </h4>
                            <button
                              onClick={() => removeItem(product.id)}
                              className="text-slate-500 hover:text-red-400 transition-colors p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[11px] text-slate-400">{product.category}</span>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity control */}
                          <div className="flex items-center border border-slate-700/80 rounded-lg bg-slate-900/90 overflow-hidden">
                            <button
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-bold text-slate-100">{quantity}</span>
                            <button
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Line total */}
                          <span className="text-xs font-extrabold text-cyan-400">
                            {formatLKR(product.sellingPriceLkr * quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary & Checkout Action */}
            {items.length > 0 && (
              <div className="p-4 border-t border-slate-800 bg-slate-900/90 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-200">{formatLKR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Shipping</span>
                    <span className="font-medium text-slate-300">
                      {subtotal >= FREE_SHIPPING_THRESHOLD_LKR ? (
                        <span className="text-emerald-400 font-bold">FREE</span>
                      ) : (
                        "Calculated at checkout"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-100 pt-2 border-t border-slate-800">
                    <span>Total (LKR)</span>
                    <span className="text-cyan-400 font-extrabold text-base">{formatLKR(subtotal)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Choose Cash on Delivery or Bank Deposit Slip Upload at next step.</span>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-extrabold text-sm py-3 rounded-xl shadow-neon transition-all"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
