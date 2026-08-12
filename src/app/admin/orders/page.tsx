"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { formatLKR } from "@/lib/utils";
import { Download, Eye, FileCheck, CheckCircle2, Truck, RefreshCw, X, ShieldAlert } from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, orderStatus: string, paymentStatus?: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, orderStatus, paymentStatus }),
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Order Management & Courier Dispatch
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Filter orders by status, verify bank deposit slips, and download courier shipping manifests.
          </p>
        </div>

        <a
          href="/api/admin/export-orders"
          download
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Courier CSV (Koombiyo / PromptX)</span>
        </a>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold">
        {["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
              statusFilter === st
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
            }`}
          >
            {st === "ALL" ? "All Orders" : st}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950">
              <tr>
                <th className="p-4">Order No & Date</th>
                <th className="p-4">Customer & Contact</th>
                <th className="p-4">Address & District</th>
                <th className="p-4">Method & Slip</th>
                <th className="p-4">Total Amount (LKR)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Update Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading orders database...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No orders found for filter status &quot;{statusFilter}&quot;.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-850 transition-colors">
                    <td className="p-4">
                      <div className="font-mono font-bold text-cyan-400 text-xs">{order.orderNumber}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString("en-LK", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{order.customerName}</div>
                      <div className="text-[11px] text-slate-400">{order.customerPhone}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-300 line-clamp-1 max-w-[180px]">{order.address}</div>
                      <span className="text-[10px] font-bold text-cyan-400">{order.city}, {order.district}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-medium text-[10px]">
                          {order.paymentMethod}
                        </span>
                        {order.bankSlipUrl && (
                          <button
                            onClick={() => setSelectedSlipUrl(order.bankSlipUrl)}
                            className="text-cyan-400 hover:text-cyan-300 font-semibold text-[10px] flex items-center gap-1 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30"
                          >
                            <Eye className="w-3 h-3" /> Slip
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-cyan-400 font-mono">
                      {formatLKR(order.totalLkr)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          order.orderStatus === "DELIVERED"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : order.orderStatus === "SHIPPED"
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-1.5 text-xs font-semibold focus:border-cyan-500 outline-none cursor-pointer"
                      >
                        <option value="PENDING" className="bg-slate-900">PENDING</option>
                        <option value="PROCESSING" className="bg-slate-900">PROCESSING</option>
                        <option value="SHIPPED" className="bg-slate-900">SHIPPED</option>
                        <option value="DELIVERED" className="bg-slate-900">DELIVERED</option>
                        <option value="CANCELLED" className="bg-slate-900">CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank Deposit Slip Preview Modal */}
      {selectedSlipUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 relative">
            <button
              onClick={() => setSelectedSlipUrl(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-950 border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>Uploaded Bank Transfer Slip Verification</span>
            </h3>

            <div className="relative h-80 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
              <Image src={selectedSlipUrl} alt="Bank Slip Screenshot" fill className="object-contain" />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedSlipUrl(null)}
                className="bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
