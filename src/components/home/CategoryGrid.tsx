import React from "react";
import { Link } from "react-router-dom";
import { Smartphone, Headphones, Watch, Laptop, Car, ArrowRight } from "lucide-react";

export function CategoryGrid() {
  const categories = [
    {
      id: "Smartphones",
      name: "Smartphones & Mobile",
      desc: "Mini Pocket 4G Phones & Accessories",
      count: "12 Products",
      icon: Smartphone,
      color: "from-cyan-500/20 to-blue-600/20",
      border: "border-cyan-500/30",
    },
    {
      id: "Audio",
      name: "Audio & Earbuds",
      desc: "Touch Case TWS & Bone Conduction",
      count: "24 Products",
      icon: Headphones,
      color: "from-purple-500/20 to-cyan-500/20",
      border: "border-purple-500/30",
    },
    {
      id: "Smartwatches",
      name: "Smartwatches & Fitness",
      desc: "Titanium AMOLED & Calling Bands",
      count: "18 Products",
      icon: Watch,
      color: "from-emerald-500/20 to-cyan-500/20",
      border: "border-emerald-500/30",
    },
    {
      id: "Computer Accessories",
      name: "Computer & PC Gear",
      desc: "Transparent Keyboards & Docks",
      count: "15 Products",
      icon: Laptop,
      color: "from-blue-500/20 to-cyan-500/20",
      border: "border-blue-500/30",
    },
    {
      id: "Car Gadgets",
      name: "Car Dashcams & Chargers",
      desc: "4K Dual Lens AI & MagSafe Mounts",
      count: "10 Products",
      icon: Car,
      color: "from-amber-500/20 to-cyan-500/20",
      border: "border-amber-500/30",
    },
  ];

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
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                to={`/products?category=${encodeURIComponent(cat.id)}`}
                className={`group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${cat.color} bg-slate-900/90 border ${cat.border} hover:border-cyan-400/80 transition-all duration-300 transform hover:-translate-y-1 shadow-lg flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/80 text-cyan-400 border border-slate-800 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800">
                      {cat.count}
                    </span>
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
