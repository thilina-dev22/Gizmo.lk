import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

export function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Inquiry");
  const [message, setMessage] = useState("");
  const [botcheck, setBotcheck] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // If bot fills honeypot, silently pretend success
    if (botcheck) {
      setSubmitted(true);
      return;
    }

    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY?.trim();

    if (!accessKey) {
      setErrorMessage(
        "Web3Forms Access Key is not configured. Please add VITE_WEB3FORMS_ACCESS_KEY in your .env configuration file, or contact us directly via WhatsApp (+94 72 141 0369)."
      );
      return;
    }

    setSubmitting(true);

    try {
      // 1. Submit to Web3Forms to notify the store official email
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: accessKey,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || "Not provided",
          subject: `[GizmoTek Inquiry] ${subject} - ${name.trim()}`,
          message: message.trim(),
          from_name: "GizmoTek Customer Inquiry",
          replyto: email.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 2. Dispatch automated customer confirmation email if customer email was provided
        if (email.trim()) {
          const userEmail = email.trim();
          setSubmittedEmail(userEmail);
          try {
            await fetch("/api/contact-confirm", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: name.trim(),
                phone: phone.trim(),
                email: userEmail,
                subject,
                message: message.trim(),
              }),
            });
          } catch (confirmErr) {
            console.warn("Could not dispatch customer confirmation email:", confirmErr);
          }
        } else {
          setSubmittedEmail("");
        }

        setSubmitted(true);
        setName("");
        setPhone("");
        setEmail("");
        setMessage("");
        setSubject("General Inquiry");
      } else {
        setErrorMessage(
          data.message || "Failed to submit your message. Please try again or reach out on WhatsApp."
        );
      }
    } catch (err: any) {
      setErrorMessage(
        "A network error occurred while submitting your message. Please check your internet connection or reach out on WhatsApp."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10 text-slate-300">
      {/* Breadcrumb Header */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-cyan-400">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-300 font-medium">Contact Us</span>
        </div>
        <div className="flex items-center gap-2.5 text-cyan-400">
          <MessageSquare className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Customer Support</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Contact GizmoTek Customer Service
        </h1>
        <p className="text-xs text-slate-400">
          Have questions regarding an order, technical specifications, or islandwide delivery? We are here to help!
        </p>
      </div>

      {/* Main Grid: Contact Info & Inquiry Form */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Direct Contact Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-white text-base border-b border-slate-800 pb-3">
              Official Contact Information
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Online Store Operations</h4>
                  <p className="text-slate-400 mt-0.5">Operating from Southern Province, Sri Lanka (Islandwide Courier Dispatch)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Direct Helpline &amp; WhatsApp</h4>
                  <p className="text-slate-400 mt-0.5">+94 72 141 0369</p>
                  <a
                    href="https://wa.me/94721410369"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 font-semibold hover:underline inline-block mt-1 text-[11px]"
                  >
                    Chat on WhatsApp ➔
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Email Inquiries</h4>
                  <p className="text-slate-400 mt-0.5">orders@gizmotek.lk</p>
                  <p className="text-slate-400">support@gizmotek.lk</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Operating Hours</h4>
                  <p className="text-slate-400 mt-0.5">Monday - Saturday: 9:00 AM - 7:00 PM</p>
                  <p className="text-slate-400">Sunday: 10:00 AM - 4:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Sri Lankan E-Commerce Business</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              GizmoTek is registered in Sri Lanka, operating with dedicated customer support and verified PayHere secure payment gateway integration.
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Inquiry Form */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-bold text-white text-lg">Send Us an Inquiry</h3>
              <p className="text-xs text-slate-400 mt-1">
                Fill out the form below and our customer support team will reply within 2-4 hours during business days.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-base">Inquiry Submitted Successfully!</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out to GizmoTek. Our representative will review your inquiry and contact you via WhatsApp or Email shortly.
                  </p>
                  {submittedEmail && (
                    <div className="mt-3 p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl inline-flex items-center gap-2 text-xs text-cyan-300">
                      <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>An inquiry confirmation receipt was sent to <strong>{submittedEmail}</strong></span>
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setErrorMessage(null);
                      setSubmittedEmail("");
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Honeypot Spam Protection (Hidden from legitimate users) */}
                <input
                  type="checkbox"
                  name="botcheck"
                  checked={!!botcheck}
                  onChange={(e) => setBotcheck(e.target.checked ? "checked" : "")}
                  className="hidden"
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {errorMessage && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-rose-300">Unable to submit inquiry</p>
                      <p className="text-[11px] text-rose-400/90 mt-0.5">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Kasun Perera"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium">Phone / WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 072 141 0369"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. kasun@gmail.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium">Subject / Topic</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                    >
                      <option value="General Inquiry">General Product Inquiry</option>
                      <option value="Order Status">Track Existing Order Status</option>
                      <option value="Warranty Claim">Warranty Claim / Replacement</option>
                      <option value="Payment Assistance">Online Payment Assistance</option>
                      <option value="Wholesale Bulk">Corporate / Bulk Order Inquiry</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Your Message / Order Details *</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your inquiry, requested item, or provide your order reference number..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/10"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Inquiry to Support Team</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

