import React, { useState, useEffect } from "react";
import { formatLKR } from "@/lib/utils";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { Download, Eye, FileCheck, X, Package, Printer, MapPin, Phone, User, Mail, FileText } from "lucide-react";
import { OrderInvoiceModal } from "@/components/common/OrderInvoiceModal";

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);

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
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold text-[10px] text-slate-300">
                            {order.paymentMethod === "PAYHERE" ? "CARD (PAYHERE)" : order.paymentMethod}
                          </span>
                          {order.bankSlipUrl && (
                            <button
                              onClick={() => setSelectedSlipUrl(order.bankSlipUrl)}
                              className="text-cyan-400 hover:text-cyan-300 font-semibold text-[10px] flex items-center gap-1 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" /> Slip
                            </button>
                          )}
                        </div>
                        <div>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              isPaid
                                ? "bg-emerald-500/20 text-emerald-400"
                                : isFailed
                                ? "bg-rose-500/20 text-rose-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {isPaid ? "● PAID" : isFailed ? "✕ FAILED" : "○ UNPAID / PENDING"}
                          </span>
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
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {selectedOrderDetails.bankSlipUrl ? (
                <button
                  onClick={() => setSelectedSlipUrl(selectedOrderDetails.bankSlipUrl)}
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Bank Slip</span>
                </button>
              ) : (
                <div></div>
              )}

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Dispatch Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Deposit Slip Preview Modal */}
      {selectedSlipUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 relative">
            <button
              onClick={() => setSelectedSlipUrl(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-950 border border-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>Uploaded Bank Transfer Slip Verification</span>
            </h3>

            <div className="relative h-80 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
              <OptimizedImage src={selectedSlipUrl} alt="Bank Slip Screenshot" fill className="object-contain" />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedSlipUrl(null)}
                className="bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Close Verification
              </button>
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
