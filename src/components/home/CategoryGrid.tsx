import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Smartphone,
  Headphones,
  Watch,
  Laptop,
  Car,
  Cable,
  HardDrive,
  Compass,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Skeleton } from "../common/Skeleton";

interface CategoryCard {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  border: string;
}

// `id` must match the product `category` values stored in the database
const CATEGORY_CARDS: CategoryCard[] = [
  {
    id: "Smartphones",
    name: "Smartphones & Mobile",
    desc: "Mini Pocket Phones & Mobile Accessories",
    icon: Smartphone,
    color: "from-cyan-500/20 to-blue-600/20",
    border: "border-cyan-500/30",
  },
  {
    id: "Audio",
    name: "Audio & Earbuds",
    desc: "Touch Case TWS & Bone Conduction",
    icon: Headphones,
    color: "from-purple-500/20 to-cyan-500/20",
    border: "border-purple-500/30",
  },
  {
    id: "Wearables",
    name: "Smartwatches & Fitness",
    desc: "AMOLED Watches & Calling Bands",
    icon: Watch,
    color: "from-emerald-500/20 to-cyan-500/20",
    border: "border-emerald-500/30",
  },
  {
    id: "Chargers & Cables",
    name: "Chargers & Cables",
    desc: "Fast Chargers, Power Banks & Cables",
    icon: Cable,
    color: "from-amber-500/20 to-cyan-500/20",
    border: "border-amber-500/30",
  },
  {
    id: "Computer Accessories",
    name: "Computer & PC Gear",
    desc: "Keyboards, Mice, Hubs & Docks",
    icon: Laptop,
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
  },
  {
    id: "Storage & Pen Drives",
    name: "Storage & Pen Drives",
    desc: "Flash Drives, Memory Cards & SSDs",
    icon: HardDrive,
    color: "from-rose-500/20 to-cyan-500/20",
    border: "border-rose-500/30",
  },
  {
    id: "Outdoor & Gadgets",
    name: "Outdoor & Gadgets",
    desc: "Smart Lights, Fans & Travel Gear",
    icon: Compass,
    color: "from-lime-500/20 to-cyan-500/20",
    border: "border-lime-500/30",
  },
  {
    id: "Car Gadgets",
    name: "Car Gadgets & Mounts",
    desc: "Dashcams, Car Chargers & Mounts",
    icon: Car,
    color: "from-orange-500/20 to-cyan-500/20",
    border: "border-orange-500/30",
  },
];

export function CategoryGrid() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch<{ categories: { category: string; count: number }[] }>("/api/categories", {
      signal: controller.signal,
      silent: true,
    })
      .then((data) => {
        setCounts(Object.fromEntries((data.categories || []).map((c) => [c.category, c.count])));
      })
      .catch(() => {
        if (!controller.signal.aborted) setCounts({});
      });
    return () => controller.abort();
  }, []);

  const hasCounts = counts !== null && Object.keys(counts).length > 0;
  // Hide empty categories once real counts are known so shoppers never land on an empty page
  const visibleCategories = hasCounts ? CATEGORY_CARDS.filter((cat) => (counts?.[cat.id] || 0) > 0) : CATEGORY_CARDS;

  return (
    <section className="py-12 bg-slate-950 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider">
              Explore Collections
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Shop Tech Categories
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold mt-2 md:mt-0"
          >
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {visibleCategories.map((cat, index) => {
            const Icon = cat.icon;
            const count = counts?.[cat.id];
            return (
              <Link
                key={cat.id}
                to={`/products?category=${encodeURIComponent(cat.id)}`}
                style={{ animationDelay: `${index * 40}ms` }}
                className={`group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${cat.color} bg-slate-900/90 border ${cat.border} hover:border-cyan-400/80 transition-all duration-300 transform hover:-translate-y-1 shadow-lg flex flex-col justify-between animate-fade-in-up`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/80 text-cyan-400 border border-slate-800 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    {counts === null ? (
                      <Skeleton className="h-4 w-16 rounded-full" />
                    ) : count ? (
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800">
                        {count} {count === 1 ? "Product" : "Products"}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="font-bold text-slate-100 text-xs sm:text-sm group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {cat.desc}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-cyan-400 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Explore</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
