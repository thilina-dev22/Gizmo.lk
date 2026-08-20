import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HeroBanner } from "@/components/home/HeroBanner";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductCard } from "@/components/product/ProductCard";
import { Product } from "@/store/useCartStore";
import { Sparkles, ArrowRight, Truck, Banknote, Building2, HelpCircle, CheckCircle2 } from "lucide-react";

import { inMemoryProducts } from "@/data/mockData";

export function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setFeaturedProducts(data.products.slice(0, 12));
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Home fetch products fallback:", err);
    }

    setFeaturedProducts(inMemoryProducts.slice(0, 12));
    setLoading(false);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Category Grid */}
      <CategoryGrid />

      {/* Trending Products Grid */}
      <section id="trending-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Featured Tech Inventory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Trending Tech Gadgets in Sri Lanka
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold mt-2 md:mt-0"
          >
            <span>Explore All 100+ Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse p-4 space-y-4"
              >
                <div className="h-44 bg-slate-800 rounded-xl"></div>
                <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                <div className="h-4 bg-slate-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm">
            No featured tech products available right now. Check back soon!
          </div>
        )}
      </section>

      {/* Trust & Local Delivery Guarantee Section */}
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-y border-slate-800 py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider">
              Why Sri Lanka Chooses GizmoTek.lk
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Fast, Reliable & Transparent Shopping
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              We eliminate online shopping risks with full Cash On Delivery, instant Bank Slip verification, and dedicated WhatsApp customer service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Islandwide Express Courier</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dispatched directly via Koombiyo & PromptX courier networks. Receive your package anywhere in Colombo, Kandy, Galle, Jaffna, or Kurunegala in 2 to 4 business days.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tracking SMS included</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Banknote className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Cash on Delivery (COD)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No credit card needed! Simply place your order online, provide your Sri Lankan mobile number and delivery address, and pay cash directly to the courier driver.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero pre-payment risk</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Bank Transfer Slip Upload</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prefer bank deposit or online banking? Deposit into Commercial Bank, Sampath Bank, or BOC, upload your slip screenshot at checkout, and get instant order confirmation.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant slip verification</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sri Lanka FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200 text-sm">How do I place an order via Cash on Delivery?</h4>
            <p className="text-slate-400 leading-relaxed">
              Add your desired products to the shopping cart, click &quot;Proceed to Checkout&quot;, select your Sri Lankan District & City, choose &quot;Cash on Delivery (COD)&quot; as your payment method, and submit. You will receive a confirmation call or WhatsApp message before dispatch.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200 text-sm">How long does islandwide delivery take?</h4>
            <p className="text-slate-400 leading-relaxed">
              Deliveries within Colombo and Gampaha metro areas take 1 to 2 business days. Deliveries to outstation districts (Kandy, Galle, Jaffna, Kurunegala, Matara, etc.) take 2 to 4 business days.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200 text-sm">What happens after I upload my bank deposit slip?</h4>
            <p className="text-slate-400 leading-relaxed">
              Our accounts admin team verifies uploaded slips against our Commercial Bank / Sampath Bank statement within 1-2 hours. Once verified, your order status updates to &quot;VERIFIED&quot; and is packed for dispatch.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom Conversion Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-cyan-900 via-slate-900 to-slate-950 p-8 sm:p-12 border border-cyan-500/30 text-center space-y-4">
          <span className="text-cyan-300 font-extrabold text-xs uppercase tracking-widest bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/30">
            Limited Stock Available
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Ready to upgrade your tech setup?
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">
            Order today and get fast islandwide delivery across Sri Lanka with full Cash on Delivery guarantee.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold px-8 py-3.5 rounded-xl shadow-neon transition-all text-sm"
            >
              <span>Explore Products Now &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
