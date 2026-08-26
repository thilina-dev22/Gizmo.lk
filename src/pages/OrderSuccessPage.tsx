import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { formatLKR } from "@/lib/utils";
import { CheckCircle2, Truck, Phone, Home, Building2, Printer, FileText, Download } from "lucide-react";
import { OrderInvoiceModal } from "@/components/common/OrderInvoiceModal";
import { SEOHead } from "@/components/common/SEOHead";

export function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") || searchParams.get("orderId");
  const orderNumberParam = searchParams.get("orderNumber");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(!!id);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`/api/orders?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8">
      <SEOHead title="Order Confirmed | GizmoTek.lk" noIndex={true} />

      {/* Animated Success Badge */}
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
        <CheckCircle2 className="w-10 h-10 animate-bounce" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
          Order Successfully Placed
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Thank You For Shopping at GizmoTek.lk!
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Your order <strong className="text-cyan-400 font-mono">{order?.orderNumber || orderNumberParam || "GZ-STORE"}</strong> has been confirmed and queued for islandwide dispatch.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading order summary...</span>
        </div>
      ) : order ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left space-y-6">
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
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Truck className="w-4 h-4" />
                <span>Preparing Package (2-4 Days)</span>
              </div>
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
                  <div key={item.id} className="py-2 flex justify-between items-center text-xs">
                    <span className="text-slate-300">
                      {item.product?.title || "Tech Product"} <strong className="text-cyan-400">x{item.quantity}</strong>
                    </span>
                    <span className="font-bold text-slate-200">{formatLKR(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Breakdown */}
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
            <span className="text-slate-300">Total Charged</span>
            <span className="text-cyan-400 text-lg">{formatLKR(order.totalLkr)}</span>
          </div>

          {/* Special Bank Note */}
          {order.paymentMethod === "BANK_TRANSFER" && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Your uploaded payment slip is being verified by our finance team.</span>
            </div>
          )}

          {/* Download PDF Invoice Button */}
          <div className="pt-2">
            <button
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
          href="https://wa.me/94721410369"
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
