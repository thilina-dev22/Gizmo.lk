import React from "react";
import Link from "next/link";
import { GizmoLogo } from "../logo/GizmoLogo";
import { TRUST_BADGES, BANK_ACCOUNTS } from "@/lib/constants";
import { Truck, Banknote, Building2, ShieldCheck, Phone, Mail, MapPin, ExternalLink } from "lucide-react";

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
            Sri Lanka&apos;s leading tech gadget and electronic accessories dropshipping store. Delivering trending wireless earbuds, smartwatches, car accessories, and computer gear with instant islandwide dispatch.
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
              <span>orders@gizmo.lk | support@gizmo.lk</span>
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

        {/* Col 3: Customer Care & Bank Transfer */}
        <div className="space-y-3">
          <h4 className="text-slate-100 font-bold text-xs uppercase tracking-wider">Accepted Bank Accounts</h4>
          <div className="space-y-2">
            {BANK_ACCOUNTS.map((bank, i) => (
              <div key={i} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                <div className="font-semibold text-slate-200">{bank.bankName}</div>
                <div className="text-slate-400">Acc: <span className="font-mono text-cyan-400">{bank.accountNumber}</span></div>
                <div className="text-[10px] text-slate-500">{bank.branch}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Col 4: Courier Partners */}
        <div className="space-y-3">
          <h4 className="text-slate-100 font-bold text-xs uppercase tracking-wider">Courier Partners</h4>
          <p className="text-[11px] text-slate-400">
            We partner with premier Sri Lankan logistics networks for fast cash collection and tracking:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px] font-medium">
              🚚 Koombiyo Courier
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px] font-medium">
              📦 PromptX Express
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px] font-medium">
              ⚡ Pronto Sri Lanka
            </span>
          </div>
          <div className="pt-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              <span>Admin Order Dispatch Portal &rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div className="border-t border-slate-800/60 py-4 px-4 sm:px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} <span className="text-slate-200 font-semibold">gizmo.lk online store</span>. All rights reserved. Operating in Sri Lanka.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Accepted Payments:</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Cash on Delivery</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Bank Slip</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Stripe Card</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
