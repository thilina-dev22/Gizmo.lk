"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Smartphone, Headphones, Watch, Laptop, Car, ShieldCheck, Phone, ChevronRight } from "lucide-react";
import { GizmoLogo } from "../logo/GizmoLogo";
import { CATEGORIES } from "@/lib/constants";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const categoryIcons: Record<string, React.ReactNode> = {
    Smartphones: <Smartphone className="w-4 h-4 text-cyan-400" />,
    Audio: <Headphones className="w-4 h-4 text-cyan-400" />,
    Smartwatches: <Watch className="w-4 h-4 text-cyan-400" />,
    "Computer Accessories": <Laptop className="w-4 h-4 text-cyan-400" />,
    "Car Gadgets": <Car className="w-4 h-4 text-cyan-400" />,
  };

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
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-4 border-b border-slate-800/80">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search gadgets..."
                  className="w-full bg-slate-900 text-slate-100 text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 focus:border-cyan-500 outline-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </form>
            </div>

            {/* Categories */}
            <div className="flex-1 p-4 space-y-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Product Categories
              </div>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={cat.id === "all" ? "/products" : `/products?category=${encodeURIComponent(cat.id)}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-900 hover:text-cyan-400 transition-all border border-transparent hover:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      {categoryIcons[cat.id] || <Smartphone className="w-4 h-4 text-cyan-400" />}
                      <span>{cat.name}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                ))}
              </div>

              {/* Sri Lanka Trust Info */}
              <div className="mt-6 p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-cyan-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Islandwide Cash On Delivery
                </div>
                <p className="text-[11px] text-slate-400">
                  Quick delivery to all 25 districts in Sri Lanka with bank transfer slip verification option.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-800 space-y-2 text-xs">
              <a
                href="https://wa.me/94771234567"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-colors"
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
