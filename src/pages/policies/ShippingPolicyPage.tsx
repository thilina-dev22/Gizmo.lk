import React from "react";
import { Link } from "react-router-dom";
import { Truck, MapPin, CheckCircle2, ChevronRight, Clock, ShieldCheck, Banknote } from "lucide-react";
import { KoombiyoLogo, PromptXLogo, ProntoLogo, FardarLogo } from "@/components/common/CourierLogos";

export function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-slate-300">
      {/* Breadcrumb Header */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-cyan-400">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-300 font-medium">Shipping &amp; Delivery</span>
        </div>
        <div className="flex items-center gap-2.5 text-cyan-400">
          <Truck className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Logistics &amp; Fulfillment</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Islandwide Shipping &amp; Delivery Policy
        </h1>
        <p className="text-xs text-slate-400">
          Fast, Reliable &amp; Tracked Express Delivery Across All 25 Districts of Sri Lanka
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">1-2 Days (Colombo/Gampaha)</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Same-day and next-day express delivery for orders located in the Western Province.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">2-4 Days (Outstation)</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Full delivery coverage across Kandy, Galle, Matara, Kurunegala, Jaffna, and all other districts.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Banknote className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">Free Islandwide Delivery</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Qualify for 100% Free islandwide delivery on all cart orders of <strong>Rs. 15,000 or more</strong>.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8 text-xs leading-relaxed">
        {/* 1. Delivery Rates & Calculation */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">1</span>
            Standard Delivery Rates &amp; Free Shipping
          </h2>
          <p>
            Delivery rates are automatically calculated during checkout based on your delivery district:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-900 text-slate-200">
                <tr>
                  <th className="p-3 border-b border-slate-800">Destination Region</th>
                  <th className="p-3 border-b border-slate-800">Estimated Timeline</th>
                  <th className="p-3 border-b border-slate-800">Shipping Rate</th>
                  <th className="p-3 border-b border-slate-800">Free Shipping Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="p-3 font-semibold text-white">Colombo &amp; Gampaha Districts</td>
                  <td className="p-3">1 - 2 Business Days</td>
                  <td className="p-3 text-cyan-400 font-mono font-bold">Rs. 350</td>
                  <td className="p-3 text-emerald-400 font-bold">Free on Orders ≥ Rs. 15,000</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">All Other 23 Districts (Islandwide)</td>
                  <td className="p-3">2 - 4 Business Days</td>
                  <td className="p-3 text-cyan-400 font-mono font-bold">Rs. 500</td>
                  <td className="p-3 text-emerald-400 font-bold">Free on Orders ≥ Rs. 15,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 2. Official Logistics Partners */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">2</span>
            Official Courier Partners &amp; Tracking
          </h2>
          <p>
            To guarantee package safety, zero damage, and rapid cash collection, GizmoTek partners with Sri Lanka&apos;s leading courier services:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <KoombiyoLogo />
              <p className="text-[11px] text-slate-400">Koombiyo Delivery Express islandwide network.</p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <PromptXLogo />
              <p className="text-[11px] text-slate-400">PromptX Same-day &amp; next-day courier delivery.</p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <ProntoLogo />
              <p className="text-[11px] text-slate-400">Pronto Lanka door-to-door insured logistics.</p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <FardarLogo />
              <p className="text-[11px] text-slate-400">Fardar Express corporate parcel dispatch.</p>
            </div>
          </div>
        </section>

        {/* 3. Cash on Delivery Procedures */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">3</span>
            Cash on Delivery (COD) Guidelines
          </h2>
          <p>
            For customers selecting Cash On Delivery:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
            <li>Our dispatch team will verify your phone number and address prior to sending out the parcel.</li>
            <li>The courier driver will contact you prior to arriving at your designated address.</li>
            <li>Please have the exact cash amount ready in Sri Lankan Rupees for the courier representative.</li>
            <li>Upon cash handover, you will receive your sealed GizmoTek package with the official bill/waybill.</li>
          </ul>
        </section>

        {/* 4. Tracking & Dispatch Updates */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">4</span>
            Order Tracking &amp; Delivery Inquiries
          </h2>
          <p>
            You can check your order status at any time by contacting our delivery support desk with your Order Number (e.g. <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">GZ-12345</code>):
          </p>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1 text-slate-300">
            <p><strong>Fulfillment Warehouse:</strong> GizmoTek Logistics Hub, Colombo 03, Sri Lanka</p>
            <p><strong>Hotline &amp; WhatsApp Tracking:</strong> +94 77 123 4567</p>
            <p><strong>Email:</strong> orders@gizmotek.lk | support@gizmotek.lk</p>
            <p><strong>Dispatch Times:</strong> Monday - Saturday (Orders placed before 2:00 PM are dispatched same-day)</p>
          </div>
        </section>
      </div>

      {/* Bottom Action */}
      <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <span className="text-slate-500">Need immediate shipping assistance?</span>
        <div className="flex items-center gap-3">
          <Link to="/contact" className="text-cyan-400 hover:underline">Contact Delivery Desk</Link>
          <span className="text-slate-700">•</span>
          <Link to="/return-policy" className="text-cyan-400 hover:underline">Return Policy</Link>
          <span className="text-slate-700">•</span>
          <Link to="/terms-and-conditions" className="text-cyan-400 hover:underline">Terms &amp; Conditions</Link>
        </div>
      </div>
    </div>
  );
}
