import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, ShoppingBag, Star, Zap, Check } from "lucide-react";
import { Product, useCartStore } from "@/store/useCartStore";
import { formatLKR, safeParseImages } from "@/lib/utils";
import { OptimizedImage } from "../common/OptimizedImage";

interface ProductCardProps {
  product: Product;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop";

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, setQuickViewProduct } = useCartStore();
  const [added, setAdded] = useState(false);

  const images = safeParseImages(product.images);
  const initialImage = images[0] || FALLBACK_IMAGE;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="group relative bg-slate-900/90 rounded-2xl border border-slate-800/90 hover:border-cyan-500/50 transition-all duration-300 flex flex-col overflow-hidden shadow-xl hover:shadow-cyan-950/40">
      {/* Top Badges */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {product.isBestSeller ? (
          <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider">
            Best Seller
          </span>
        ) : product.isFeatured ? (
          <span className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3" /> Hot Deal
          </span>
        ) : (
          <span className="bg-slate-950/80 text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-800">
            {product.category}
          </span>
        )}

        <span className="bg-slate-950/80 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-800">
          In Stock
        </span>
      </div>

      {/* Product Image Box */}
      <div className="relative h-52 w-full bg-slate-950 overflow-hidden">
        <Link to={`/products/${product.id}`} className="block w-full h-full">
          <OptimizedImage
            src={initialImage}
            alt={product.title}
            fill
            className="group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Overlay Quick View Button */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={() => setQuickViewProduct(product)}
            className="bg-slate-900/90 hover:bg-slate-900 text-slate-200 hover:text-cyan-400 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 backdrop-blur-md transition-all shadow-lg cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
            {product.category}
          </span>
          <Link to={`/products/${product.id}`}>
            <h3 className="text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
              {product.title}
            </h3>
          </Link>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-1 text-amber-400 text-xs">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.round(product.rating || 0)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-700"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-400 font-medium ml-1">
            {(product.rating || 0).toFixed(1)} ({(product.reviewCount || 0)} reviews)
          </span>
        </div>

        {/* Price & Action */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block">Selling Price</span>
            <span className="text-sm font-extrabold text-cyan-400">
              {formatLKR(product.sellingPriceLkr)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className={`font-bold p-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 text-xs cursor-pointer ${
              added
                ? "bg-emerald-500 text-slate-950"
                : "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950"
            }`}
            title="Add to Cart"
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
