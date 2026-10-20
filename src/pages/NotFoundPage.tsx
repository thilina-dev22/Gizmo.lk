import React from "react";
import { Link } from "react-router-dom";
import { Compass, Home, Search } from "lucide-react";
import { SEOHead } from "@/components/common/SEOHead";

export function NotFoundPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5 animate-fade-in">
      <SEOHead title="Page Not Found | GizmoTek.lk" description="The page you are looking for does not exist." noIndex={true} />
      <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400">
        <Compass className="w-8 h-8" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">Error 404</p>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white">We can&apos;t find that page</h1>
      <p className="text-xs text-slate-400">
        The link may be outdated or the product may have been removed. Browse our catalog to find what you need.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs"
        >
          <Search className="w-4 h-4" />
          Browse All Products
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-200 font-semibold px-6 py-2.5 rounded-xl border border-slate-700 text-xs"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>
      </div>
    </div>
  );
}
