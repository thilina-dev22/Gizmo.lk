import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { formatLKR, getOrderFeeBreakdown } from "@/lib/utils";
import { apiFetch, getErrorMessage, isAbortError } from "@/lib/api";
import {
  CheckCircle2,
  Truck,
  Phone,
  Home,
  Building2,
  FileText,
  Clock,
  XCircle,
  CreditCard,
  Loader2,
} from "lucide-react";
import { OrderInvoiceModal } from "@/components/common/OrderInvoiceModal";
import { Skeleton } from "@/components/common/Skeleton";
import { SEOHead } from "@/components/common/SEOHead";

type PaymentState = "confirmed" | "awaiting-payment" | "payment-cancelled" | "payment-failed";

// After returning from PayHere the payment notification may take a few seconds to arrive
const PAYMENT_POLL_INTERVAL_MS = 3000;
const PAYMENT_POLL_ATTEMPTS = 10;

function getPaymentState(order: any, cancelledByCustomer: boolean): PaymentState {
  if (!order || order.paymentMethod !== "PAYHERE" || order.paymentStatus === "PAID") return "confirmed";
  if (order.paymentStatus === "FAILED" || order.orderStatus === "CANCELLED") return "payment-failed";
  return cancelledByCustomer ? "payment-cancelled" : "awaiting-payment";
}

function OrderSummarySkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left space-y-5" aria-hidden="true">
      <div className="flex justify-between gap-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-10 w-full rounded-2xl" />
    </div>
  );
}

export function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") || searchParams.get("orderId");
  const orderNumberParam = searchParams.get("orderNumber");
  const cancelledByCustomer = searchParams.get("payment") === "cancelled";

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const fetchOrder = useCallback(
    async (signal?: AbortSignal, silent = false) => {
      if (!id) return;
      try {
        const data = await apiFetch<{ order: any }>(`/api/orders/${encodeURIComponent(id)}`, { signal, silent });
        setOrder(data.order);
        setLoadError(null);
      } catch (err) {
        if (isAbortError(err)) return;
        if (!silent) setLoadError(getErrorMessage(err, "We couldn't load your order details."));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchOrder(controller.signal);
    return () => controller.abort();
  }, [fetchOrder]);

  const paymentState = getPaymentState(order, cancelledByCustomer);

  // Poll briefly while PayHere's confirmation is in flight
  useEffect(() => {
    if (paymentState !== "awaiting-payment" || pollAttempts >= PAYMENT_POLL_ATTEMPTS) return;
    const timer = setTimeout(() => {
      setPollAttempts((attempts) => attempts + 1);
      fetchOrder(undefined, true);
    }, PAYMENT_POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [paymentState, pollAttempts, fetchOrder]);

  const isStillConfirming = paymentState === "awaiting-payment" && pollAttempts < PAYMENT_POLL_ATTEMPTS;

  const handleRetryPayment = async () => {
    if (!order) return;
    setRetryingPayment(true);
    setRetryError(null);
    try {
      const { payload } = await apiFetch<{ payload: Record<string, string> }>("/api/payhere/hash", {
        method: "POST",
        body: { orderId: order.id },
      });
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
    } catch (err) {
      setRetryError(getErrorMessage(err, "Couldn't open the payment page. Please contact us on WhatsApp."));
      setRetryingPayment(false);
    }
  };

  const orderNumber = order?.orderNumber || orderNumberParam;
  const fees = order ? getOrderFeeBreakdown(order) : null;

  const header = {
    "confirmed": {
      icon: <CheckCircle2 className="w-10 h-10" />,
      iconClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-950/50",
      eyebrow: order?.paymentMethod === "PAYHERE" ? "Payment Received" : "Order Successfully Placed",
      title: "Thank You For Shopping at GizmoTek.lk!",
      message: "has been confirmed and queued for islandwide dispatch.",
    },
    "awaiting-payment": {
      icon: isStillConfirming ? <Loader2 className="w-10 h-10 animate-spin" /> : <Clock className="w-10 h-10" />,
      iconClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-cyan-950/50",
      eyebrow: isStillConfirming ? "Confirming Payment" : "Payment Pending",
      title: isStillConfirming ? "Confirming your card payment…" : "We haven't received your payment yet",
      message: isStillConfirming
        ? "has been saved. We're waiting for PayHere to confirm your payment."
        : "is on hold until the card payment is completed. You can retry the payment below.",
    },
    "payment-cancelled": {
      icon: <CreditCard className="w-10 h-10" />,
      iconClass: "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-950/50",
      eyebrow: "Payment Not Completed",
      title: "Your card payment was cancelled",
      message: "is saved but not yet paid. Retry the payment below or contact us to switch to Cash on Delivery.",
    },
    "payment-failed": {
      icon: <XCircle className="w-10 h-10" />,
      iconClass: "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-rose-950/50",
      eyebrow: "Payment Failed",
      title: "Your payment could not be completed",
      message: "was cancelled because the card payment failed. No money was taken — please place a new order or contact us.",
    },
  }[paymentState];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8 animate-fade-in">
      <SEOHead title="Order Confirmation | GizmoTek.lk" noIndex={true} />

      {/* Status Badge */}
      {loading ? (
        <Skeleton className="w-20 h-20 rounded-full mx-auto" />
      ) : (
        <div
          className={`w-20 h-20 rounded-full border flex items-center justify-center mx-auto shadow-lg animate-fade-in-up ${header.iconClass}`}
        >
          {header.icon}
        </div>
      )}

      <div className="space-y-2" aria-live="polite">
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">{loading ? "Loading…" : header.eyebrow}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{loading ? "Fetching your order…" : header.title}</h1>
        {orderNumber && !loading && (
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Your order <strong className="text-cyan-400 font-mono">{orderNumber}</strong> {header.message}
          </p>
        )}
      </div>

      {(paymentState === "payment-cancelled" || (paymentState === "awaiting-payment" && !isStillConfirming)) && order && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleRetryPayment}
            disabled={retryingPayment}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-cyan-600 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-sm shadow-neon disabled:opacity-60 cursor-pointer"
          >
            {retryingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            <span>{retryingPayment ? "Opening PayHere…" : `Retry Payment (${formatLKR(order.totalLkr)})`}</span>
          </button>
          {retryError && <p className="text-xs text-rose-400">{retryError}</p>}
        </div>
      )}

      {loading ? (
        <OrderSummarySkeleton />
      ) : loadError ? (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-3">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchOrder();
            }}
            className="text-cyan-400 font-bold hover:underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : order ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left space-y-6 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2 text-xs">
            <div>
              <span className="text-slate-400">Customer:</span>{" "}
              <strong className="text-slate-200">{order.customerName}</strong> ({order.customerPhone})
            </div>
            <div>
              <span className="text-slate-400">Payment:</span>{" "}
              <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded text-[11px] font-bold">
                {order.paymentMethod === "PAYHERE" ? "Online Card (PayHere)" : order.paymentMethod === "COD" ? "Cash On Delivery" : "Bank Deposit Slip"}
              </span>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                Delivery Address
              </span>
              <p className="text-slate-200">{order.address}</p>
              <p className="text-cyan-400 font-medium">{order.city}, {order.district} District</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                Courier Dispatch Status
              </span>
              {paymentState === "confirmed" ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Truck className="w-4 h-4" />
                  <span>Preparing Package (2-4 Days)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Clock className="w-4 h-4" />
                  <span>On hold until payment is completed</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Summary */}
          {order.items && order.items.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                Purchased Tech Gear
              </span>
              <div className="divide-y divide-slate-800/80">
                {order.items.map((item: any) => (
                  <div key={item.id} className="py-2 flex justify-between items-center gap-3 text-xs">
                    <span className="text-slate-300">
                      {item.product?.title || "Tech Product"} <strong className="text-cyan-400">x{item.quantity}</strong>
                    </span>
                    <span className="font-bold text-slate-200 shrink-0">{formatLKR(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Breakdown */}
          {fees && (
            <div className="pt-4 border-t border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="text-slate-200">{formatLKR(fees.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Islandwide Delivery</span>
                <span className={fees.delivery === 0 ? "text-emerald-400 font-bold" : "text-slate-200"}>
                  {fees.delivery === 0 ? "FREE" : formatLKR(fees.delivery)}
                </span>
              </div>
              {fees.gateway > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Payment Gateway Fee (4%)</span>
                  <span className="text-slate-200">{formatLKR(fees.gateway)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-bold pt-2">
                <span className="text-slate-300">
                  {order.paymentMethod === "COD" ? "Amount Payable on Delivery" : "Order Total"}
                </span>
                <span className="text-cyan-400 text-lg">{formatLKR(fees.total)}</span>
              </div>
            </div>
          )}

          {/* Special Bank Note */}
          {order.paymentMethod === "BANK_TRANSFER" && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {order.paymentStatus === "PAID"
                  ? "Your bank transfer has been verified. Thank you!"
                  : "Your uploaded payment slip is being verified by our finance team."}
              </span>
            </div>
          )}

          {/* Download PDF Invoice Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsInvoiceOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-cyan-400 hover:text-cyan-300 font-bold py-3 px-4 rounded-2xl border border-slate-700/80 text-xs transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Download / Print Official PDF Invoice</span>
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          to="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs shadow-neon transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
        <a
          href={`https://wa.me/94721410369${orderNumber ? `?text=${encodeURIComponent(`Hi GizmoTek! I have a question about my order ${orderNumber}.`)}` : ""}`}
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors"
        >
          <Phone className="w-4 h-4" />
          <span>Contact WhatsApp Support</span>
        </a>
      </div>

      {/* Invoice Modal */}
      {order && (
        <OrderInvoiceModal
          order={order}
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}
    </div>
  );
}
