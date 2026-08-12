import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatLKR } from "@/lib/utils";
import { GizmoLogo } from "@/components/logo/GizmoLogo";
import { CheckCircle2, Truck, Phone, Home, FileText, Building2 } from "lucide-react";

interface SuccessPageProps {
  searchParams: {
    orderNumber?: string;
    id?: string;
  };
}

export const revalidate = 0;

export default async function OrderSuccessPage({ searchParams }: SuccessPageProps) {
  const { id } = searchParams;

  let order: any = null;
  if (id) {
    try {
      order = await db.order.findUnique({
        where: { id },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8">
      {/* Animated Success Badge */}
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
        <CheckCircle2 className="w-10 h-10 animate-bounce" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
          Order Successfully Placed
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Thank You For Shopping at Gizmo.lk!
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Your order <strong className="text-cyan-400 font-mono">{order?.orderNumber || searchParams.orderNumber || "GZ-STORE"}</strong> has been confirmed and queued for islandwide dispatch.
        </p>
      </div>

      {order && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2 text-xs">
            <div>
              <span className="text-slate-400">Customer:</span>{" "}
              <strong className="text-slate-200">{order.customerName}</strong> ({order.customerPhone})
            </div>
            <div>
              <span className="text-slate-400">Payment:</span>{" "}
              <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded text-[11px] font-bold">
                {order.paymentMethod === "COD" ? "Cash On Delivery" : order.paymentMethod === "BANK_TRANSFER" ? "Bank Deposit Slip" : "Online Card"}
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
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              Purchased Tech Gear
            </span>
            <div className="divide-y divide-slate-800/80">
              {order.items.map((item: any) => (
                <div key={item.id} className="py-2 flex justify-between items-center text-xs">
                  <span className="text-slate-300">
                    {item.product.title} <strong className="text-cyan-400">x{item.quantity}</strong>
                  </span>
                  <span className="font-bold text-slate-200">{formatLKR(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

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
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs shadow-neon transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
        <a
          href="https://wa.me/94771234567"
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors"
        >
          <Phone className="w-4 h-4" />
          <span>Contact WhatsApp Support</span>
        </a>
      </div>
    </div>
  );
}
