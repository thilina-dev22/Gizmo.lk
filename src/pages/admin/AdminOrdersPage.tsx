import React, { useState, useEffect, useMemo } from "react";
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
  Search,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Filter,
} from "lucide-react";
import { OrderInvoiceModal } from "@/components/common/OrderInvoiceModal";

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [datePreset, setDatePreset] = useState<"ALL_TIME" | "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "THIS_MONTH" | "CUSTOM">("ALL_TIME");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      const [filterRes, allRes] = await Promise.all([
        fetch(`/api/orders?status=${statusFilter}`),
        fetch("/api/orders?status=ALL"),
      ]);
      const filterData = await filterRes.json();
      const allData = await allRes.json();
      setOrders(filterData.orders || []);
      setAllOrders(allData.orders || []);
    } catch (e) {
      console.error("Orders fetch error:", e);
      setOrders([]);
      setAllOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by date range
  const dateFilteredOrders = useMemo(() => {
    const now = new Date();

    return orders.filter((order) => {
      if (!order.createdAt) return true;
      const orderDate = new Date(order.createdAt);

      if (datePreset === "TODAY") {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        return orderDate >= startOfToday;
      }

      if (datePreset === "YESTERDAY") {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        return orderDate >= startOfYesterday && orderDate <= endOfYesterday;
      }

      if (datePreset === "LAST_7_DAYS") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= sevenDaysAgo;
      }

      if (datePreset === "THIS_MONTH") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        return orderDate >= startOfMonth;
      }

      if (datePreset === "CUSTOM") {
        if (startDate) {
          const start = new Date(startDate + "T00:00:00");
          if (orderDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate + "T23:59:59.999");
          if (orderDate > end) return false;
        }
        return true;
      }

      return true; // ALL_TIME
    });
  }, [orders, datePreset, startDate, endDate]);

  // Tab counts calculated for the active date range
  const tabCounts = useMemo(() => {
    const now = new Date();
    const dateScopedAllOrders = allOrders.filter((order) => {
      if (!order.createdAt) return true;
      const orderDate = new Date(order.createdAt);

      if (datePreset === "TODAY") {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        return orderDate >= startOfToday;
      }
      if (datePreset === "YESTERDAY") {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        return orderDate >= startOfYesterday && orderDate <= endOfYesterday;
      }
      if (datePreset === "LAST_7_DAYS") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= sevenDaysAgo;
      }
      if (datePreset === "THIS_MONTH") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        return orderDate >= startOfMonth;
      }
      if (datePreset === "CUSTOM") {
        if (startDate) {
          const start = new Date(startDate + "T00:00:00");
          if (orderDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate + "T23:59:59.999");
          if (orderDate > end) return false;
        }
        return true;
      }
      return true;
    });

    const counts: Record<string, number> = {
      ALL: dateScopedAllOrders.length,
      PROCESSING: 0,
      PENDING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    dateScopedAllOrders.forEach((o) => {
      if (counts[o.orderStatus] !== undefined) {
        counts[o.orderStatus]++;
      }
    });
    return counts;
  }, [allOrders, datePreset, startDate, endDate]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return dateFilteredOrders;
    const q = searchQuery.toLowerCase().trim();
    return dateFilteredOrders.filter((order) => {
      const orderNum = (order.orderNumber || "").toLowerCase();
      const customer = (order.customerName || "").toLowerCase();
      const phone = (order.customerPhone || "").toLowerCase();
      const email = (order.customerEmail || "").toLowerCase();
      const city = (order.city || "").toLowerCase();
      const district = (order.district || "").toLowerCase();
      const address = (order.address || "").toLowerCase();
      return (
        orderNum.includes(q) ||
        customer.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        city.includes(q) ||
        district.includes(q) ||
        address.includes(q)
      );
    });
  }, [dateFilteredOrders, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, datePreset, startDate, endDate, itemsPerPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const handleUpdateStatus = async (orderId: string, newOrderStatus: string, newPaymentStatus?: string) => {
    try {
      const targetOrder = orders.find((o) => o.id === orderId);
      let resolvedPaymentStatus = newPaymentStatus;
      if (newOrderStatus === "DELIVERED" && targetOrder?.paymentMethod === "COD" && !newPaymentStatus) {
        resolvedPaymentStatus = "PAID";
      }
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          orderStatus: newOrderStatus,
          paymentStatus: resolvedPaymentStatus,
        }),
      });
      if (res.ok) {
        if (newOrderStatus === "DELIVERED" && targetOrder?.paymentMethod === "COD") {
          setActionFeedback(`📦 Order #${targetOrder.orderNumber} marked as DELIVERED & COD payment auto-updated to PAID!`);
          setTimeout(() => setActionFeedback(null), 4500);
        }
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentStatus }),
      });
      if (res.ok) {
        setActionFeedback(`💳 Payment status updated to ${paymentStatus}`);
        setTimeout(() => setActionFeedback(null), 3000);
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

  const datePresetLabels: Record<string, string> = {
    ALL_TIME: "All Time",
    TODAY: "Today",
    YESTERDAY: "Yesterday",
    LAST_7_DAYS: "Last 7 Days",
    THIS_MONTH: "This Month",
    CUSTOM: "Custom Range",
  };

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Order Management &amp; Courier Dispatch
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Filter orders by status &amp; date, inspect customer items, verify bank deposit slips, and download courier shipping manifests.
          </p>
        </div>
        <a
          href="/api/admin/export-orders"
          download
          className="inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-850 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 hover:border-emerald-400 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Courier CSV (Koombiyo / PromptX)</span>
        </a>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
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

      {/* Date Range Selection Toolbar */}
      <div className="bg-slate-900/80 p-4 rounded-3xl border border-slate-800 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Filter className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Order Date Scope:</span>
            <strong className="text-cyan-400 font-bold">{datePresetLabels[datePreset]}</strong>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
            {(["ALL_TIME", "TODAY", "YESTERDAY", "LAST_7_DAYS", "THIS_MONTH", "CUSTOM"] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => setDatePreset(preset)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  datePreset === preset
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm font-bold"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-850"
                }`}
              >
                {datePresetLabels[preset]}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Pickers */}
        {datePreset === "CUSTOM" && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Start Date:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-cyan-500 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">End Date:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-cyan-500 cursor-pointer"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Reset Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Tabs with Dynamic Count Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold no-scrollbar">
        {[
          { id: "ALL", label: "All Orders", count: tabCounts.ALL },
          { id: "PROCESSING", label: "Paid & Processing", count: tabCounts.PROCESSING },
          { id: "PENDING", label: "Pending COD/Bank", count: tabCounts.PENDING },
          { id: "SHIPPED", label: "Dispatched (Courier)", count: tabCounts.SHIPPED },
          { id: "DELIVERED", label: "Delivered", count: tabCounts.DELIVERED },
          { id: "CANCELLED", label: "Cancelled / Failed", count: tabCounts.CANCELLED },
        ].map((st) => (
          <button
            key={st.id}
            onClick={() => setStatusFilter(st.id)}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              statusFilter === st.id
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm"
                : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-850"
            }`}
          >
            <span>{st.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                statusFilter === st.id
                  ? "bg-cyan-500/30 text-cyan-200"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {st.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar & Table Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order # (e.g. GZ-14985), Customer, Phone, City..."
            className="w-full bg-slate-950 text-slate-200 pl-10 pr-10 py-2 rounded-xl border border-slate-800 text-xs focus:border-cyan-500 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 w-full sm:w-auto justify-between sm:justify-end">
          <span>
            Found <strong className="text-cyan-400 font-mono">{filteredOrders.length}</strong> order{filteredOrders.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1 text-xs outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950">
              <tr>
                <th className="p-4">Order No &amp; Date</th>
                <th className="p-4">Customer &amp; Contact</th>
                <th className="p-4">Address &amp; District</th>
                <th className="p-4">Ordered Items</th>
                <th className="p-4">Payment Method &amp; Status</th>
                <th className="p-4">Total Amount (LKR)</th>
                <th className="p-4">Invoice PDF</th>
                <th className="p-4 text-right">Order Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Loading orders database...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    {searchQuery
                      ? `No orders matching "${searchQuery}".`
                      : `No orders found for filter "${statusFilter}".`}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const itemsCount = order.items ? order.items.length : 0;
                  const isPaid = order.paymentStatus === "PAID";
                  const isFailed = order.paymentStatus === "FAILED" || order.orderStatus === "CANCELLED";
                  const isBankPending = order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus === "PENDING";

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
                              title="Click to inspect deposit slip screenshot"
                            >
                              <Eye className="w-3 h-3 text-cyan-400" />
                              <span>View Slip</span>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <select
                            value={order.paymentStatus}
                            onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value)}
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded outline-none border cursor-pointer ${
                              isPaid
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : isFailed
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            }`}
                            title="Click to change payment status directly"
                          >
                            <option value="PAID" className="bg-slate-900 text-emerald-400">● PAID</option>
                            <option value="PENDING" className="bg-slate-900 text-amber-400">○ UNPAID / PENDING</option>
                            <option value="FAILED" className="bg-slate-900 text-rose-400">✕ FAILED</option>
                          </select>
                          {isBankPending && (
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
        {filteredOrders.length > 0 && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Showing <strong className="text-slate-200 font-mono">{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
              <strong className="text-slate-200 font-mono">
                {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
              </strong>{" "}
              of <strong className="text-slate-200 font-mono">{filteredOrders.length}</strong> orders
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-slate-600">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[30px] h-[30px] rounded-lg border text-xs font-semibold transition-colors ${
                          currentPage === p
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 font-bold"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

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
