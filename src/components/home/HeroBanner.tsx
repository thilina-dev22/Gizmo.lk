"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles, ShoppingCart, Truck, ShieldCheck, Flame, ArrowRight, Zap, CheckCircle2 } from "lucide-react";

export function HeroBanner() {
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
                <span>Local Warranty</span>
              </div>
            </div>

            {/* Call To Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                href="/products"
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

          {/* Right Column: Dynamic Floating Product Card Stack */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Card Frame */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-5 rounded-3xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/50"
            >
              {/* Top Card Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" /> Featured Drop #1
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">In Stock (Sri Lanka)</span>
              </div>

              {/* Main Product Feature Image */}
              <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 group">
                <Image
                  src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop"
                  alt="CyberBass Earbuds"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                
                {/* Floating Tag */}
                <div className="absolute bottom-3 left-3 right-3 p-3 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white">CyberBass ANC Earbuds</h3>
                    <p className="text-[10px] text-slate-400">Touchscreen Case + Active Noise Cancel</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-cyan-400 block">Rs. 8,950</span>
                    <span className="text-[9px] text-slate-500 line-through">Rs. 12,500</span>
                  </div>
                </div>
              </div>

              {/* Floating Social Proof Toast */}
              <div className="mt-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-slate-300 font-medium">32 orders placed today from Colombo & Kandy</span>
                </div>
                <span className="text-cyan-400 font-bold text-[11px]">Free Shipping &gt; 15k</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
