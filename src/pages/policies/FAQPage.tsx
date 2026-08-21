import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Search,
  Truck,
  CreditCard,
  RotateCcw,
  Headphones,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { FAQ_DATA, FAQ_CATEGORIES, FAQItem } from "@/data/faqData";

export function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All Questions");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "delivery-time": true,
    "cash-on-delivery": true,
    "bank-details": true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory =
        activeCategory === "All Questions" || item.category === activeCategory;
      const matchesQuery =
        searchQuery.trim() === "" ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.badge?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-slate-300">
      {/* Breadcrumb Header */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-cyan-400">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-300 font-medium">FAQ</span>
        </div>
        <div className="flex items-center gap-2.5 text-cyan-400">
          <HelpCircle className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Help &amp; Answers</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Frequently Asked Questions
        </h1>
        <p className="text-xs text-slate-400">
          Everything you need to know about islandwide delivery, Cash on Delivery, order tracking, returns, quality checks, and bank payments.
        </p>
      </div>

      {/* Quick Search & Category Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g. delivery time, bank account, COD, returns)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((faq) => {
            const isOpen = !!openItems[faq.id];
            return (
              <div
                key={faq.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-colors hover:border-slate-700"
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full p-5 text-left flex items-start justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                        {faq.category}
                      </span>
                      {faq.badge && (
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md hidden sm:inline">
                          {faq.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-sm sm:text-base pt-1">
                      {faq.question}
                    </h3>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 bg-cyan-500/20 text-cyan-400" : ""
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80">
                    <div className="whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2 mt-2">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <p className="text-slate-400 text-xs">No matching questions found for &quot;{searchQuery}&quot;.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("All Questions");
              }}
              className="text-xs text-cyan-400 font-bold hover:underline"
            >
              Clear Search &amp; View All
            </button>
          </div>
        )}
      </div>

      {/* Still Need Assistance Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Still Have Questions?</h3>
            <p className="text-xs text-slate-400">Our Sri Lankan customer care team is available 7 days a week.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <a
            href="https://wa.me/94721410369"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300 hover:bg-emerald-950/50 transition-colors"
          >
            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold">Chat on WhatsApp</div>
              <div className="text-[11px] text-emerald-400/80">+94 72 141 0369 (Instant Reply)</div>
            </div>
          </a>

          <Link
            to="/contact"
            className="flex items-center gap-3 p-3.5 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-cyan-300 hover:bg-cyan-950/50 transition-colors"
          >
            <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <div className="font-bold">Send Online Inquiry</div>
              <div className="text-[11px] text-cyan-400/80">Contact Us Form &amp; Email</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
