import React from "react";
import Link from "next/link";
import { GizmoLogo } from "../logo/GizmoLogo";
import { TRUST_BADGES } from "@/lib/constants";
import { KoombiyoLogo, PromptXLogo, ProntoLogo, FardarLogo } from "../common/CourierLogos";
import { Truck, Banknote, Building2, ShieldCheck, Phone, Mail, MapPin, ShieldAlert, ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs">
      {/* Top Trust Badges Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200 text-xs">Islandwide Delivery</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">2-4 Days across all 25 districts</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200 text-xs">Cash On Delivery</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Pay at your doorstep upon arrival</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200 text-xs">Direct Bank Deposit</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Commercial, Sampath & BOC slips</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200 text-xs">Quality Guarantee</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">1-Year Local warranty support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Col 1: Brand Info */}
        <div className="lg:col-span-2 space-y-4">
          <GizmoLogo size="lg" />
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
            Sri Lanka&apos;s premier tech gadget and electronic accessories online store. Delivering high-quality wireless earbuds, smartwatches, car accessories, and computer gear with instant islandwide dispatch.
          </p>
          <div className="space-y-2 text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>No. 128, Galle Road, Colombo 03, Sri Lanka</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Hotline / WhatsApp: +94 77 123 4567</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span>orders@gizmotek.lk | support@gizmotek.lk</span>
            </div>
          </div>
        </div>

        {/* Col 2: Categories */}
        <div className="space-y-3">
          <h4 className="text-slate-100 font-bold text-xs uppercase tracking-wider">Top Categories</h4>
          <ul className="space-y-2 text-slate-400">
            <li>
              <Link href="/products?category=Smartphones" className="hover:text-cyan-400 transition-colors">
                Smartphones & Mobile
              </Link>
            </li>
            <li>
              <Link href="/products?category=Audio" className="hover:text-cyan-400 transition-colors">
                Audio & Wireless Earbuds
              </Link>
            </li>
            <li>
              <Link href="/products?category=Smartwatches" className="hover:text-cyan-400 transition-colors">
                Smartwatches & Fitness
              </Link>
            </li>
            <li>
              <Link href="/products?category=Computer%20Accessories" className="hover:text-cyan-400 transition-colors">
                Computer & PC Gear
              </Link>
            </li>
            <li>
              <Link href="/products?category=Car%20Gadgets" className="hover:text-cyan-400 transition-colors">
                Car Dashcams & Mounts
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Customer Care & Quick Access */}
        <div className="space-y-3">
          <h4 className="text-slate-100 font-bold text-xs uppercase tracking-wider">Quick Links & Admin</h4>
          <ul className="space-y-2 text-slate-400">
            <li>
              <Link href="/products" className="hover:text-cyan-400 transition-colors">
                All Products Catalog
              </Link>
            </li>
            <li>
              <a
                href="https://wa.me/94771234567"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <span>WhatsApp Support</span>
              </a>
            </li>
            <li className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-cyan-400 font-semibold hover:border-cyan-500/50 hover:bg-slate-850 transition-all text-xs"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Official Courier Partners */}
        <div className="space-y-3">
          <h4 className="text-slate-100 font-bold text-xs uppercase tracking-wider">Official Delivery Partners</h4>
          <p className="text-[11px] text-slate-400">
            We partner with certified Sri Lankan logistics networks for fast cash collection and real-time tracking:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <KoombiyoLogo />
            <PromptXLogo />
            <ProntoLogo />
            <FardarLogo />
          </div>
        </div>
      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div className="border-t border-slate-800/60 py-4 px-4 sm:px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 text-center sm:text-left">
          <div>
            &copy; {new Date().getFullYear()} <span className="text-slate-200 font-semibold">gizmotek.lk online store</span>. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Developed with ❤️ by</span>
            <a
              href="https://paradisecrew.site/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 font-medium hover:underline hover:text-cyan-300 transition-colors"
            >
              Paradise Crew - Tech and Hospitality
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

