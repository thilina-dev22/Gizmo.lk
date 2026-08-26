import React from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { GizmoLogo } from "@/components/logo/GizmoLogo";
import { LayoutDashboard, Package, ShoppingCart, Download, LogOut, MessageSquare, Store } from "lucide-react";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { SEOHead } from "@/components/common/SEOHead";

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide topbar and sub-nav on admin login page
  if (location.pathname === "/admin/login") {
    return <div className="min-h-screen bg-slate-950 text-slate-100"><Outlet /></div>;
  }

  const isOverviewActive = location.pathname === "/admin" || location.pathname === "/admin/";
  const isProductsActive = location.pathname === "/admin/products";
  const isOrdersActive = location.pathname === "/admin/orders";
  const isReviewsActive = location.pathname === "/admin/reviews";

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      navigate("/admin/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <SEOHead title="Admin Dashboard | GizmoTek" noIndex={true} />

      {/* Admin Topbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          {/* Logo & Admin Tag */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <GizmoLogo size="sm" showSubtitle={false} />
            <span className="hidden sm:inline-block bg-cyan-500/20 text-cyan-400 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded border border-cyan-500/30">
              Admin Portal
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Real-time Notification Bell */}
            <AdminNotificationBell />

            <a
              href="/api/admin/export-orders"
              download
              className="hidden md:inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Courier CSV</span>
            </a>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-400 transition-colors bg-slate-950 hover:bg-slate-850 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800 font-semibold"
              title="Return to Customer Storefront"
            >
              <Store className="w-4 h-4 text-cyan-400 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors bg-red-950/40 hover:bg-red-950/80 px-2.5 sm:px-3 py-1.5 rounded-lg border border-red-500/30 font-semibold cursor-pointer"
              title="Logout of Admin Session"
            >
              <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Sub-nav tabs */}
        <div className="border-t border-slate-800 bg-slate-950/80">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-1 sm:gap-6 text-xs font-semibold overflow-x-auto scrollbar-none py-1">
            <Link
              to="/admin"
              className={`py-2 px-3 sm:py-3 sm:px-0 flex items-center gap-1.5 transition-colors whitespace-nowrap rounded-lg sm:rounded-none ${
                isOverviewActive
                  ? "text-cyan-400 bg-slate-900 sm:bg-transparent sm:border-b-2 sm:border-cyan-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>Overview</span>
              <span className="hidden sm:inline">& Analytics</span>
            </Link>

            <Link
              to="/admin/products"
              className={`py-2 px-3 sm:py-3 sm:px-0 flex items-center gap-1.5 transition-colors whitespace-nowrap rounded-lg sm:rounded-none ${
                isProductsActive
                  ? "text-cyan-400 bg-slate-900 sm:bg-transparent sm:border-b-2 sm:border-cyan-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Package className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>Products</span>
              <span className="hidden sm:inline">& Inventory</span>
            </Link>

            <Link
              to="/admin/orders"
              className={`py-2 px-3 sm:py-3 sm:px-0 flex items-center gap-1.5 transition-colors whitespace-nowrap rounded-lg sm:rounded-none ${
                isOrdersActive
                  ? "text-cyan-400 bg-slate-900 sm:bg-transparent sm:border-b-2 sm:border-cyan-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShoppingCart className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>Orders</span>
              <span className="hidden sm:inline">& Courier Labels</span>
            </Link>

            <Link
              to="/admin/reviews"
              className={`py-2 px-3 sm:py-3 sm:px-0 flex items-center gap-1.5 transition-colors whitespace-nowrap rounded-lg sm:rounded-none ${
                isReviewsActive
                  ? "text-cyan-400 bg-slate-900 sm:bg-transparent sm:border-b-2 sm:border-cyan-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>Reviews</span>
              <span className="hidden sm:inline">Moderation</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </div>
    </div>
  );
}
