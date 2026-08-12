"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore, Product } from "@/store/useCartStore";
import { formatLKR } from "@/lib/utils";
import {
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  Banknote,
  Building2,
  Plus,
  Minus,
  Check,
  Star,
  ExternalLink,
} from "lucide-react";

interface ClientProps {
  product: Product;
  images: string[];
  specs: Record<string, string>;
}

export function ProductDetailClient({ product, images, specs }: ClientProps) {
  const router = useRouter();
  const { addItem, openCart } = useCartStore();

  const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop";

  const initialImage = images[0] || FALLBACK_IMAGE;
  const [activeImage, setActiveImage] = useState(initialImage);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    openCart();
    router.push("/checkout");
  };

  const whatsappMessage = encodeURIComponent(
    `Hi Gizmo.lk! I want to order:\n*Product*: ${product.title}\n*Price*: Rs. ${product.sellingPriceLkr.toLocaleString()}\n*Qty*: ${quantity}\n*Link*: https://gizmo-lk.vercel.app/products/${product.id}`
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Left: Gallery (6 cols) */}
      <div className="lg:col-span-6 space-y-4">
        <div className="relative h-96 sm:h-[450px] w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
          <Image
            src={activeImage}
            alt={product.title}
            fill
            className="object-cover"
            priority
            onError={() => setActiveImage(FALLBACK_IMAGE)}
          />
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            {product.isBestSeller && (
              <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full shadow">
                Best Seller
              </span>
            )}
            <span className="bg-cyan-500/20 text-cyan-400 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full border border-cyan-500/30">
              {product.category}
            </span>
          </div>
        </div>

        {/* Thumbnail Selector */}
        {images.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {images.map((imgUrl, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(imgUrl)}
                className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                  activeImage === imgUrl ? "border-cyan-400 scale-105" : "border-slate-800 opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={imgUrl}
                  alt={`${product.title} thumb ${i}`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = FALLBACK_IMAGE;
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Specs & Quick Checkout Action (6 cols) */}
      <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
              SKU: {product.sku}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-1 leading-tight">
              {product.title}
            </h1>
          </div>

          {/* Social Proof Rating */}
          <div className="flex items-center gap-2">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-200">5.0</span>
            <span className="text-slate-500 text-xs">| 48 Verified Sri Lanka Buyers</span>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Selling Price (LKR)</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">
                {formatLKR(product.sellingPriceLkr)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block">
                In Stock & Ready to Dispatch
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Estimated Delivery: 2-4 Days
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="text-slate-300 text-xs sm:text-sm leading-relaxed space-y-2">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Product Overview</h4>
            <p>{product.description}</p>
          </div>

          {/* Specs Table */}
          {Object.keys(specs).length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Technical Specifications</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(specs).map(([key, value]) => (
                  <div key={key} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex justify-between">
                    <span className="text-slate-400">{key}:</span>
                    <span className="font-semibold text-slate-200">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quantity & CTA Buttons */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Quantity:</span>
            <div className="flex items-center border border-slate-700 rounded-xl bg-slate-900 overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 font-extrabold text-sm text-slate-100">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2.5 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-100 font-bold py-3.5 px-6 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all text-xs"
            >
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <span>Add to Shopping Cart</span>
            </button>

            <button
              onClick={handleBuyNow}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 text-slate-950 font-extrabold py-3.5 px-6 rounded-xl shadow-neon transition-all text-xs"
            >
              <Zap className="w-4 h-4" />
              <span>Buy Now Quick Checkout</span>
            </button>
          </div>

          {/* WhatsApp Direct Order Button */}
          <a
            href={`https://wa.me/94771234567?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Order via WhatsApp Direct (+94 77 123 4567)</span>
          </a>

          {/* Sri Lanka Delivery Guarantee */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <Truck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>2-4 Days Islandwide</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <Banknote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Cash on Delivery</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>1-Yr Warranty</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
