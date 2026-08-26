import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "@/store/useCartStore";
import {
  SRI_LANKA_DISTRICTS,
  District,
  BANK_ACCOUNTS,
  FLAT_DELIVERY_FEE_LKR,
  PAYMENT_GATEWAY_FEE_PERCENT,
  IS_PAYMENT_GATEWAY_ENABLED,
} from "@/lib/constants";
import { formatLKR, calculateShippingFee, calculatePaymentGatewayFee } from "@/lib/utils";
import { getCitiesForDistrict, CityInfo } from "@/data/sriLankaCities";
import { OptimizedImage } from "@/components/common/OptimizedImage";
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
  Edit3,
  List,
} from "lucide-react";
import { SEOHead } from "@/components/common/SEOHead";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCartStore();

  const subtotal = getSubtotal();

  // Shipping Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState<District>("Colombo");
  const [city, setCity] = useState("Colombo 03 (Kollupitiya)");
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState("");
  const [postalCode, setPostalCode] = useState("00300");
  const [notes, setNotes] = useState("");

  // Payment Method State: "COD" | "BANK_TRANSFER" | "PAYHERE"
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER" | "PAYHERE">("COD");

  // Bank Slip Upload State
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState<string | null>(null);
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Flat 450 LKR Delivery fee across any city in Sri Lanka
  const shippingFee = calculateShippingFee(district, subtotal);

  // 4% Payment Gateway Processing Fee for PayHere / Online Card payments
  const isCardPayment = paymentMethod === "PAYHERE";
  const gatewayFee = calculatePaymentGatewayFee(subtotal, paymentMethod);
  const totalAmount = subtotal + shippingFee + gatewayFee;
  const isPayHereLimitExceeded = totalAmount > 50000;
  const isPayHereAvailable = IS_PAYMENT_GATEWAY_ENABLED && !isPayHereLimitExceeded;

  // Handle District Change
  const handleDistrictChange = (newDistrict: District) => {
    setDistrict(newDistrict);
    const cities = getCitiesForDistrict(newDistrict);
    if (cities.length > 0) {
      setCity(cities[0].name);
      setPostalCode(cities[0].postalCode || "");
      setIsCustomCity(false);
    }
  };

  // Handle City Select
  const handleCitySelect = (selectedVal: string) => {
    if (selectedVal === "__OTHER__") {
      setIsCustomCity(true);
      setCity("");
      setPostalCode("");
    } else {
      setIsCustomCity(false);
      setCity(selectedVal);
      const cities = getCitiesForDistrict(district);
      const found = cities.find((c) => c.name === selectedVal);
      if (found?.postalCode) {
        setPostalCode(found.postalCode);
      }
    }
  };

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

    const effectiveCity = isCustomCity ? customCity.trim() : city.trim();
    if (!customerName || !customerPhone || !address || !district || !effectiveCity) {
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

    if (paymentMethod === "PAYHERE" && !IS_PAYMENT_GATEWAY_ENABLED) {
      setErrorMsg("Online card payment is temporarily unavailable. Please choose Cash on Delivery or Bank Transfer.");
      return;
    }

    const cityWithPostal = postalCode.trim()
      ? `${effectiveCity} (Postal: ${postalCode.trim()})`
      : effectiveCity;

    setSubmitting(true);
    try {
      const orderPayload = {
        customerName,
        customerPhone,
        customerEmail,
        address,
        district,
        city: cityWithPostal,
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
        const createdOrder = data.order;

        if (paymentMethod === "PAYHERE") {
          // Request signed PayHere payload
          const hashRes = await fetch("/api/payhere/hash", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: createdOrder.id,
              orderNumber: createdOrder.orderNumber,
              totalLkr: createdOrder.totalLkr,
              customerName,
              customerPhone,
              customerEmail,
              address,
              city: cityWithPostal,
              itemsSummary: items.map((i) => i.product.title).join(", "),
            }),
          });

          if (hashRes.ok) {
            const { payload } = await hashRes.json();
            clearCart();

            // Submit form automatically to PayHere Gateway
            const form = document.createElement("form");
            form.method = "POST";
            form.action = payload.actionUrl;

            Object.keys(payload).forEach((key) => {
              if (key !== "actionUrl") {
                const hiddenInput = document.createElement("input");
                hiddenInput.type = "hidden";
                hiddenInput.name = key;
                hiddenInput.value = payload[key];
                form.appendChild(hiddenInput);
              }
            });

            document.body.appendChild(form);
            form.submit();
            return;
          } else {
            setErrorMsg("PayHere initialization failed. Order saved for manual review.");
          }
        }

        clearCart();
        navigate(`/checkout/success?orderNumber=${createdOrder.orderNumber}&id=${createdOrder.id}`);
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
          to="/products"
          className="inline-block bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <SEOHead title="Secure Checkout | GizmoTek.lk" noIndex={true} />
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/products"
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
                  onChange={(e) => handleDistrictChange(e.target.value as District)}
                  className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none cursor-pointer"
                >
                  {SRI_LANKA_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist} className="bg-slate-900">
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">City / Town *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCity(!isCustomCity);
                      if (!isCustomCity) {
                        setCustomCity("");
                        setPostalCode("");
                      } else {
                        const cities = getCitiesForDistrict(district);
                        if (cities.length > 0) {
                          setCity(cities[0].name);
                          setPostalCode(cities[0].postalCode || "");
                        }
                      }
                    }}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isCustomCity ? (
                      <>
                        <List className="w-3 h-3" />
                        <span>Select from City List</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3 h-3" />
                        <span>Type City Manually</span>
                      </>
                    )}
                  </button>
                </div>

                {!isCustomCity ? (
                  <select
                    value={city}
                    onChange={(e) => handleCitySelect(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none cursor-pointer"
                  >
                    {getCitiesForDistrict(district).map((c) => (
                      <option key={c.name} value={c.name} className="bg-slate-900">
                        {c.name} {c.postalCode ? `(${c.postalCode})` : ""}
                      </option>
                    ))}
                    <option value="__OTHER__" className="bg-slate-900 text-cyan-400 font-bold">
                      ✍️ Other / Type City &amp; Postal Code Manually...
                    </option>
                  </select>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="Type your town or city"
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-cyan-500/60 focus:border-cyan-400 outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-cyan-400 outline-none font-mono text-center"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-300">Courier Delivery Remarks (Optional)</label>
              <textarea
                rows={2}
                placeholder="Special instructions for courier driver (e.g. Call before delivery, landmark)"
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
                className={`p-4 rounded-2xl border text-left transition-all space-y-2 cursor-pointer ${
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
                  <div className="text-[10px] text-emerald-400 font-medium">0% Gateway Fee</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={`p-4 rounded-2xl border text-left transition-all space-y-2 cursor-pointer ${
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
                  <div className="text-[10px] text-emerald-400 font-medium">0% Gateway Fee</div>
                </div>
              </button>

              <button
                type="button"
                disabled={!isPayHereAvailable}
                onClick={() => {
                  if (isPayHereAvailable) setPaymentMethod("PAYHERE");
                }}
                className={`p-4 rounded-2xl border text-left transition-all space-y-2 relative ${
                  !isPayHereAvailable
                    ? "bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed"
                    : paymentMethod === "PAYHERE"
                    ? "bg-cyan-950/40 border-cyan-400 shadow-neon cursor-pointer"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700 cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between">
                  <CreditCard className={`w-5 h-5 ${paymentMethod === "PAYHERE" && isPayHereAvailable ? "text-cyan-400" : "text-slate-400"}`} />
                  {paymentMethod === "PAYHERE" && isPayHereAvailable && (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  )}
                  {!IS_PAYMENT_GATEWAY_ENABLED && (
                    <span className="text-[9px] bg-amber-500/15 text-amber-300/90 px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
                      Under Review
                    </span>
                  )}
                  {IS_PAYMENT_GATEWAY_ENABLED && isPayHereLimitExceeded && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
                      Over 50k Limit
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-xs">Card / PayHere</div>
                  <div className="text-[10px] text-cyan-400 font-medium">
                    {!IS_PAYMENT_GATEWAY_ENABLED
                      ? "Temporarily Disabled (Bank Review)"
                      : isPayHereLimitExceeded
                      ? "Disabled (> Rs. 50,000)"
                      : "Visa, Master (+4% Gateway Fee)"}
                  </div>
                </div>
              </button>
            </div>

            {/* PayHere Status & Limit Notices */}
            {!IS_PAYMENT_GATEWAY_ENABLED && (
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 text-slate-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-200 block">
                    Online Card Payment Temporarily Inactive
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Our PayHere card payment gateway is undergoing bank activation review (5-10 business days). Please complete your order securely using <strong>Cash on Delivery (COD)</strong> or <strong>Direct Bank Transfer</strong>.
                  </p>
                </div>
              </div>
            )}

            {IS_PAYMENT_GATEWAY_ENABLED && isPayHereLimitExceeded && (
              <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-200 block">
                    Online Card Payment Unavailable for Orders Over Rs. 50,000
                  </span>
                  <p className="text-[11px] text-amber-300/80 leading-relaxed">
                    Online payment gateway supports card transactions up to <strong>LKR 50,000</strong> per payment. Because your order total is <strong>{formatLKR(totalAmount)}</strong>, please complete your order using <strong>Cash on Delivery (COD)</strong> or <strong>Direct Bank Transfer</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT 1: COD */}
            {paymentMethod === "COD" && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Cash on Delivery Order Notice
                </div>
                <p className="text-slate-400 leading-relaxed">
                  No advance payment is required. You will pay the courier driver <strong className="text-slate-200">{formatLKR(totalAmount)}</strong> in cash when your parcel is delivered to {district}. Our team will contact your phone before dispatch.
                </p>
              </div>
            )}

            {/* TAB CONTENT 2: BANK TRANSFER & SLIP UPLOAD */}
            {paymentMethod === "BANK_TRANSFER" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="font-bold text-slate-200 uppercase tracking-wider">
                    Bank Account Details for GizmoTek LK
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

            {/* TAB CONTENT 3: PAYHERE GATEWAY */}
            {paymentMethod === "PAYHERE" && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                    <span>PayHere Sri Lanka Online Payment (Visa / Master)</span>
                  </span>
                  <span className="text-[10px] bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 px-2.5 py-0.5 rounded-full font-mono">
                    +4% Gateway Fee
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed">
                  You will be securely redirected to <strong>PayHere Payment Gateway</strong> to complete card payment of <strong className="text-cyan-400 font-bold">{formatLKR(totalAmount)}</strong> (Includes items Rs. {subtotal.toLocaleString()} + delivery Rs. 450 + 4% gateway processing Rs. {gatewayFee.toLocaleString()}).
                </p>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-300 font-semibold">Accepted Sri Lanka Payment Options:</span>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-cyan-400">
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Visa / Master</span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">KOKO PayLater</span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">eZ Cash / mCash</span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Frimi / Genie</span>
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
              {items.map(({ product, quantity, selectedColor, selectedVariant, warranty }) => {
                const imgs = JSON.parse(product.images || "[]");
                return (
                  <div key={product.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                        <OptimizedImage src={imgs[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"} alt={product.title} fill />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200 line-clamp-1 max-w-[180px]">{product.title}</h4>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Qty: {quantity}</span>
                          {selectedColor && <span className="text-cyan-400">Color: {selectedColor}</span>}
                          {selectedVariant && <span className="text-cyan-400">{selectedVariant}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-slate-200">{formatLKR(product.sellingPriceLkr * quantity)}</span>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="space-y-2.5 text-xs pt-4 border-t border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-200">{formatLKR(subtotal)}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Islandwide Delivery Fee (Any City)</span>
                <span className="font-semibold text-slate-200">{formatLKR(shippingFee)}</span>
              </div>

              {isCardPayment && (
                <div className="flex justify-between text-cyan-400">
                  <span className="flex items-center gap-1">
                    <span>Payment Gateway Fee (4%)</span>
                  </span>
                  <span className="font-bold font-mono">+{formatLKR(gatewayFee)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-white pt-3 border-t border-slate-800">
                <span>Total Amount (LKR)</span>
                <span className="text-cyan-400 text-lg">{formatLKR(totalAmount)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 text-slate-950 font-extrabold text-sm py-4 rounded-xl shadow-neon transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Order...</span>
                </div>
              ) : (
                <>
                  <span>Complete Order &amp; Dispatch</span>
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
