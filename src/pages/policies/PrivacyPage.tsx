import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Lock, ChevronRight, Eye, Database, Server } from "lucide-react";
import { SEOHead } from "@/components/common/SEOHead";

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-slate-300">
      <SEOHead
        title="Privacy & Data Protection Policy | GizmoTek.lk Sri Lanka"
        description="Learn how GizmoTek.lk protects your personal data, secure payment transactions, and customer confidentiality under Sri Lanka Data Protection standards."
        canonical="https://gizmotek.lk/privacy-policy"
      />

      {/* Breadcrumb Header */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-cyan-400">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-300 font-medium">Privacy Policy</span>
        </div>
        <div className="flex items-center gap-2.5 text-cyan-400">
          <Lock className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Data Protection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Privacy &amp; Data Security Policy
        </h1>
        <p className="text-xs text-slate-400">
          Last Updated: February 2026 | Compliant with Sri Lanka Personal Data Protection Act No. 9 of 2022 &amp; PayHere Security Standards
        </p>
      </div>

      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs leading-relaxed space-y-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Our Commitment to Your Privacy</span>
        </div>
        <p>
          At <strong>GizmoTek Online Store</strong> (&quot;gizmotek.lk&quot;), we are committed to safeguarding the privacy and confidential information of our shoppers. This Privacy Policy details how we collect, store, utilize, and protect your personal information when you visit our website, place orders, or interact with our customer service team.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-8 text-xs leading-relaxed">
        {/* 1. Information We Collect */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">1</span>
            Information We Collect
          </h2>
          <p>
            To process your orders and deliver your tech gadgets efficiently, we collect the following customer details:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-slate-200">Customer Contact Details</span>
              <p className="text-slate-400 text-[11px]">
                Full Name, Phone Number, Mobile Number (for courier delivery coordination &amp; SMS notifications), and Email Address.
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-slate-200">Delivery &amp; Shipping Details</span>
              <p className="text-slate-400 text-[11px]">
                Street Address, City, Postal Code, District (out of 25 Sri Lankan districts), and special delivery instructions.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Payment Security & Zero Card Storage */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">2</span>
            Payment Information Security (Zero Card Data Storage)
          </h2>
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-2 text-slate-300">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Lock className="w-4 h-4" />
              <span>100% PCI-DSS Compliant Payment Gateway</span>
            </div>
            <p className="text-[11px]">
              GizmoTek <strong>NEVER stores, captures, or logs your credit/debit card number, CVV code, or banking passwords</strong> on our servers.
            </p>
            <p className="text-[11px]">
              All online card payments are processed directly through <strong>PayHere Payment Gateway</strong> (Central Bank of Sri Lanka approved). Your payment transactions are transmitted through bank-grade 256-bit TLS/SSL encryption and authenticated via 3D Secure OTP verification.
            </p>
          </div>
        </section>

        {/* 3. How We Use Your Information */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">3</span>
            How We Use Your Information
          </h2>
          <p>
            The information you provide is used exclusively for legitimate business operations:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
            <li>Processing, verifying, and dispatching your e-commerce orders.</li>
            <li>Providing real-time tracking updates via SMS, Phone call, or WhatsApp through our courier network.</li>
            <li>Handling warranty registrations, customer support inquiries, and return/replacement requests.</li>
            <li>Detecting and preventing fraudulent transactions or unauthorized access.</li>
          </ul>
        </section>

        {/* 4. Information Sharing & Third Parties */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">4</span>
            Third-Party Disclosures
          </h2>
          <p>
            We strictly do <strong>NOT sell, rent, or trade your personal information</strong> to third-party advertisers or marketers.
          </p>
          <p>
            We only disclose the minimal necessary shipping information (name, address, phone number) to our certified courier partners (Koombiyo, PromptX, Pronto, Fardar) solely to facilitate physical package delivery and cash collection.
          </p>
        </section>

        {/* 5. Cookies & Tracking */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">5</span>
            Cookies &amp; Local Storage
          </h2>
          <p>
            Our website uses standard essential cookies and browser local storage to maintain your shopping cart items, remember your selected delivery district, and secure admin authentication sessions.
          </p>
        </section>

        {/* 6. Contact our Privacy Officer */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">6</span>
            Data Protection Officer Contact
          </h2>
          <p>
            If you wish to access, rectify, or request deletion of your stored customer records, please contact our Privacy &amp; Data Security Team:
          </p>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1 text-slate-300">
            <p><strong>Email:</strong> orders@gizmotek.lk | support@gizmotek.lk</p>
            <p><strong>Hotline &amp; WhatsApp:</strong> +94 72 141 0369</p>
            <p><strong>Operation Base:</strong> GizmoTek Online E-Commerce Store, Southern Province, Sri Lanka</p>
          </div>
        </section>
      </div>

      {/* Bottom Action */}
      <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <span className="text-slate-500">Related Legal Documents:</span>
        <div className="flex items-center gap-3">
          <Link to="/terms-and-conditions" className="text-cyan-400 hover:underline">Terms &amp; Conditions</Link>
          <span className="text-slate-700">•</span>
          <Link to="/return-policy" className="text-cyan-400 hover:underline">Return &amp; Refund Policy</Link>
          <span className="text-slate-700">•</span>
          <Link to="/shipping-policy" className="text-cyan-400 hover:underline">Shipping Policy</Link>
        </div>
      </div>
    </div>
  );
}
