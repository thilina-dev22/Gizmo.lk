import React, { useState, useEffect } from "react";
import { formatLKR } from "@/lib/utils";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import {
  Download,
  Eye,
  FileCheck,
  X,
  Package,
  Printer,
  MapPin,
  Phone,
  User,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { OrderInvoiceModal } from "@/components/common/OrderInvoiceModal";

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedSlipOrder, setSelectedSlipOrder] = useState<any | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?status=${statusFilter}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) {
      console.error("Orders fetch error:", e);
      setOrders([]);
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

  const handleApproveSlip = async (order: any) => {
    await handleUpdateStatus(order.id, "PROCESSING", "PAID");
    setSelectedSlipOrder(null);
    if (selectedOrderDetails?.id === order.id) {
      setSelectedOrderDetails({ ...selectedOrderDetails, orderStatus: "PROCESSING", paymentStatus: "PAID" });
    }
    setActionFeedback(`✅ Order #${order.orderNumber} Bank Deposit Slip Approved! Status updated to PAID & PROCESSING.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleDeclineSlip = async (order: any) => {
    await handleUpdateStatus(order.id, "CANCELLED", "FAILED");
    setSelectedSlipOrder(null);
    if (selectedOrderDetails?.id === order.id) {
      setSelectedOrderDetails({ ...selectedOrderDetails, orderStatus: "CANCELLED", paymentStatus: "FAILED" });
    }
    setActionFeedback(`❌ Order #${order.orderNumber} Bank Slip Declined. Status set to FAILED & CANCELLED.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Order Management &amp; Courier Dispatch
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Filter orders by status, inspect customer ordered items, verify bank deposit slips, and download courier shipping manifests.
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

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold">
        {[
          { id: "ALL", label: "All Orders" },
          { id: "PROCESSING", label: "Paid & Processing" },
          { id: "PENDING", label: "Pending COD/Bank" },
          { id: "SHIPPED", label: "Dispatched (Courier)" },
          { id: "DELIVERED", label: "Delivered" },
          { id: "CANCELLED", label: "Cancelled / Failed" },
        ].map((st) => (
          <button
            key={st.id}
            onClick={() => setStatusFilter(st.id)}
            className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === st.id
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950">
              <tr>
                <th className="p-4">Order No &amp; Date</th>
                <th className="p-4">Customer &amp; Contact</th>
                <th className="p-4">Address &amp; District</th>
                <th className="p-4">Ordered Items</th>
                <th className="p-4">Method &amp; Status</th>
                <th className="p-4">Total Amount (LKR)</th>
                <th className="p-4">Invoice PDF</th>
                <th className="p-4 text-right">Update Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Loading orders database...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No orders found for filter status &quot;{statusFilter}&quot;.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const itemsCount = order.items ? order.items.length : 0;
                  const isPaid = order.paymentStatus === "PAID";
                  const isFailed = order.paymentStatus === "FAILED" || order.orderStatus === "CANCELLED";

                  return (
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
                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-400 px-3 py-1.5 rounded-lg border border-slate-800 font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>View {itemsCount} Item{itemsCount > 1 ? "s" : ""}</span>
                        </button>
                      </td>
                      <td className="p-4 space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold text-[10px] text-slate-300">
                            {order.paymentMethod === "PAYHERE" ? "CARD (PAYHERE)" : order.paymentMethod}
                          </span>
                          {order.bankSlipUrl && (
                            <button
                              onClick={() => setSelectedSlipOrder(order)}
                              className="text-cyan-300 hover:text-white font-semibold text-[10px] flex items-center gap-1 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/40 shadow-sm hover:bg-cyan-900 transition-colors cursor-pointer"
                              title="Click to inspect deposit slip screenshot and approve/decline payment"
                            >
                              <Eye className="w-3 h-3 text-cyan-400" />
                              <span>View Slip</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              isPaid
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : isFailed
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {isPaid ? "● PAID" : isFailed ? "✕ FAILED" : "○ UNPAID / PENDING"}
                          </span>

                          {/* Quick Approve / Decline buttons right in table for pending bank slips */}
                          {order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus === "PENDING" && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleApproveSlip(order)}
                                className="p-1 px-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded border border-emerald-500/40 text-[9px] font-bold transition-colors cursor-pointer"
                                title="Approve Bank Slip"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleDeclineSlip(order)}
                                className="p-1 px-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded border border-rose-500/40 text-[9px] font-bold transition-colors cursor-pointer"
                                title="Decline Bank Slip"
                              >
                                ✕ Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-cyan-400 font-mono">
                        {formatLKR(order.totalLkr)}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="inline-flex items-center gap-1 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px] font-medium transition-colors cursor-pointer"
                          title="Print / Save PDF Invoice"
                        >
                          <Printer className="w-3.5 h-3.5 text-cyan-400" />
                          <span>PDF</span>
                        </button>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Full Items & Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setSelectedOrderDetails(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-950 border border-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">Order Invoice & Items Details</span>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
                  <span>Order #{selectedOrderDetails.orderNumber}</span>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    {selectedOrderDetails.orderStatus}
                  </span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Placed on {new Date(selectedOrderDetails.createdAt).toLocaleString("en-LK")}
                </span>
              </div>
            </div>

            {/* Customer & Shipping Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div className="space-y-1.5">
                <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Customer Details</span>
                </div>
                <div className="text-slate-300 font-semibold">{selectedOrderDetails.customerName}</div>
                <div className="text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>{selectedOrderDetails.customerPhone}</span>
                </div>
                {selectedOrderDetails.customerEmail && (
                  <div className="text-slate-400 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-blue-400" />
                    <span>{selectedOrderDetails.customerEmail}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Delivery Address (Sri Lanka)</span>
                </div>
                <div className="text-slate-300">{selectedOrderDetails.address}</div>
                <div className="text-cyan-400 font-bold">{selectedOrderDetails.city}, {selectedOrderDetails.district}</div>
                <div className="text-[10px] text-slate-400">
                  Payment: <strong className="text-slate-200">{selectedOrderDetails.paymentMethod}</strong> ({selectedOrderDetails.paymentStatus})
                </div>
              </div>
            </div>

            {/* Ordered Products Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-cyan-400" />
                <span>Purchased Tech Items ({selectedOrderDetails.items?.length || 0})</span>
              </h4>

              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase text-slate-400 bg-slate-900 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {selectedOrderDetails.items?.map((item: any) => {
                      const product = item.product || {};
                      const imgs = JSON.parse(product.images || "[]");
                      const mainImg = imgs[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop";
                      const lineTotal = item.unitPrice * item.quantity;
                      return (
                        <tr key={item.id}>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                                <OptimizedImage src={mainImg} alt={product.title || "Product"} fill />
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-100 line-clamp-1">{product.title || "Product"}</h5>
                                <span className="text-[10px] text-cyan-400 font-mono">SKU: {product.sku || "N/A"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-200">{item.quantity}</td>
                          <td className="p-3 text-right font-mono text-slate-400">{formatLKR(item.unitPrice)}</td>
                          <td className="p-3 text-right font-mono font-bold text-cyan-400">{formatLKR(lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal:</span>
                <span className="font-mono text-slate-200">{formatLKR(selectedOrderDetails.subtotalLkr)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Islandwide Courier Shipping Fee:</span>
                <span className="font-mono text-slate-200">{formatLKR(selectedOrderDetails.shippingFeeLkr)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-cyan-400 pt-2 border-t border-slate-800">
                <span>Grand Total:</span>
                <span className="font-mono">{formatLKR(selectedOrderDetails.totalLkr)}</span>
              </div>
            </div>

            {/* Action buttons */}
            {/* Bank Slip Review Box inside Order Details if present */}
            {selectedOrderDetails.bankSlipUrl && (
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-cyan-400" />
                    <span>Bank Deposit Slip Attached</span>
                  </span>
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                      selectedOrderDetails.paymentStatus === "PAID"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    Payment: {selectedOrderDetails.paymentStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <button
                    onClick={() => setSelectedSlipOrder(selectedOrderDetails)}
                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-cyan-400 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Slip Screenshot</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveSlip(selectedOrderDetails)}
                      className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Slip (Mark Paid)</span>
                    </button>
                    <button
                      onClick={() => handleDeclineSlip(selectedOrderDetails)}
                      className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline Slip</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setSelectedInvoiceOrder(selectedOrderDetails);
                  setSelectedOrderDetails(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>View Full PDF Invoice</span>
              </button>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Bank Deposit Slip Verification Modal with Approve & Decline Actions */}
      {selectedSlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 relative max-h-[92vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setSelectedSlipOrder(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-950 border border-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title & Order Summary */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Bank Transfer Verification
              </span>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <span>Order #{selectedSlipOrder.orderNumber}</span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    selectedSlipOrder.paymentStatus === "PAID"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : selectedSlipOrder.paymentStatus === "FAILED"
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {selectedSlipOrder.paymentStatus === "PAID" ? "● PAID & VERIFIED" : selectedSlipOrder.paymentStatus === "FAILED" ? "✕ FAILED" : "○ UNPAID / AWAITING APPROVAL"}
                </span>
              </h3>
            </div>

            {/* Verification Detail Strip */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Customer Name</span>
                <strong className="text-slate-200">{selectedSlipOrder.customerName}</strong>
                <div className="text-[10px] text-slate-400">{selectedSlipOrder.customerPhone}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Expected Deposit Amount</span>
                <strong className="text-base font-extrabold text-cyan-400 font-mono">
                  {formatLKR(selectedSlipOrder.totalLkr)}
                </strong>
                <div className="text-[10px] text-slate-400">{selectedSlipOrder.city}, {selectedSlipOrder.district}</div>
              </div>
            </div>

            {/* Slip Image Container */}
            <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group">
              <OptimizedImage
                src={selectedSlipOrder.bankSlipUrl}
                alt="Bank Deposit Slip Screenshot"
                fill
                className="object-contain"
              />
              <a
                href={selectedSlipOrder.bankSlipUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute top-3 right-3 bg-slate-900/90 hover:bg-slate-900 text-cyan-400 p-2 rounded-xl border border-slate-700 text-xs flex items-center gap-1.5 shadow-lg opacity-80 group-hover:opacity-100 transition-opacity"
                title="Open full size image in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Full Size</span>
              </a>
            </div>

            {/* Primary Approve / Decline Actions */}
            <div className="pt-2 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Approve Button */}
                <button
                  onClick={() => handleApproveSlip(selectedSlipOrder)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold py-3 px-4 rounded-xl text-xs shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve &amp; Mark as PAID</span>
                </button>

                {/* Decline Button */}
                <button
                  onClick={() => handleDeclineSlip(selectedSlipOrder)}
                  className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 font-bold py-3 px-4 rounded-xl text-xs border border-rose-500/40 transition-all cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Decline Slip (Invalid/Fake)</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>* Approving updates order to PAID &amp; PROCESSING.</span>
                <button
                  onClick={() => setSelectedSlipOrder(null)}
                  className="text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Keep Pending &amp; Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Invoice PDF Modal */}
      {selectedInvoiceOrder && (
        <OrderInvoiceModal
          order={selectedInvoiceOrder}
          isOpen={!!selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
