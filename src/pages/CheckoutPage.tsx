import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCartItemKey, Product, useCartStore } from "@/store/useCartStore";
import {
  SRI_LANKA_DISTRICTS,
  District,
  BANK_ACCOUNTS,
  IS_PAYMENT_GATEWAY_ENABLED,
  FALLBACK_PRODUCT_IMAGE,
  FREE_SHIPPING_THRESHOLD_LKR,
  PAYHERE_MAX_TOTAL_LKR,
} from "@/lib/constants";
import {
  formatLKR,
  calculateShippingFee,
  calculatePaymentGatewayFee,
  isValidEmail,
  normalizeSriLankanPhone,
  safeParseImages,
} from "@/lib/utils";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { prepareBankSlip, PreparedSlip } from "@/lib/bankSlip";
import { toast } from "@/store/useToastStore";
import { getCitiesForDistrict } from "@/data/sriLankaCities";
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
  FileText,
  Edit3,
  List,
  Loader2,
  Lock,
  X,
} from "lucide-react";
import { SEOHead } from "@/components/common/SEOHead";

type PaymentMethod = "COD" | "BANK_TRANSFER" | "PAYHERE";
type FieldName = "customerName" | "customerPhone" | "customerEmail" | "address" | "city" | "slip";

const inputBaseClass =
  "w-full bg-slate-950 text-slate-100 p-3 rounded-xl border outline-none transition-colors placeholder:text-slate-600";

function fieldClass(hasError: boolean) {
  return `${inputBaseClass} ${hasError ? "border-rose-500/70 focus:border-rose-400" : "border-slate-800 focus:border-cyan-500"}`;
}

function FieldError({ message, id }: { message?: string; id: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[11px] text-rose-400 flex items-center gap-1 animate-fade-in">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {message}
    </p>
  );
}

function submitPayHereForm(payload: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = payload.actionUrl;
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "actionUrl") return;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart, syncProducts } = useCartStore();

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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");

  // Bank Slip State
  const [slip, setSlip] = useState<PreparedSlip | null>(null);
  const [isProcessingSlip, setIsProcessingSlip] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [isSyncingCart, setIsSyncingCart] = useState(true);
  const [redirectingToPayHere, setRedirectingToPayHere] = useState(false);
  const submittingRef = useRef(false);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const shippingFee = calculateShippingFee(district, subtotal);
  const isCardPayment = paymentMethod === "PAYHERE";
  const gatewayFee = calculatePaymentGatewayFee(subtotal, paymentMethod);
  const totalAmount = subtotal + shippingFee + gatewayFee;
  const cardTotal = subtotal + shippingFee + calculatePaymentGatewayFee(subtotal, "PAYHERE");
  const isPayHereLimitExceeded = cardTotal > PAYHERE_MAX_TOTAL_LKR;
  const isPayHereAvailable = IS_PAYMENT_GATEWAY_ENABLED && !isPayHereLimitExceeded;

  // Refresh cart prices & stock from the server so the customer sees what they'll actually pay
  useEffect(() => {
    const productIds = [...new Set(useCartStore.getState().items.map((item) => item.product.id))];
    if (productIds.length === 0) {
      setIsSyncingCart(false);
      return;
    }
    const controller = new AbortController();
    apiFetch<{ products: Product[] }>(`/api/products?ids=${productIds.map(encodeURIComponent).join(",")}&limit=50`, {
      signal: controller.signal,
    })
      .then((data) => {
        const result = syncProducts(data.products || []);
        const notices: string[] = [];
        if (result.removedTitles.length > 0) {
          notices.push(`Removed unavailable item${result.removedTitles.length > 1 ? "s" : ""}: ${result.removedTitles.join(", ")}.`);
        }
        if (result.priceChanged) notices.push("Some prices were updated to the latest store prices.");
        if (result.quantityAdjusted) notices.push("Some quantities were reduced to match available stock.");
        if (notices.length > 0) setCartNotice(notices.join(" "));
      })
      .catch(() => {
        // Non-blocking: the server re-validates prices & stock when the order is placed
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsSyncingCart(false);
      });
    return () => controller.abort();
  }, [syncProducts]);

  // Fall back to COD if card payment becomes unavailable (e.g. total crosses the card limit)
  useEffect(() => {
    if (paymentMethod === "PAYHERE" && !isPayHereAvailable) {
      setPaymentMethod("COD");
    }
  }, [paymentMethod, isPayHereAvailable]);

  const clearFieldError = (field: FieldName) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  // Handle District Change
  const handleDistrictChange = (newDistrict: District) => {
    setDistrict(newDistrict);
    const cities = getCitiesForDistrict(newDistrict);
    if (cities.length > 0) {
      setCity(cities[0].name);
      setPostalCode(cities[0].postalCode || "");
      setIsCustomCity(false);
    } else {
      setIsCustomCity(true);
      setCity("");
      setPostalCode("");
    }
  };

  // Handle City Select
  const handleCitySelect = (selectedVal: string) => {
    if (selectedVal === "__OTHER__") {
      setIsCustomCity(true);
      setCity("");
      setCustomCity("");
      setPostalCode("");
    } else {
      setIsCustomCity(false);
      setCity(selectedVal);
      const found = getCitiesForDistrict(district).find((c) => c.name === selectedVal);
      setPostalCode(found?.postalCode || "");
    }
    clearFieldError("city");
  };

  const toggleCustomCity = () => {
    if (!isCustomCity) {
      setIsCustomCity(true);
      setCustomCity("");
      setPostalCode("");
    } else {
      setIsCustomCity(false);
      const cities = getCitiesForDistrict(district);
      if (cities.length > 0) {
        setCity(cities[0].name);
        setPostalCode(cities[0].postalCode || "");
      }
    }
    clearFieldError("city");
  };

  // Bank slip selection: validate & compress locally, then attach to the order
  const handleSlipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setIsProcessingSlip(true);
    clearFieldError("slip");
    try {
      setSlip(await prepareBankSlip(file));
    } catch (err) {
      setSlip(null);
      setFieldErrors((prev) => ({ ...prev, slip: getErrorMessage(err, "Could not attach this file.") }));
    } finally {
      setIsProcessingSlip(false);
    }
  };

  const validateForm = (): Partial<Record<FieldName, string>> => {
    const errors: Partial<Record<FieldName, string>> = {};
    const effectiveCity = isCustomCity ? customCity.trim() : city.trim();
    if (customerName.trim().length < 2) errors.customerName = "Please enter your full name.";
    if (!normalizeSriLankanPhone(customerPhone)) {
      errors.customerPhone = "Enter a valid Sri Lankan number, e.g. 0771234567.";
    }
    if (customerEmail.trim() && !isValidEmail(customerEmail)) {
      errors.customerEmail = "Please enter a valid email address or leave it empty.";
    }
    if (address.trim().length < 4) errors.address = "Please enter your house number and street.";
    if (!effectiveCity) errors.city = "Please select or type your city.";
    if (paymentMethod === "BANK_TRANSFER" && !slip) {
      errors.slip = "Please attach your bank deposit slip before completing your order.";
    }
    return errors;
  };

  const showError = (message: string) => {
    setErrorMsg(message);
    requestAnimationFrame(() => errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setErrorMsg("");

    const errors = validateForm();
    setFieldErrors(errors);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      document.getElementById(`field-${firstInvalid}`)?.focus();
      showError("Please fix the highlighted fields to continue.");
      return;
    }

    if (items.length === 0) {
      showError("Your cart is empty. Add items to checkout.");
      return;
    }

    if (paymentMethod === "PAYHERE" && !isPayHereAvailable) {
      showError("Online card payment is unavailable for this order. Please choose Cash on Delivery or Bank Transfer.");
      return;
    }

    const effectiveCity = isCustomCity ? customCity.trim() : city.trim();
    const cityWithPostal = postalCode.trim() ? `${effectiveCity} (Postal: ${postalCode.trim()})` : effectiveCity;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const { order } = await apiFetch<{ order: { id: string; orderNumber: string } }>("/api/orders", {
        method: "POST",
        body: {
          customerName: customerName.trim(),
          customerPhone: normalizeSriLankanPhone(customerPhone),
          customerEmail: customerEmail.trim(),
          address: address.trim(),
          district,
          city: cityWithPostal,
          paymentMethod,
          bankSlipUrl: paymentMethod === "BANK_TRANSFER" ? slip?.dataUrl : undefined,
          notes: notes.trim(),
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            selectedColor: item.selectedColor,
            selectedVariant: item.selectedVariant,
          })),
        },
      });

      const successUrl = `/checkout/success?orderNumber=${encodeURIComponent(order.orderNumber)}&id=${order.id}`;

      if (paymentMethod === "PAYHERE") {
        try {
          const { payload } = await apiFetch<{ payload: Record<string, string> }>("/api/payhere/hash", {
            method: "POST",
            body: { orderId: order.id },
          });
          setRedirectingToPayHere(true);
          clearCart();
          submitPayHereForm(payload);
          return; // keep the loading state while the browser redirects to PayHere
        } catch (err) {
          toast.error(`Your order was saved, but the card payment page couldn't open: ${getErrorMessage(err)}`);
        }
      }

      clearCart();
      navigate(successUrl);
    } catch (err) {
      showError(getErrorMessage(err, "Failed to process order. Please try again."));
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (redirectingToPayHere) {
    return (
      <div role="status" className="max-w-xl mx-auto px-4 py-24 text-center space-y-4 animate-fade-in">
        <SEOHead title="Secure Checkout | GizmoTek.lk" noIndex={true} />
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
        <h2 className="text-lg font-bold text-white">Redirecting to secure PayHere payment…</h2>
        <p className="text-xs text-slate-400">Please don&apos;t close this window.</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4 animate-fade-in">
        <SEOHead title="Secure Checkout | GizmoTek.lk" noIndex={true} />
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Your Checkout Cart is Empty</h2>
        {cartNotice && <p className="text-xs text-amber-300">{cartNotice}</p>}
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

  const cityOptions = getCitiesForDistrict(district);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
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

      {cartNotice && (
        <div className="mb-6 p-4 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span className="flex-1">{cartNotice}</span>
          <button type="button" onClick={() => setCartNotice(null)} aria-label="Dismiss" className="text-amber-400/70 hover:text-amber-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          ref={errorBannerRef}
          role="alert"
          className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-fade-in"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Customer Shipping & Payment Options (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Step 1: Customer & Address Info */}
          <fieldset disabled={submitting} className="min-w-0 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-extrabold flex items-center justify-center border border-cyan-500/30">
                1
              </div>
              <h2 className="text-base font-bold text-slate-100">Shipping Details (Sri Lanka)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label htmlFor="field-customerName" className="font-semibold text-slate-300">Full Name *</label>
                <input
                  id="field-customerName"
                  type="text"
                  required
                  autoComplete="name"
                  maxLength={80}
                  placeholder="e.g. Kasun Fernando"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    clearFieldError("customerName");
                  }}
                  aria-invalid={Boolean(fieldErrors.customerName)}
                  aria-describedby="error-customerName"
                  className={fieldClass(Boolean(fieldErrors.customerName))}
                />
                <FieldError id="error-customerName" message={fieldErrors.customerName} />
              </div>

              <div className="space-y-1 text-xs">
                <label htmlFor="field-customerPhone" className="font-semibold text-slate-300">Phone Number (WhatsApp) *</label>
                <input
                  id="field-customerPhone"
                  type="tel"
                  inputMode="tel"
                  required
                  autoComplete="tel"
                  maxLength={16}
                  placeholder="e.g. 0771234567"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    clearFieldError("customerPhone");
                  }}
                  onBlur={() => {
                    if (customerPhone.trim() && !normalizeSriLankanPhone(customerPhone)) {
                      setFieldErrors((prev) => ({ ...prev, customerPhone: "Enter a valid Sri Lankan number, e.g. 0771234567." }));
                    }
                  }}
                  aria-invalid={Boolean(fieldErrors.customerPhone)}
                  aria-describedby="error-customerPhone"
                  className={fieldClass(Boolean(fieldErrors.customerPhone))}
                />
                <FieldError id="error-customerPhone" message={fieldErrors.customerPhone} />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label htmlFor="field-customerEmail" className="font-semibold text-slate-300">
                Email Address <span className="text-slate-500 font-normal">(optional — for your order confirmation)</span>
              </label>
              <input
                id="field-customerEmail"
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={120}
                placeholder="e.g. kasun@example.lk"
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value);
                  clearFieldError("customerEmail");
                }}
                aria-invalid={Boolean(fieldErrors.customerEmail)}
                aria-describedby="error-customerEmail"
                className={fieldClass(Boolean(fieldErrors.customerEmail))}
              />
              <FieldError id="error-customerEmail" message={fieldErrors.customerEmail} />
            </div>

            <div className="space-y-1 text-xs">
              <label htmlFor="field-address" className="font-semibold text-slate-300">Street Address *</label>
              <input
                id="field-address"
                type="text"
                required
                autoComplete="street-address"
                maxLength={200}
                placeholder="House No, Street, Road Name"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  clearFieldError("address");
                }}
                aria-invalid={Boolean(fieldErrors.address)}
                aria-describedby="error-address"
                className={fieldClass(Boolean(fieldErrors.address))}
              />
              <FieldError id="error-address" message={fieldErrors.address} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label htmlFor="field-district" className="font-semibold text-slate-300">District *</label>
                <select
                  id="field-district"
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value as District)}
                  className={`${fieldClass(false)} cursor-pointer`}
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
                  <label htmlFor="field-city" className="font-semibold text-slate-300">City / Town *</label>
                  {cityOptions.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleCustomCity}
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
                  )}
                </div>

                {!isCustomCity ? (
                  <select
                    id="field-city"
                    value={city}
                    onChange={(e) => handleCitySelect(e.target.value)}
                    className={`${fieldClass(Boolean(fieldErrors.city))} cursor-pointer`}
                  >
                    {cityOptions.map((c) => (
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
                        id="field-city"
                        type="text"
                        required
                        autoComplete="address-level2"
                        maxLength={80}
                        placeholder="Type your town or city"
                        value={customCity}
                        onChange={(e) => {
                          setCustomCity(e.target.value);
                          clearFieldError("city");
                        }}
                        aria-invalid={Boolean(fieldErrors.city)}
                        className={fieldClass(Boolean(fieldErrors.city))}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={5}
                        placeholder="Postal Code"
                        aria-label="Postal code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                        className={`${fieldClass(false)} font-mono text-center`}
                      />
                    </div>
                  </div>
                )}
                <FieldError id="error-city" message={fieldErrors.city} />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label htmlFor="field-notes" className="font-semibold text-slate-300">Courier Delivery Remarks (Optional)</label>
              <textarea
                id="field-notes"
                rows={2}
                maxLength={300}
                placeholder="Special instructions for courier driver (e.g. Call before delivery, landmark)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${fieldClass(false)} resize-none`}
              />
            </div>
          </fieldset>

          {/* Step 2: Payment Options Tabs */}
          <fieldset disabled={submitting} className="min-w-0 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-extrabold flex items-center justify-center border border-cyan-500/30">
                2
              </div>
              <h2 className="text-base font-bold text-slate-100">Select Payment Method</h2>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Payment method">
              <button
                type="button"
                role="radio"
                aria-checked={paymentMethod === "COD"}
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
                role="radio"
                aria-checked={paymentMethod === "BANK_TRANSFER"}
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
                role="radio"
                aria-checked={paymentMethod === "PAYHERE"}
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
                      ? `Disabled (> ${formatLKR(PAYHERE_MAX_TOTAL_LKR)})`
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
                    Our PayHere card payment gateway is undergoing bank activation review. Please complete your order securely using <strong>Cash on Delivery (COD)</strong> or <strong>Direct Bank Transfer</strong>.
                  </p>
                </div>
              </div>
            )}

            {IS_PAYMENT_GATEWAY_ENABLED && isPayHereLimitExceeded && (
              <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-200 block">
                    Online Card Payment Unavailable for Orders Over {formatLKR(PAYHERE_MAX_TOTAL_LKR)}
                  </span>
                  <p className="text-[11px] text-amber-300/80 leading-relaxed">
                    The online payment gateway supports card transactions up to <strong>{formatLKR(PAYHERE_MAX_TOTAL_LKR)}</strong> per payment. Please complete your order using <strong>Cash on Delivery (COD)</strong> or <strong>Direct Bank Transfer</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT 1: COD */}
            {paymentMethod === "COD" && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs animate-fade-in">
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
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-200 uppercase tracking-wider">
                      Bank Account Details for GizmoTek LK
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Amount to transfer: <strong className="text-cyan-400">{formatLKR(totalAmount)}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {BANK_ACCOUNTS.map((bank) => (
                      <div key={bank.accountNumber} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="font-bold text-slate-200 text-xs">{bank.bankName}</div>
                        <div className="text-[11px] text-cyan-400 font-mono mt-1 select-all">{bank.accountNumber}</div>
                        <div className="text-[10px] text-slate-400">{bank.accountName}</div>
                        <div className="text-[9px] text-slate-500">{bank.branch}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload Field */}
                <div
                  className={`p-4 rounded-2xl bg-slate-950 border border-dashed space-y-3 text-center transition-colors ${
                    fieldErrors.slip ? "border-rose-500/60" : slip ? "border-emerald-500/50" : "border-cyan-500/40"
                  }`}
                >
                  {slip && !slip.isPdf ? (
                    <img
                      src={slip.dataUrl}
                      alt="Bank slip preview"
                      className="mx-auto max-h-40 rounded-xl border border-slate-800 object-contain animate-fade-in"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
                      {slip?.isPdf ? <FileText className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-200 text-xs">Attach Bank Deposit Slip Screenshot *</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supported formats: JPG, PNG, PDF. Photos are automatically optimised.
                    </p>
                  </div>

                  <input
                    type="file"
                    accept="image/*,application/pdf,.pdf"
                    onChange={handleSlipChange}
                    className="sr-only"
                    id="field-slip"
                  />
                  <label
                    htmlFor="field-slip"
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-cyan-400 font-bold px-4 py-2 rounded-xl border border-slate-700 cursor-pointer text-xs transition-colors"
                  >
                    {isProcessingSlip ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing slip...</span>
                      </>
                    ) : (
                      <span>{slip ? "Change Slip File" : "Choose File / Take Photo"}</span>
                    )}
                  </label>

                  <FieldError id="error-slip" message={fieldErrors.slip} />

                  {slip && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-center justify-between gap-2 text-xs animate-fade-in">
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold min-w-0">
                        <FileCheck className="w-4 h-4 shrink-0" />
                        <span className="truncate">Slip attached ({slip.fileName}, {slip.sizeLabel})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSlip(null)}
                        className="text-[10px] text-slate-400 hover:text-rose-300 cursor-pointer shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: PAYHERE GATEWAY */}
            {paymentMethod === "PAYHERE" && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs animate-fade-in">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                    <span>PayHere Sri Lanka Online Payment (Visa / Master)</span>
                  </span>
                  <span className="text-[10px] bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 px-2.5 py-0.5 rounded-full font-mono shrink-0">
                    +4% Gateway Fee
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed">
                  You will be securely redirected to <strong>PayHere Payment Gateway</strong> to complete card payment of <strong className="text-cyan-400 font-bold">{formatLKR(totalAmount)}</strong> (items {formatLKR(subtotal)} + delivery {shippingFee === 0 ? "FREE" : formatLKR(shippingFee)} + 4% gateway processing {formatLKR(gatewayFee)}).
                </p>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-300 font-semibold">Accepted Sri Lanka Payment Options:</span>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-cyan-400">
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Visa / Master</span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">KOKO PayLater</span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">eZ Cash / mCash</span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Frimi / Genie</span>
                  </div>
                </div>
              </div>
            )}
          </fieldset>
        </div>

        {/* Right: Order Summary Sidebar (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 lg:sticky lg:top-32">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-base">Order Summary</h3>
              {isSyncingCart && (
                <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                  Checking prices…
                </span>
              )}
            </div>

            {/* Items */}
            <div className={`space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-800 transition-opacity ${isSyncingCart ? "opacity-60" : ""}`}>
              {items.map((item) => {
                const { product, quantity, selectedColor, selectedVariant } = item;
                const thumb = safeParseImages(product.images)[0] || FALLBACK_PRODUCT_IMAGE;
                return (
                  <div key={getCartItemKey(item)} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                        <OptimizedImage src={thumb} alt={product.title} fill />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-200 line-clamp-1">{product.title}</h4>
                        <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-x-2 mt-0.5">
                          <span>Qty: {quantity}</span>
                          {selectedColor && <span className="text-cyan-400">Color: {selectedColor}</span>}
                          {selectedVariant && <span className="text-cyan-400">{selectedVariant}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-slate-200 shrink-0">{formatLKR(product.sellingPriceLkr * quantity)}</span>
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
                {shippingFee === 0 ? (
                  <span className="font-bold text-emerald-400">FREE</span>
                ) : (
                  <span className="font-semibold text-slate-200">{formatLKR(shippingFee)}</span>
                )}
              </div>
              {shippingFee > 0 && (
                <p className="text-[10px] text-slate-500 -mt-1">
                  Add {formatLKR(FREE_SHIPPING_THRESHOLD_LKR - subtotal)} more for free delivery.
                </p>
              )}

              {isCardPayment && (
                <div className="flex justify-between text-cyan-400">
                  <span>Payment Gateway Fee (4%)</span>
                  <span className="font-bold font-mono">+{formatLKR(gatewayFee)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-extrabold text-white pt-3 border-t border-slate-800">
                <span>Total Amount (LKR)</span>
                <span className="text-cyan-400 text-lg">{formatLKR(totalAmount)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || isProcessingSlip}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 text-slate-950 font-extrabold text-sm py-4 rounded-xl shadow-neon transition-all disabled:opacity-60 disabled:cursor-wait cursor-pointer active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{paymentMethod === "PAYHERE" ? "Redirecting to PayHere..." : "Placing Your Order..."}</span>
                </>
              ) : (
                <>
                  <span>{paymentMethod === "PAYHERE" ? "Pay Securely & Place Order" : "Complete Order & Dispatch"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              By placing your order you agree to our{" "}
              <Link to="/terms-and-conditions" className="text-cyan-400 hover:underline">Terms</Link> &amp;{" "}
              <Link to="/return-policy" className="text-cyan-400 hover:underline">Return Policy</Link>.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
