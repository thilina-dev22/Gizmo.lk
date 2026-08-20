import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, FileText, ChevronRight, Scale, AlertCircle } from "lucide-react";

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-slate-300">
      {/* Breadcrumb Header */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-cyan-400">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-300 font-medium">Terms & Conditions</span>
        </div>
        <div className="flex items-center gap-2.5 text-cyan-400">
          <Scale className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Legal Terms</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Terms & Conditions of Service
        </h1>
        <p className="text-xs text-slate-400">
          Last Updated: February 2026 | Effective for all customers of GizmoTek Online Store (gizmotek.lk)
        </p>
      </div>

      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs leading-relaxed space-y-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Agreement to Terms</span>
        </div>
        <p>
          Welcome to <strong>GizmoTek Online Store</strong> (&quot;gizmotek.lk&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). These Terms &amp; Conditions govern your access to and use of the website located at <a href="https://www.gizmotek.lk" className="text-cyan-400 underline">https://www.gizmotek.lk</a> and all associated services, including browsing, purchasing electronics, and placing orders.
        </p>
        <p>
          By placing an order or browsing our website, you agree to be bound by these Terms. If you do not agree to all of these Terms, please do not use our website.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-8 text-xs leading-relaxed">
        {/* 1. Company Information */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">1</span>
            Company Information &amp; Operational Location
          </h2>
          <p>
            GizmoTek Online Store operates as an authorized Sri Lankan retail and e-commerce vendor for consumer electronics, gadgets, audio gear, smartwatches, and computing accessories.
          </p>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1 text-slate-300">
            <p><strong>Business Name:</strong> GizmoTek Online Store</p>
            <p><strong>Website:</strong> https://www.gizmotek.lk</p>
            <p><strong>Registered Address:</strong> No. 128, Galle Road, Colombo 03, Western Province, Sri Lanka</p>
            <p><strong>Contact Email:</strong> orders@gizmotek.lk | support@gizmotek.lk</p>
            <p><strong>Customer Hotline:</strong> +94 77 123 4567</p>
          </div>
        </section>

        {/* 2. Products, Pricing & Accuracy */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">2</span>
            Products, Pricing &amp; Currency
          </h2>
          <p>
            All prices displayed on gizmotek.lk are in <strong>Sri Lankan Rupees (LKR / Rs.)</strong> and are inclusive of applicable taxes.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
            <li>We strive to ensure all product descriptions, specifications, and images are accurate. Minor packaging updates from manufacturers may occur without prior notice.</li>
            <li>We reserve the right to correct any typographical or pricing errors. In the event a product is listed at an incorrect price due to an error, we reserve the right to cancel orders placed for that item.</li>
            <li>Product availability is subject to stock. If an ordered item is out of stock, our team will promptly contact you to provide an immediate refund or alternative model.</li>
          </ul>
        </section>

        {/* 3. Payment Methods & Processing */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">3</span>
            Payment Methods &amp; Gateway Security
          </h2>
          <p>
            GizmoTek supports multiple convenient and secure payment channels for customers across Sri Lanka:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-cyan-400">1. Online Card / PayHere</span>
              <p className="text-slate-400 text-[11px]">
                Visa, MasterCard, and LankaQR processed via the Central Bank-approved <strong>PayHere Payment Gateway</strong> with 256-bit SSL encryption.
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-emerald-400">2. Cash On Delivery (COD)</span>
              <p className="text-slate-400 text-[11px]">
                Pay with cash to our registered courier officer upon delivery at your doorstep across any of the 25 districts in Sri Lanka.
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-amber-400">3. Bank Transfer</span>
              <p className="text-slate-400 text-[11px]">
                Direct bank transfer or cash deposit to our corporate accounts (Commercial Bank, Sampath Bank, Bank of Ceylon).
              </p>
            </div>
          </div>
        </section>

        {/* 4. Orders & Delivery */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">4</span>
            Order Confirmation &amp; Islandwide Delivery
          </h2>
          <p>
            Upon placing an order, you will receive an instant order confirmation with a unique reference number (e.g., <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">GZ-12345</code>).
          </p>
          <p>
            Orders are dispatched through certified courier partners (Koombiyo, PromptX, Pronto, Fardar). Standard delivery times are 1 to 2 business days for Colombo/Gampaha and 2 to 4 business days for all other districts.
          </p>
        </section>

        {/* 5. Warranty & Guarantees */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">5</span>
            Warranty Policy &amp; Customer Protection
          </h2>
          <p>
            All electronic products sold by GizmoTek include manufacturer/supplier warranty coverage against hardware defects. Warranty claims require proof of purchase (invoice or order confirmation number).
          </p>
          <p>
            Physical damage, liquid damage, power surges, or unauthorized repairs are strictly excluded from warranty coverage.
          </p>
        </section>

        {/* 6. Governing Law */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">6</span>
            Governing Law &amp; Jurisdiction
          </h2>
          <p>
            These Terms &amp; Conditions are governed by and construed in accordance with the laws of the <strong>Democratic Socialist Republic of Sri Lanka</strong>. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Colombo, Sri Lanka.
          </p>
        </section>
      </div>

      {/* Bottom Action */}
      <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <span className="text-slate-500">Need legal clarification or custom invoice?</span>
        <div className="flex items-center gap-3">
          <Link to="/privacy-policy" className="text-cyan-400 hover:underline">Privacy Policy</Link>
          <span className="text-slate-700">•</span>
          <Link to="/return-policy" className="text-cyan-400 hover:underline">Return Policy</Link>
          <span className="text-slate-700">•</span>
          <Link to="/contact" className="text-cyan-400 hover:underline">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
