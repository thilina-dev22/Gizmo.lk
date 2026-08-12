"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { SRI_LANKA_DISTRICTS, District, BANK_ACCOUNTS, FREE_SHIPPING_THRESHOLD_LKR } from "@/lib/constants";
import { formatLKR, calculateShippingFee } from "@/lib/utils";
import {
  Banknote,
  Building2,
  CreditCard,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Truck,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  FileCheck,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();

  const subtotal = getSubtotal();

  // Shipping Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState<District>("Colombo");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  // Payment Method State: "COD" | "BANK_TRANSFER" | "CARD"
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER" | "CARD">("COD");

  // Bank Slip Upload State
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState<string | null>(null);
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);

  // Card Test Details
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("123");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const shippingFee = calculateShippingFee(district, subtotal);
  const totalAmount = subtotal + shippingFee;

  // Handle Bank Slip file selection
  const handleSlipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSlipFile(file);
      setIsUploadingSlip(true);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload-slip", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          setSlipPreviewUrl(data.url);
        }
      } catch (err) {
        console.error("Slip upload error:", err);
      } finally {
        setIsUploadingSlip(false);
      }
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!customerName || !customerPhone || !address || !district || !city) {
      setErrorMsg("Please fill in all required shipping fields (*)");
      return;
    }

    if (items.length === 0) {
      setErrorMsg("Your cart is empty. Add items to checkout.");
      return;
    }

    if (paymentMethod === "BANK_TRANSFER" && !slipPreviewUrl) {
      setErrorMsg("Please attach your bank deposit slip screenshot before completing your order.");
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        customerName,
        customerPhone,
        customerEmail,
        address,
        district,
        city,
        paymentMethod,
        bankSlipUrl: slipPreviewUrl,
        notes,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        const data = await res.json();
        clearCart();
        router.push(`/checkout/success?orderNumber=${data.order.orderNumber}&id=${data.order.id}`);
      } else {
        const errorData = await res.json();
        setErrorMsg(errorData.error || "Order submission failed");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Your Checkout Cart is Empty</h2>
        <p className="text-xs text-slate-400">Add tech items to your cart before proceeding to checkout.</p>
        <Link
          href="/products"
          className="inline-block bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
        Checkout & Courier Dispatch
      </h1>
      <p className="text-xs text-slate-400 mb-8">
        Islandwide delivery across all 25 Sri Lankan districts. Select your preferred payment method below.
      </p>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Customer Shipping & Payment Options (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Step 1: Customer & Address Info */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-extrabold flex items-center justify-center border border-cyan-500/30">
                1
              </div>
              <h2 className="text-base font-bold text-slate-100">Shipping Details (Sri Lanka)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Fernando"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-300">Phone Number (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0771234567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-300">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="e.g. kasun@example.lk"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-300">Street Address *</label>
              <input
                type="text"
                required
                placeholder="House No, Street, Road Name"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-300">District *</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value as District)}
                  className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none cursor-pointer"
                >
                  {SRI_LANKA_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist} className="bg-slate-900">
                      {dist} {dist === "Colombo" || dist === "Gampaha" ? "(Metro - Rs. 350)" : "(Outstation - Rs. 500)"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-300">City / Town *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nugegoda, Kandy, Galle"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-300">Courier Delivery Remarks (Optional)</label>
              <textarea
                rows={2}
                placeholder="Special instructions for courier driver (e.g. Call before delivery)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Step 2: Payment Options Tabs */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-extrabold flex items-center justify-center border border-cyan-500/30">
                2
              </div>
              <h2 className="text-base font-bold text-slate-100">Select Payment Method</h2>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("COD")}
                className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${
                  paymentMethod === "COD"
                    ? "bg-cyan-950/40 border-cyan-400 shadow-neon"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Banknote className={`w-5 h-5 ${paymentMethod === "COD" ? "text-cyan-400" : "text-slate-400"}`} />
                  {paymentMethod === "COD" && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-xs">Cash on Delivery</div>
                  <div className="text-[10px] text-slate-400">Pay cash upon delivery</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "bg-cyan-950/40 border-cyan-400 shadow-neon"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Building2 className={`w-5 h-5 ${paymentMethod === "BANK_TRANSFER" ? "text-cyan-400" : "text-slate-400"}`} />
                  {paymentMethod === "BANK_TRANSFER" && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-xs">Bank Transfer</div>
                  <div className="text-[10px] text-slate-400">Upload deposit slip</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${
                  paymentMethod === "CARD"
                    ? "bg-cyan-950/40 border-cyan-400 shadow-neon"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <CreditCard className={`w-5 h-5 ${paymentMethod === "CARD" ? "text-cyan-400" : "text-slate-400"}`} />
                  {paymentMethod === "CARD" && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-xs">Online Card</div>
                  <div className="text-[10px] text-slate-400">Stripe Sandbox / PayHere</div>
                </div>
              </button>
            </div>

            {/* TAB CONTENT 1: COD */}
            {paymentMethod === "COD" && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Cash on Delivery Order Notice
                </div>
                <p className="text-slate-400 leading-relaxed">
                  No advance payment is required. You will pay the courier driver <strong className="text-slate-200">{formatLKR(totalAmount)}</strong> in cash when your parcel is delivered to {district}. Our team will call or message your phone number before dispatch.
                </p>
              </div>
            )}

            {/* TAB CONTENT 2: BANK TRANSFER & SLIP UPLOAD */}
            {paymentMethod === "BANK_TRANSFER" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="font-bold text-slate-200 uppercase tracking-wider">
                    Bank Account Details for Gizmo LK
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {BANK_ACCOUNTS.map((bank, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="font-bold text-slate-200 text-xs">{bank.bankName}</div>
                        <div className="text-[11px] text-cyan-400 font-mono mt-1">{bank.accountNumber}</div>
                        <div className="text-[10px] text-slate-400">{bank.accountName}</div>
                        <div className="text-[9px] text-slate-500">{bank.branch}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload Field */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-dashed border-cyan-500/40 space-y-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-xs">Attach Bank Deposit Slip Screenshot *</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supported formats: JPG, PNG, PDF. Max size: 5MB
                    </p>
                  </div>

                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleSlipChange}
                    className="hidden"
                    id="slip-upload"
                  />
                  <label
                    htmlFor="slip-upload"
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-cyan-400 font-bold px-4 py-2 rounded-xl border border-slate-700 cursor-pointer text-xs transition-colors"
                  >
                    <span>{slipFile ? "Change Slip File" : "Choose File / Take Photo"}</span>
                  </label>

                  {isUploadingSlip && (
                    <div className="text-xs text-cyan-400 font-medium">Processing slip image...</div>
                  )}

                  {slipPreviewUrl && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <FileCheck className="w-4 h-4" />
                        <span>Payment Slip Attached ({slipFile?.name})</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Ready for verification</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: STRIPE ONLINE CARD */}
            {paymentMethod === "CARD" && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Stripe Sandbox Card Integration</span>
                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-cyan-400 px-2 py-0.5 rounded font-mono">
                    Test Mode (PayHere Ready)
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Card Number (Use Test Card)</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 font-mono focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-medium">Expiry</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 font-mono focus:border-cyan-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-medium">CVC</label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 font-mono focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Summary Sidebar (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 sticky top-24">
            <h3 className="font-extrabold text-white text-base pb-3 border-b border-slate-800">
              Order Summary
            </h3>

            {/* Items */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-800">
              {items.map(({ product, quantity }) => {
                const imgs = JSON.parse(product.images || "[]");
                return (
                  <div key={product.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                        <Image src={imgs[0] || "/placeholder.jpg"} alt={product.title} fill className="object-cover" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200 line-clamp-1 max-w-[180px]">{product.title}</h4>
                        <span className="text-[10px] text-slate-400">Qty: {quantity}</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-200">{formatLKR(product.sellingPriceLkr * quantity)}</span>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="space-y-2 text-xs pt-4 border-t border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-200">{formatLKR(subtotal)}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>District Shipping ({district})</span>
                <span className="font-semibold text-slate-200">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-400 font-bold">FREE</span>
                  ) : (
                    formatLKR(shippingFee)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm font-extrabold text-white pt-3 border-t border-slate-800">
                <span>Total Amount (LKR)</span>
                <span className="text-cyan-400 text-lg">{formatLKR(totalAmount)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 text-slate-950 font-extrabold text-sm py-4 rounded-xl shadow-neon transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Order...</span>
                </div>
              ) : (
                <>
                  <span>Complete Order & Dispatch</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
