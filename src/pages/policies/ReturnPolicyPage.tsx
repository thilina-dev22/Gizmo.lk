import React from "react";
import { Link } from "react-router-dom";
import { RefreshCw, RotateCcw, CheckCircle2, ChevronRight, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

export function ReturnPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-slate-300">
      {/* Breadcrumb Header */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-cyan-400">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-300 font-medium">Return &amp; Refund Policy</span>
        </div>
        <div className="flex items-center gap-2.5 text-cyan-400">
          <RotateCcw className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Customer Assurance</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Return, Replacement &amp; Refund Policy
        </h1>
        <p className="text-xs text-slate-400">
          Last Updated: February 2026 | Guaranteed 7-Day Replacement Guarantee &amp; 1-Year Local Warranty Support
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">7-Day Replacement</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Immediate 1-to-1 brand new replacement for any manufacturing defect detected within 7 days of package delivery.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">1-Year Warranty</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Full 12-month technical and repair warranty coverage for smartwatches, wireless audio, and electronic peripherals.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">Fast 3-5 Day Refunds</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Approved refunds are credited directly back to your Visa/MasterCard card account or Sri Lankan bank account within 3-5 banking days.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8 text-xs leading-relaxed">
        {/* 1. Return Eligibility */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">1</span>
            Conditions for Returns &amp; Replacements
          </h2>
          <p>
            To be eligible for a return, replacement, or warranty claim, your item must satisfy the following criteria:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
            <li>The return request must be initiated within <strong>7 calendar days</strong> of receiving your package from the courier.</li>
            <li>The product must be in its original condition, including the original packaging box, user manuals, charging cables, and included accessories.</li>
            <li>You must provide the original order confirmation number (e.g. <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">GZ-12345</code>) or proof of purchase invoice.</li>
          </ul>
        </section>

        {/* 2. Non-Returnable & Warranty Exceptions */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">2</span>
            Exclusions &amp; Warranty Exceptions
          </h2>
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-2 text-slate-300">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Items Not Eligible for Return / Free Replacement</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li>Damage resulting from accidents, drops, liquid spillage, water submersion, or physical breakage.</li>
              <li>Burned electronic components caused by voltage spikes, power surges, or unauthorized third-party fast chargers.</li>
              <li>Products with altered, defaced, or removed serial numbers and warranty seals.</li>
              <li>Personal hygiene-sensitive accessories (such as opened ear tips) unless defective out of the box.</li>
            </ul>
          </div>
        </section>

        {/* 3. Return Procedure */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">3</span>
            Step-by-Step Return Process
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-cyan-400">Step 1: Contact</span>
              <p className="text-slate-400 text-[11px]">
                WhatsApp us at <strong>+94 77 123 4567</strong> or email <strong>support@gizmotek.lk</strong> with your order number and photos/video of the issue.
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-cyan-400">Step 2: Approval</span>
              <p className="text-slate-400 text-[11px]">
                Our technical support team will evaluate the claim and issue a Return Authorization within 24 hours.
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-cyan-400">Step 3: Courier Pickup</span>
              <p className="text-slate-400 text-[11px]">
                We schedule our courier partner to collect the item from your location or you may drop it at our Colombo 03 service hub.
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-cyan-400">Step 4: Dispatch/Refund</span>
              <p className="text-slate-400 text-[11px]">
                Upon receiving and inspecting the unit, a brand-new replacement unit is immediately dispatched or a refund is processed.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Refund Methods & Timelines */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">4</span>
            Refund Methods &amp; Processing Timelines
          </h2>
          <p>
            Once your return is inspected and approved, your refund will be processed as follows:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
            <li><strong>PayHere Card Payments (Visa / MasterCard):</strong> The refund is credited back to the original card used. It typically reflects on your bank statement within <strong>3 to 5 business days</strong> depending on your issuing bank.</li>
            <li><strong>Cash on Delivery (COD) / Direct Bank Transfers:</strong> The refund will be transferred via direct electronic bank transfer (CEFT / SLIPS) to your nominated Sri Lankan bank account within <strong>24 to 48 hours</strong> of approval.</li>
          </ul>
        </section>

        {/* 5. Returns Hub Contact */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">5</span>
            Returns &amp; Technical Support Center
          </h2>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1 text-slate-300">
            <p><strong>Returns Department:</strong> GizmoTek Technical Support &amp; RMA Center</p>
            <p><strong>Address:</strong> No. 128, Galle Road, Colombo 03, Sri Lanka</p>
            <p><strong>Direct Helpline / WhatsApp:</strong> +94 77 123 4567</p>
            <p><strong>Email:</strong> support@gizmotek.lk | orders@gizmotek.lk</p>
            <p><strong>Operating Hours:</strong> Monday - Saturday (9:00 AM - 6:30 PM)</p>
          </div>
        </section>
      </div>

      {/* Bottom Action */}
      <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <span className="text-slate-500">Need help starting a return or replacement?</span>
        <div className="flex items-center gap-3">
          <Link to="/contact" className="text-cyan-400 hover:underline">Contact Customer Support</Link>
          <span className="text-slate-700">•</span>
          <Link to="/shipping-policy" className="text-cyan-400 hover:underline">Shipping Policy</Link>
          <span className="text-slate-700">•</span>
          <Link to="/terms-and-conditions" className="text-cyan-400 hover:underline">Terms &amp; Conditions</Link>
        </div>
      </div>
    </div>
  );
}
