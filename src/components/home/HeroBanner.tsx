import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Truck, ShieldCheck, Flame, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { OptimizedImage } from "../common/OptimizedImage";
import { Product } from "@/store/useCartStore";
import { formatLKR, safeParseImages } from "@/lib/utils";

interface HeroBannerProps {
  featuredProduct?: Product | null;
}

const DEFAULT_FEATURED = {
  id: "3-a58-plus-smart-watch-set",
  slug: "a58-plus-luxury-womens-6-in-1-smartwatch-fashion-jewelry-gift-set-202-hd-display",
  title: "A58 Plus Luxury 6-in-1 Smartwatch Gift Set",
  category: "Wearables & Fashion Tech",
  description: "2.02\" HD Display + 4 Interchangeable Straps & Jewelry",
  sellingPriceLkr: 4250,
  marketPrice: 6500,
  image: "https://fochant-prod.s3.ap-southeast-1.amazonaws.com/testfolder/product_image/64d60987fa8821b6fabdfb1e2bc5f70c.webp",
};

export function HeroBanner({ featuredProduct }: HeroBannerProps) {
  const images = featuredProduct ? safeParseImages(featuredProduct.images) : [];
  const heroImage = images.length > 0 ? images[0] : DEFAULT_FEATURED.image;
  const heroTitle = featuredProduct?.title || DEFAULT_FEATURED.title;
  const heroCategory = featuredProduct?.category || DEFAULT_FEATURED.category;
  const heroPrice = featuredProduct?.sellingPriceLkr || DEFAULT_FEATURED.sellingPriceLkr;
  const heroMarketPrice = Math.round(heroPrice * 1.35);
  const heroLink = featuredProduct
    ? `/products/${featuredProduct.slug || featuredProduct.id}`
    : `/products/${DEFAULT_FEATURED.slug}`;

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 lg:py-20 border-b border-slate-800">
      {/* Background Neon Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-10 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Hot Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-cyan-400 shadow-neon">
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>Sri Lanka&apos;s #1 Tech & Electronics Store</span>
              <span className="bg-cyan-500/20 text-[10px] px-2 py-0.5 rounded-full text-cyan-300">
                24H Dispatch
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Upgrade Your Tech <br />
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent drop-shadow-sm">
                Next-Gen Gadgets
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Discover trending wireless earbuds, 4K dashcams, titanium smartwatches, and mechanical keyboards. Pay safely with <strong className="text-cyan-300">Cash on Delivery</strong> or direct <strong className="text-cyan-300">Bank Deposit</strong> across Sri Lanka.
            </p>

            {/* Quick Feature Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-medium text-slate-300 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Islandwide Delivery</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cash On Delivery</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Quality Guarantee</span>
              </div>
            </div>

            {/* Call To Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                to="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 text-slate-950 font-extrabold text-sm px-8 py-4 rounded-xl shadow-neon transition-all transform hover:-translate-y-0.5"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Shop Hot Deals</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#trending-section"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-200 font-semibold text-sm px-6 py-4 rounded-xl border border-slate-700/80 hover:border-cyan-500/40 transition-all"
              >
                <span>View Bestsellers</span>
              </a>
            </div>
          </div>

          {/* Right Column: Dynamic Real Product Card Stack from Database */}
          <div className="lg:col-span-5 relative flex justify-center">
            <Link to={heroLink} className="w-full max-w-md block group">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative w-full bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-5 rounded-3xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 group-hover:border-cyan-400 transition-all"
              >
                {/* Top Card Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1 group-hover:bg-cyan-500/20 transition-colors">
                    <Zap className="w-3 h-3 text-cyan-400" /> Featured Drop #1
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">In Stock (Sri Lanka)</span>
                </div>

                {/* Main Product Feature Image */}
                <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                  <OptimizedImage
                    src={heroImage}
                    alt={heroTitle}
                    fill
                    priority
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                  
                  {/* Floating Tag */}
                  <div className="absolute bottom-3 left-3 right-3 p-3 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 flex items-center justify-between z-10">
                    <div className="max-w-[65%]">
                      <h3 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                        {heroTitle}
                      </h3>
                      <p className="text-[10px] text-slate-400 truncate">{heroCategory}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-cyan-400 block">{formatLKR(heroPrice)}</span>
                      <span className="text-[9px] text-slate-500 line-through">{formatLKR(heroMarketPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Floating Social Proof Toast */}
                <div className="mt-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-slate-300 font-medium text-[11px] sm:text-xs">32 orders placed today in Colombo & Kandy</span>
                  </div>
                  <span className="text-cyan-400 font-bold text-[11px] shrink-0">Free Delivery &gt; 15k</span>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
