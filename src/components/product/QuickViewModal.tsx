"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Truck, ShieldCheck, Check, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatLKR } from "@/lib/utils";

export function QuickViewModal() {
  const { quickViewProduct, setQuickViewProduct, addItem } = useCartStore();

  if (!quickViewProduct) return null;

  const images = JSON.parse(quickViewProduct.images || "[]");
  const mainImage = images[0] || "/placeholder.jpg";
  const specs = quickViewProduct.specs ? JSON.parse(quickViewProduct.specs) : {};

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setQuickViewProduct(null)}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10 p-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={() => setQuickViewProduct(null)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-950 border border-slate-800 transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Preview */}
            <div className="relative h-64 md:h-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
              <Image
                src={mainImage}
                alt={quickViewProduct.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Product Details */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  {quickViewProduct.category}
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-1 leading-snug">
                  {quickViewProduct.title}
                </h3>
                <div className="mt-2 text-xl font-extrabold text-cyan-400">
                  {formatLKR(quickViewProduct.sellingPriceLkr)}
                </div>
                <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed">
                  {quickViewProduct.description}
                </p>

                {/* Key Specs */}
                {Object.keys(specs).length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                    {Object.entries(specs).slice(0, 3).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-slate-400">
                        <span>{key}:</span>
                        <span className="font-semibold text-slate-200">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    addItem(quickViewProduct);
                    setQuickViewProduct(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold py-3 rounded-xl shadow-neon transition-all text-xs"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart & Checkout</span>
                </button>

                <Link
                  href={`/products/${quickViewProduct.id}`}
                  onClick={() => setQuickViewProduct(null)}
                  className="w-full flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold py-2.5 rounded-xl border border-slate-800 text-xs"
                >
                  <span>View Full Specs & Gallery</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
