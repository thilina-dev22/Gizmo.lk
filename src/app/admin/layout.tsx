"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GizmoLogo } from "@/components/logo/GizmoLogo";
import { LayoutDashboard, Package, ShoppingCart, ArrowLeft, Download } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isOverviewActive = pathname === "/admin";
  const isProductsActive = pathname === "/admin/products";
  const isOrdersActive = pathname === "/admin/orders";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Topbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <GizmoLogo size="sm" showSubtitle={false} />
            <span className="bg-cyan-500/20 text-cyan-400 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded border border-cyan-500/30">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/admin/export-orders"
              download
              className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Courier CSV</span>
            </a>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-400 transition-colors bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </Link>
          </div>
        </div>

        {/* Sub-nav tabs */}
        <div className="border-t border-slate-800 bg-slate-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-6 text-xs font-semibold overflow-x-auto">
            <Link
              href="/admin"
              className={`py-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
                isOverviewActive
                  ? "text-cyan-400 border-b-2 border-cyan-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview & Analytics</span>
            </Link>
            <Link
              href="/admin/products"
              className={`py-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
                isProductsActive
                  ? "text-cyan-400 border-b-2 border-cyan-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products & Inventory</span>
            </Link>
            <Link
              href="/admin/orders"
              className={`py-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
                isOrdersActive
                  ? "text-cyan-400 border-b-2 border-cyan-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Orders & Courier Labels</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </div>
    </div>
  );
}

